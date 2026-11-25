
import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from './components/DashboardLayout'
import './HRAttendance.css'

interface Attendance {
  id: number
  employeeId: number
  attendanceDate: string
  checkIn: string | null
  checkOut: string | null
  status: string
}

interface Employee {
  id: number
  employeeName: string
  email: string
  department?: string
  jobTitle?: string
}

const API_URL = '/api'

function getArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[]
  }

  if (
    result &&
    typeof result === 'object' &&
    'data' in result &&
    Array.isArray(result.data)
  ) {
    return result.data as T[]
  }

  return []
}

function formatTime(time: string | null) {
  if (!time) return '--'

  const parts = time.split(':')
  const hours = Number(parts[0])
  const minutes = Number(parts[1])

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time
  }

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(date: string) {
  if (!date) return '--'

  const [year, month, day] = date.split('-')

  return `${day}-${month}-${year}`
}

export default function HRAttendance() {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAttendance = useCallback(async () => {
    const token = sessionStorage.getItem('nexushr_token')

    if (!token) {
      setError('Your login session is missing. Please log in again.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [attendanceResponse, employeeResponse] =
        await Promise.all([
          fetch(`${API_URL}/attendance`, { headers }),
          fetch(`${API_URL}/employees`, { headers }),
        ])

      if (
        attendanceResponse.status === 401 ||
        attendanceResponse.status === 403
      ) {
        throw new Error(
          `You do not have permission to view attendance (${attendanceResponse.status}).`
        )
      }

      if (!attendanceResponse.ok) {
        throw new Error(
          `Unable to load attendance (${attendanceResponse.status}).`
        )
      }

      if (!employeeResponse.ok) {
        throw new Error(
          `Unable to load employee details (${employeeResponse.status}).`
        )
      }

      const attendanceResult: unknown =
        await attendanceResponse.json()

      const employeeResult: unknown =
        await employeeResponse.json()

      setAttendance(getArray<Attendance>(attendanceResult))
      setEmployees(getArray<Employee>(employeeResult))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load HR attendance data.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  const employeeMap = useMemo(() => {
    return new Map(
      employees.map(employee => [
        employee.id,
        employee,
      ])
    )
  }, [employees])

  const filteredAttendance = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return attendance.filter(record => {
      const employee = employeeMap.get(record.employeeId)

      const matchesSearch =
        !search ||
        String(record.employeeId).includes(search) ||
        employee?.employeeName?.toLowerCase().includes(search) ||
        employee?.email?.toLowerCase().includes(search)

      const matchesDate =
        !selectedDate ||
        record.attendanceDate === selectedDate

      return matchesSearch && matchesDate
    })
  }, [
    attendance,
    employeeMap,
    searchTerm,
    selectedDate,
  ])

  const presentCount = filteredAttendance.filter(
    record => record.status?.toUpperCase() === 'PRESENT'
  ).length

  const lateCount = filteredAttendance.filter(
    record => record.status?.toUpperCase() === 'LATE'
  ).length

  const pendingCheckoutCount = filteredAttendance.filter(
    record => record.checkIn && !record.checkOut
  ).length

  return (
    <DashboardLayout title="Attendance Management">
      <div className="hr-attendance-page">

        {/* Page toolbar - title is already in DashboardLayout */}
        <div className="hr-attendance-toolbar">
          <div>
            <p className="hr-attendance-eyebrow">
              NEXUSHR / HUMAN RESOURCES
            </p>

            <p>
              Monitor employee attendance and working hours.
            </p>
          </div>

          <button
            type="button"
            className="hr-attendance-refresh"
            onClick={loadAttendance}
            disabled={loading}
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>

        {/* Attendance statistics */}
        <section className="hr-attendance-stats">

          <div className="hr-attendance-stat-card">
            <span className="stat-icon">👥</span>
            <p>Total Employees</p>
            <h2>{employees.length}</h2>
          </div>

          <div className="hr-attendance-stat-card">
            <span className="stat-icon">✅</span>
            <p>Present Records</p>
            <h2>{presentCount}</h2>
          </div>

          <div className="hr-attendance-stat-card">
            <span className="stat-icon">⏰</span>
            <p>Late Records</p>
            <h2>{lateCount}</h2>
          </div>

          <div className="hr-attendance-stat-card">
            <span className="stat-icon">⌛</span>
            <p>Pending Check-outs</p>
            <h2>{pendingCheckoutCount}</h2>
          </div>

        </section>

        {/* Search and filters */}
        <section className="hr-attendance-filter-section">

          <div className="hr-attendance-filter-heading">
            <div>
              <h2>Employee Attendance Records</h2>
              <p>Search and filter attendance information.</p>
            </div>
          </div>

          <div className="hr-attendance-filters">

            <div className="hr-attendance-search">
              <label htmlFor="attendance-search">
                Search Employee
              </label>

              <input
                id="attendance-search"
                type="text"
                placeholder="Search by name, email or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="hr-attendance-date-filter">
              <label htmlFor="attendance-date">
                Filter by Date
              </label>

              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="hr-attendance-clear"
              onClick={() => {
                setSearchTerm('')
                setSelectedDate('')
              }}
            >
              Clear Filters
            </button>

          </div>
        </section>

        {/* Error message */}
        {error && (
          <div className="hr-attendance-error">
            {error}

            <button
              type="button"
              onClick={loadAttendance}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Attendance records table */}
        <section className="hr-attendance-table-section">

          {loading ? (
            <p className="hr-attendance-message">
              Loading attendance records...
            </p>
          ) : !error && filteredAttendance.length === 0 ? (
            <p className="hr-attendance-message">
              No attendance records found for the selected filters.
            </p>
          ) : !error ? (
            <>
              <div className="hr-attendance-result-count">
                Showing {filteredAttendance.length} attendance records
              </div>

              <div className="hr-attendance-table-wrapper">
                <table className="hr-attendance-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAttendance.map(record => {
                      const employee = employeeMap.get(
                        record.employeeId
                      )

                      const status = (
                        record.status || 'NOT MARKED'
                      ).toUpperCase()

                      return (
                        <tr key={record.id}>
                          <td>EMP-{record.employeeId}</td>

                          <td>
                            {employee?.employeeName ||
                              'Employee not found'}
                          </td>

                          <td>
                            {employee?.department || '--'}
                          </td>

                          <td>
                            {formatDate(record.attendanceDate)}
                          </td>

                          <td>
                            {formatTime(record.checkIn)}
                          </td>

                          <td>
                            {formatTime(record.checkOut)}
                          </td>

                          <td>
                            <span
                              className={`hr-attendance-status ${status
                                .toLowerCase()
                                .replace(/\s+/g, '-')}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

        </section>

      </div>
    </DashboardLayout>
  )
}

