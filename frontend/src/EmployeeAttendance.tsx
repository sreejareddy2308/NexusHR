
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './EmployeeAttendance.css'

interface AttendanceRecord {
  id: number
  employeeId: number
  attendanceDate: string
  checkIn: string | null
  checkOut: string | null
  status: string
  workingMinutes?: number | null
  overtimeMinutes?: number | null
  lateArrival?: boolean
  earlyDeparture?: boolean
}

const API_URL = '/api/attendance'

export default function EmployeeAttendance() {
  const navigate = useNavigate()

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const [processingAction, setProcessingAction] = useState<
    'check-in' | 'check-out' | null
  >(null)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const token = sessionStorage.getItem('nexushr_token')

  // Today's date in local timezone
  const today = (() => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  })()

  const currentMonth = today.substring(0, 7)

  // Today's attendance
  const todayRecord = records.find(
    record => record.attendanceDate === today
  )

  const hasCheckedIn = Boolean(todayRecord?.checkIn)
  const hasCheckedOut = Boolean(todayRecord?.checkOut)

  // Current month's attendance
  const monthlyRecords = records.filter(record =>
    record.attendanceDate?.startsWith(currentMonth)
  )

  const recordedDays = monthlyRecords.length

  const presentDays = monthlyRecords.filter(
    record => record.status?.toUpperCase() === 'PRESENT'
  ).length

  const halfDays = monthlyRecords.filter(
    record => record.status?.toUpperCase() === 'HALF_DAY'
  ).length

  const completedDays = monthlyRecords.filter(
    record => record.checkIn && record.checkOut
  ).length

  // Calculate working minutes
  // Standard schedule: 9 AM - 6 PM
  // Lunch break: 1 PM - 2 PM
  const getWorkingMinutes = (
    record: AttendanceRecord
  ): number => {
    if (typeof record.workingMinutes === 'number') {
      return record.workingMinutes
    }

    if (!record.checkIn || !record.checkOut) {
      return 0
    }

    const toMinutes = (time: string): number => {
      const [hours, minutes, seconds = 0] =
        time.split(':').map(Number)

      if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes) ||
        !Number.isFinite(seconds)
      ) {
        return 0
      }

      return hours * 60 + minutes + seconds / 60
    }

    const start = toMinutes(record.checkIn)
    let end = toMinutes(record.checkOut)

    if (end < start) {
      end += 1440
    }

    const breakStart = 13 * 60
    const breakEnd = 14 * 60

    const breakOverlap = Math.max(
      0,
      Math.min(end, breakEnd) -
      Math.max(start, breakStart)
    )

    return Math.max(
      0,
      Math.floor(end - start - breakOverlap)
    )
  }

  // Calculate monthly working time
  const totalWorkingMinutes = monthlyRecords.reduce(
    (total, record) =>
      total + getWorkingMinutes(record),
    0
  )

  // Calculate monthly overtime
  const getOvertimeMinutes = (
    record: AttendanceRecord
  ): number => {
    if (typeof record.overtimeMinutes === 'number') {
      return record.overtimeMinutes
    }

    return Math.max(
      0,
      getWorkingMinutes(record) - 480
    )
  }

  const totalOvertimeMinutes = monthlyRecords.reduce(
    (total, record) =>
      total + getOvertimeMinutes(record),
    0
  )

  // Late arrivals
  const lateArrivalDays = monthlyRecords.filter(record => {
    if (typeof record.lateArrival === 'boolean') {
      return record.lateArrival
    }

    if (!record.checkIn) return false

    return record.checkIn > '09:00:00'
  }).length

  // Early departures
  const earlyDepartureDays = monthlyRecords.filter(record => {
    if (typeof record.earlyDeparture === 'boolean') {
      return record.earlyDeparture
    }

    if (!record.checkOut) return false

    return record.checkOut < '18:00:00'
  }).length

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return `${hours}h ${remainingMinutes}m`
  }

  // Load attendance history
  const loadAttendance = useCallback(async () => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        setError(
          `Attendance access failed (${response.status}). Please check your login session and permissions.`
        )
        return
      }

      if (!response.ok) {
        throw new Error(
          `Unable to load attendance history (${response.status}).`
        )
      }

      const data = await response.json()

      const attendanceData = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : []

      setRecords(attendanceData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading attendance.'
      )
    } finally {
      setLoading(false)
    }
  }, [token, navigate])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  // Check-in and check-out
  const handleAttendanceAction = async (
    action: 'check-in' | 'check-out'
  ) => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    try {
      setProcessing(true)
      setProcessingAction(action)
      setError('')
      setMessage('')

      const method = action === 'check-in' ? 'POST' : 'PUT'

      const response = await fetch(
        `${API_URL}/me/${action}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json().catch(() => null)

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Attendance operation denied (${response.status}). Check your permissions.`
        )
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          `Unable to ${action}. Please try again.`
        )
      }

      setMessage(
        action === 'check-in'
          ? 'Your check-in was recorded successfully!'
          : 'Your check-out was recorded successfully!'
      )

      await loadAttendance()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Attendance operation failed.'
      )
    } finally {
      setProcessing(false)
      setProcessingAction(null)
    }
  }

  // Format time
  const formatTime = (time: string | null): string => {
    if (!time) return '--'

    const [hours, minutes] = time.split(':')

    const date = new Date()

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    )

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format date
  const formatDate = (date: string): string => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      undefined,
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  // Get status CSS class
  const getStatusClass = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'PRESENT':
        return 'status-present'

      case 'HALF_DAY':
        return 'status-half-day'

      case 'ABSENT':
        return 'status-absent'

      default:
        return 'status-default'
    }
  }

  return (
    <div className="attendance-page">

      {/* Toolbar */}
      <div className="attendance-toolbar">
        <p>
          Track your daily working hours and attendance history.
        </p>

        <button
          className="attendance-back-button"
          onClick={() => navigate('/employee')}
        >
          ← Dashboard
        </button>
      </div>

      {/* Today's Date and Status */}
      <section className="attendance-date-card">

        <div className="attendance-date-info">
          <span>Today's Date</span>

          <h2>
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </h2>
        </div>

        <div className="attendance-status">
          <span>Status</span>

          <strong
            className={
              todayRecord
                ? getStatusClass(todayRecord.status)
                : 'not-marked'
            }
          >
            {todayRecord?.status || 'NOT MARKED'}
          </strong>
        </div>

      </section>

      {/* Error Message */}
      {error && (
        <div className="attendance-alert error">
          {error}
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="attendance-alert success">
          {message}
        </div>
      )}

      {/* Monthly Summary */}
      <section className="attendance-summary">

        <div className="attendance-summary-card">
          <span className="summary-icon">📅</span>

          <div>
            <p>Recorded Days</p>
            <h3>{recordedDays}</h3>
          </div>
        </div>

        <div className="attendance-summary-card">
          <span className="summary-icon">🟢</span>

          <div>
            <p>Present Days</p>
            <h3>{presentDays}</h3>
          </div>
        </div>

        <div className="attendance-summary-card">
          <span className="summary-icon">⏱️</span>

          <div>
            <p>Total Working Hours</p>
            <h3>{formatDuration(totalWorkingMinutes)}</h3>
          </div>
        </div>

        <div className="attendance-summary-card">
          <span className="summary-icon">✓</span>

          <div>
            <p>Completed Days</p>
            <h3>{completedDays}</h3>
          </div>
        </div>

        <div className="attendance-summary-card">
          <span className="summary-icon">⏰</span>

          <div>
            <p>Total Overtime</p>
            <h3>{formatDuration(totalOvertimeMinutes)}</h3>
          </div>
        </div>

        <div className="attendance-summary-card">
          <span className="summary-icon">⚠️</span>

          <div>
            <p>Late Arrivals</p>
            <h3>{lateArrivalDays}</h3>
          </div>
        </div>

        <div className="attendance-summary-card">
          <span className="summary-icon">🚪</span>

          <div>
            <p>Early Departures</p>
            <h3>{earlyDepartureDays}</h3>
          </div>
        </div>

        <div className="attendance-summary-card">
          <span className="summary-icon">🌗</span>

          <div>
            <p>Half Days</p>
            <h3>{halfDays}</h3>
          </div>
        </div>

      </section>

      {/* Check In / Check Out */}
      <section className="attendance-action-grid">

        {/* Check In */}
        <div className="attendance-action-card">

          <span className="attendance-card-icon">🟢</span>

          <h3>Check In</h3>

          <p>Record your arrival time for today.</p>

          <div className="attendance-time">
            {formatTime(todayRecord?.checkIn ?? null)}
          </div>

          <button
            className="check-in-button"
            disabled={loading || processing || hasCheckedIn}
            onClick={() => handleAttendanceAction('check-in')}
          >
            {processingAction === 'check-in'
              ? 'Processing...'
              : hasCheckedIn
                ? 'Checked In'
                : 'Check In Now'}
          </button>

        </div>

        {/* Check Out */}
        <div className="attendance-action-card">

          <span className="attendance-card-icon">🔴</span>

          <h3>Check Out</h3>

          <p>Record your departure time for today.</p>

          <div className="attendance-time">
            {formatTime(todayRecord?.checkOut ?? null)}
          </div>

          <button
            className="check-out-button"
            disabled={
              loading ||
              processing ||
              !hasCheckedIn ||
              hasCheckedOut
            }
            onClick={() => handleAttendanceAction('check-out')}
          >
            {processingAction === 'check-out'
              ? 'Processing...'
              : hasCheckedOut
                ? 'Checked Out'
                : 'Check Out Now'}
          </button>

        </div>

      </section>

      {/* Attendance History */}
      <section className="attendance-history">

        <div className="attendance-history-heading">

          <div>
            <h2>Attendance History</h2>
            <p>Your recorded attendance details.</p>
          </div>

          <button
            className="attendance-refresh-button"
            onClick={loadAttendance}
            disabled={loading}
          >
            ↻ Refresh
          </button>

        </div>

        {loading ? (
          <p className="attendance-empty">
            Loading attendance...
          </p>
        ) : records.length === 0 ? (
          <p className="attendance-empty">
            No attendance records found.
          </p>
        ) : (

          <div className="attendance-table-wrapper">

            <table className="attendance-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Overtime</th>
                  <th>Remarks</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {[...records]
                  .sort((a, b) =>
                    b.attendanceDate.localeCompare(a.attendanceDate)
                  )
                  .map(record => (

                    <tr key={record.id}>

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
                        {record.checkIn && record.checkOut
                          ? formatDuration(getWorkingMinutes(record))
                          : record.checkIn
                            ? 'In progress'
                            : '--'}
                      </td>

                      <td>
                        {record.checkIn && record.checkOut
                          ? formatDuration(getOvertimeMinutes(record))
                          : '--'}
                      </td>

                      <td>
                        {record.lateArrival && 'Late Arrival'}
                        {record.lateArrival && record.earlyDeparture && ', '}
                        {record.earlyDeparture && 'Early Departure'}
                        {!record.lateArrival && !record.earlyDeparture && '--'}
                      </td>

                      <td>
                        <span
                          className={`attendance-status-badge ${getStatusClass(record.status)}`}
                        >
                          {record.status}
                        </span>
                      </td>

                    </tr>

                  ))}
              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* Footer */}
      <footer className="attendance-footer">
        © 2026 NexusHR. PEOPLE. POTENTIAL. PROGRESS.
      </footer>

    </div>
  )
}

