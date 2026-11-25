
import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import './AdminReports.css'

// =====================================================
// TYPES
// =====================================================

interface AnalyticsData {
  totalEmployees: number
  averageSalary: number
  totalSalary: number
  departmentCounts: Record<string, number>
}

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
  salary?: number
}

interface LeaveRequest {
  id: number
  employeeId: number
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  createdAt?: string
}

interface Payroll {
  id: number
  employeeId: number
  employeeName: string
  month: string
  basicSalary: number
  hra: number
  allowances: number
  pf: number
  tax: number
  deductions: number
  grossSalary: number
  netSalary: number
  paymentDate: string
  status: string
}

type ReportArray<T> =
  | T[]
  | {
      content?: T[]
      data?: T[]
      employees?: T[]
      records?: T[]
    }

// =====================================================
// API CONFIGURATION
// =====================================================

const API_ENDPOINTS = {
  analytics: '/api/analytics/dashboard',
  attendance: '/api/attendance',
  employees: '/api/employees',
  leaves: '/api/leaves',
  payroll: '/api/payroll',
}

const getToken = () =>
  sessionStorage.getItem('nexushr_token')

const getAuthHeaders = (): HeadersInit => {
  const token = getToken()

  return {
    'Content-Type': 'application/json',
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  }
}

async function fetchReportData<T>(
  endpoint: string
): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to load ${endpoint}: ${response.status}`
    )
  }

  return response.json()
}

function extractArray<T>(
  response: ReportArray<T>
): T[] {
  if (Array.isArray(response)) {
    return response
  }

  return (
    response.content ??
    response.data ??
    response.employees ??
    response.records ??
    []
  )
}

// =====================================================
// FORMAT HELPERS
// =====================================================

function formatCurrency(
  value: number | null | undefined
): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function formatDate(
  value: string | null | undefined
): string {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IN')
}

function formatTime(
  value: string | null | undefined
): string {
  return value || '-'
}

// =====================================================
// EXPORT HELPERS
// =====================================================

function exportToCSV(
  data: Record<string, unknown>[],
  fileName: string
): void {
  if (data.length === 0) {
    alert('No data available to export.')
    return
  }

  const headers = Object.keys(data[0])

  const escapeCSV = (value: unknown): string => {
    const text = String(value ?? '')
    return `"${text.replace(/"/g, '""')}"`
  }

  const csvRows = [
    headers.map(escapeCSV).join(','),
    ...data.map(row =>
      headers
        .map(header => escapeCSV(row[header]))
        .join(',')
    ),
  ]

  const csvContent = csvRows.join('\n')

  const blob = new Blob(
    ['\uFEFF', csvContent],
    { type: 'text/csv;charset=utf-8;' }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${fileName}.csv`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function exportToExcel(
  data: Record<string, unknown>[],
  fileName: string,
  sheetName: string
): void {
  if (data.length === 0) {
    alert('No data available to export.')
    return
  }

  const worksheet = XLSX.utils.json_to_sheet(data)
  const headers = Object.keys(data[0])

  worksheet['!cols'] = headers.map(header => ({
    wch: Math.max(
      header.length + 5,
      ...data.map(row =>
        String(row[header] ?? '').length + 2
      )
    ),
  }))

  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName
  )

  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

// =====================================================
// MAIN COMPONENT
// =====================================================

function AdminReports() {
  // ---------------------------------------------------
  // REPORT DATA
  // ---------------------------------------------------

  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null)

  const [attendance, setAttendance] =
    useState<Attendance[]>([])

  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [leaves, setLeaves] =
    useState<LeaveRequest[]>([])

  const [payroll, setPayroll] =
    useState<Payroll[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ---------------------------------------------------
  // FILTER STATES
  // ---------------------------------------------------

  const [attendanceSearch, setAttendanceSearch] =
    useState('')

  const [attendanceDate, setAttendanceDate] =
    useState('')

  const [leaveSearch, setLeaveSearch] =
    useState('')

  const [leaveStatus, setLeaveStatus] =
    useState('ALL')

  const [payrollSearch, setPayrollSearch] =
    useState('')

  const [payrollMonth, setPayrollMonth] =
    useState('ALL')

  const [payrollStatus, setPayrollStatus] =
    useState('ALL')

  // ---------------------------------------------------
  // LOAD REPORT DATA
  // ---------------------------------------------------

  useEffect(() => {
    let active = true

    const loadReports = async () => {
      setLoading(true)
      setError('')

      try {
        const [
          analyticsResponse,
          attendanceResponse,
          employeeResponse,
          leaveResponse,
          payrollResponse,
        ] = await Promise.all([
          fetchReportData<AnalyticsData>(
            API_ENDPOINTS.analytics
          ),
          fetchReportData<ReportArray<Attendance>>(
            API_ENDPOINTS.attendance
          ),
          fetchReportData<ReportArray<Employee>>(
            API_ENDPOINTS.employees
          ),
          fetchReportData<ReportArray<LeaveRequest>>(
            API_ENDPOINTS.leaves
          ),
          fetchReportData<ReportArray<Payroll>>(
            API_ENDPOINTS.payroll
          ),
        ])

        if (!active) return

        setAnalytics(analyticsResponse)
        setAttendance(extractArray(attendanceResponse))
        setEmployees(extractArray(employeeResponse))
        setLeaves(extractArray(leaveResponse))
        setPayroll(extractArray(payrollResponse))
      } catch (err) {
        if (!active) return

        console.error(
          'Admin Reports loading error:',
          err
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load reports.'
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadReports()

    return () => {
      active = false
    }
  }, [])

  // ===================================================
  // EMPLOYEE OVERVIEW
  // ===================================================

  const totalEmployees =
    analytics?.totalEmployees ?? employees.length

  const averageSalary =
    analytics?.averageSalary ?? 0

  const totalSalary =
    analytics?.totalSalary ?? 0

  // ===================================================
  // DEPARTMENT-WISE ANALYTICS
  // ===================================================

  const departmentData = useMemo(() => {
    const departments = Object.entries(
      analytics?.departmentCounts ?? {}
    )

    const total = departments.reduce(
      (sum, [, count]) =>
        sum + Number(count || 0),
      0
    )

    return departments
      .map(([name, count]) => ({
        name,
        count: Number(count || 0),
        percentage:
          total > 0
            ? (Number(count || 0) / total) * 100
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [analytics])

  const maxDepartmentCount = Math.max(
    ...departmentData.map(item => item.count),
    1
  )

  const departmentEmployeeTotal =
    departmentData.reduce(
      (sum, item) => sum + item.count,
      0
    )

  // ===================================================
  // ATTENDANCE REPORT
  // ===================================================

  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      const search = attendanceSearch.toLowerCase()

      const matchesSearch =
        !search ||
        String(record.employeeId).includes(search) ||
        String(record.status)
          .toLowerCase()
          .includes(search)

      const matchesDate =
        !attendanceDate ||
        record.attendanceDate?.slice(0, 10) ===
          attendanceDate

      return matchesSearch && matchesDate
    })
  }, [
    attendance,
    attendanceSearch,
    attendanceDate,
  ])

  const presentCount = attendance.filter(
    item => item.status?.toUpperCase() === 'PRESENT'
  ).length

  const absentCount = attendance.filter(
    item => item.status?.toUpperCase() === 'ABSENT'
  ).length

  const attendanceExportData =
    filteredAttendance.map(item => ({
      ID: item.id,
      EmployeeID: item.employeeId,
      Date: item.attendanceDate,
      CheckIn: item.checkIn ?? '',
      CheckOut: item.checkOut ?? '',
      Status: item.status,
    }))

  // ===================================================
  // LEAVE REPORT
  // ===================================================

  const filteredLeaves = useMemo(() => {
    return leaves.filter(item => {
      const search = leaveSearch.toLowerCase()

      const matchesSearch =
        !search ||
        String(item.employeeId).includes(search) ||
        item.leaveType?.toLowerCase().includes(search) ||
        item.reason?.toLowerCase().includes(search)

      const matchesStatus =
        leaveStatus === 'ALL' ||
        item.status?.toUpperCase() === leaveStatus

      return matchesSearch && matchesStatus
    })
  }, [leaves, leaveSearch, leaveStatus])

  const pendingLeaves = leaves.filter(
    item => item.status?.toUpperCase() === 'PENDING'
  ).length

  const approvedLeaves = leaves.filter(
    item => item.status?.toUpperCase() === 'APPROVED'
  ).length

  const rejectedLeaves = leaves.filter(
    item => item.status?.toUpperCase() === 'REJECTED'
  ).length

  const leaveExportData = filteredLeaves.map(item => ({
    ID: item.id,
    EmployeeID: item.employeeId,
    LeaveType: item.leaveType,
    StartDate: item.startDate,
    EndDate: item.endDate,
    Reason: item.reason,
    Status: item.status,
    CreatedAt: item.createdAt ?? '',
  }))

  // ===================================================
  // PAYROLL REPORT
  // ===================================================

  const payrollMonths = useMemo(() => {
    return Array.from(
      new Set(
        payroll
          .map(item => item.month)
          .filter(Boolean)
      )
    )
  }, [payroll])

  const filteredPayroll = useMemo(() => {
    return payroll.filter(item => {
      const search = payrollSearch.toLowerCase()

      const matchesSearch =
        !search ||
        String(item.employeeId).includes(search) ||
        item.employeeName?.toLowerCase().includes(search)

      const matchesMonth =
        payrollMonth === 'ALL' ||
        item.month === payrollMonth

      const matchesStatus =
        payrollStatus === 'ALL' ||
        item.status?.toUpperCase() === payrollStatus

      return (
        matchesSearch &&
        matchesMonth &&
        matchesStatus
      )
    })
  }, [
    payroll,
    payrollSearch,
    payrollMonth,
    payrollStatus,
  ])

  const totalGrossSalary = filteredPayroll.reduce(
    (sum, item) =>
      sum + Number(item.grossSalary || 0),
    0
  )

  const totalNetSalary = filteredPayroll.reduce(
    (sum, item) =>
      sum + Number(item.netSalary || 0),
    0
  )

  const totalDeductions = filteredPayroll.reduce(
    (sum, item) =>
      sum + Number(item.deductions || 0),
    0
  )

  const payrollExportData = filteredPayroll.map(
    item => ({
      ID: item.id,
      EmployeeID: item.employeeId,
      EmployeeName: item.employeeName,
      Month: item.month,
      BasicSalary: item.basicSalary,
      HRA: item.hra,
      Allowances: item.allowances,
      PF: item.pf,
      Tax: item.tax,
      Deductions: item.deductions,
      GrossSalary: item.grossSalary,
      NetSalary: item.netSalary,
      PaymentDate: item.paymentDate,
      Status: item.status,
    })
  )

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (loading) {
    return (
      <div className="admin-reports-page">
        <div className="reports-loading">
          Loading Admin Reports...
        </div>
      </div>
    )
  }

  // ===================================================
  // PAGE JSX
  // ===================================================

  return (
    <div className="admin-reports-page">

      {/* PAGE HEADER */}

      <div className="reports-page-header">
        <div>
          <h1>Admin Reports</h1>
          <p>
            Workforce analytics, attendance, leave and payroll reports
          </p>
        </div>
      </div>

      {error && (
        <div className="reports-error">
          {error}
        </div>
      )}

      {/* EMPLOYEE OVERVIEW */}

      <section className="reports-section">

        <div className="reports-section-heading">
          <h2>Employee Overview</h2>
          <p>Overall workforce summary</p>
        </div>

        <div className="reports-summary-grid">

          <div className="reports-summary-card">
            <span>Total Employees</span>
            <strong>{totalEmployees}</strong>
          </div>

          <div className="reports-summary-card">
            <span>Average Salary</span>
            <strong>
              {formatCurrency(averageSalary)}
            </strong>
          </div>

          <div className="reports-summary-card">
            <span>Total Salary</span>
            <strong>
              {formatCurrency(totalSalary)}
            </strong>
          </div>

          <div className="reports-summary-card">
            <span>Total Departments</span>
            <strong>{departmentData.length}</strong>
          </div>

        </div>

      </section>

      {/* DEPARTMENT-WISE ANALYTICS */}

      <section className="reports-table-card department-analytics">

        <div className="attendance-header">
          <div>
            <h2>Department-wise Analytics</h2>
            <p>
              Employee distribution across departments
            </p>
          </div>
        </div>

        <div className="department-total">
          <span>
            Total Employees Across Departments
          </span>

          <strong>{departmentEmployeeTotal}</strong>
        </div>

        {departmentData.length > 0 ? (

          <div className="department-chart">

            {departmentData.map(department => (

              <div
                className="department-chart-item"
                key={department.name}
              >

                <div className="department-chart-info">
                  <span>{department.name}</span>

                  <strong>
                    {department.count} employees
                  </strong>
                </div>

                <div className="department-progress-track">
                  <div
                    className="department-progress-fill"
                    style={{
                      width: `${
                        (department.count /
                          maxDepartmentCount) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div className="department-percentage">
                  {department.percentage.toFixed(1)}%
                </div>

              </div>

            ))}

          </div>

        ) : (

          <p className="no-records">
            No department analytics available.
          </p>

        )}

      </section>

      {/* ATTENDANCE REPORT */}

      <section className="reports-table-card">

        <div className="attendance-header">

          <div>
            <h2>Attendance Report</h2>
            <p>Employee attendance records</p>
          </div>

          <div className="reports-export-actions">

            <button
              type="button"
              onClick={() =>
                exportToCSV(
                  attendanceExportData,
                  'Attendance_Report'
                )
              }
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={() =>
                exportToExcel(
                  attendanceExportData,
                  'Attendance_Report',
                  'Attendance'
                )
              }
            >
              Export Excel
            </button>

          </div>

        </div>

        <div className="reports-summary-grid reports-small-grid">

          <div className="reports-summary-card">
            <span>Total Records</span>
            <strong>{attendance.length}</strong>
          </div>

          <div className="reports-summary-card">
            <span>Present</span>
            <strong>{presentCount}</strong>
          </div>

          <div className="reports-summary-card">
            <span>Absent</span>
            <strong>{absentCount}</strong>
          </div>

        </div>

        <div className="reports-filters">

          <input
            type="text"
            placeholder="Search employee ID or status"
            value={attendanceSearch}
            onChange={event =>
              setAttendanceSearch(event.target.value)
            }
          />

          <input
            type="date"
            value={attendanceDate}
            onChange={event =>
              setAttendanceDate(event.target.value)
            }
          />

          <button
            type="button"
            onClick={() => {
              setAttendanceSearch('')
              setAttendanceDate('')
            }}
          >
            Clear Filters
          </button>

        </div>

        <div className="reports-table-wrapper">

          <table className="reports-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {filteredAttendance.length > 0 ? (

                filteredAttendance.map(item => (

                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.employeeId}</td>
                    <td>
                      {formatDate(item.attendanceDate)}
                    </td>
                    <td>{formatTime(item.checkIn)}</td>
                    <td>{formatTime(item.checkOut)}</td>

                    <td>
                      <span
                        className={`report-status ${item.status?.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan={6} className="no-records">
                    No attendance records found.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* LEAVE REPORT */}

      <section className="reports-table-card">

        <div className="attendance-header">

          <div>
            <h2>Leave Report</h2>
            <p>
              Employee leave requests and approval status
            </p>
          </div>

          <div className="reports-export-actions">

            <button
              type="button"
              onClick={() =>
                exportToCSV(
                  leaveExportData,
                  'Leave_Report'
                )
              }
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={() =>
                exportToExcel(
                  leaveExportData,
                  'Leave_Report',
                  'Leaves'
                )
              }
            >
              Export Excel
            </button>

          </div>

        </div>

        <div className="reports-summary-grid reports-small-grid">

          <div className="reports-summary-card">
            <span>Total Requests</span>
            <strong>{leaves.length}</strong>
          </div>

          <div className="reports-summary-card">
            <span>Pending</span>
            <strong>{pendingLeaves}</strong>
          </div>

          <div className="reports-summary-card">
            <span>Approved</span>
            <strong>{approvedLeaves}</strong>
          </div>

          <div className="reports-summary-card">
            <span>Rejected</span>
            <strong>{rejectedLeaves}</strong>
          </div>

        </div>

        <div className="reports-filters">

          <input
            type="text"
            placeholder="Search employee ID, leave type or reason"
            value={leaveSearch}
            onChange={event =>
              setLeaveSearch(event.target.value)
            }
          />

          <select
            value={leaveStatus}
            onChange={event =>
              setLeaveStatus(event.target.value)
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setLeaveSearch('')
              setLeaveStatus('ALL')
            }}
          >
            Clear Filters
          </button>

        </div>

        <div className="reports-table-wrapper">

          <table className="reports-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {filteredLeaves.length > 0 ? (

                filteredLeaves.map(item => (

                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.employeeId}</td>
                    <td>{item.leaveType}</td>
                    <td>{formatDate(item.startDate)}</td>
                    <td>{formatDate(item.endDate)}</td>
                    <td>{item.reason || '-'}</td>

                    <td>
                      <span
                        className={`report-status ${item.status?.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan={7} className="no-records">
                    No leave records found.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* PAYROLL REPORT */}

      <section className="reports-table-card">

        <div className="attendance-header">

          <div>
            <h2>Payroll Report</h2>
            <p>
              Employee salary and payroll information
            </p>
          </div>

          <div className="reports-export-actions">

            <button
              type="button"
              onClick={() =>
                exportToCSV(
                  payrollExportData,
                  'Payroll_Report'
                )
              }
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={() =>
                exportToExcel(
                  payrollExportData,
                  'Payroll_Report',
                  'Payroll'
                )
              }
            >
              Export Excel
            </button>

          </div>

        </div>

        <div className="reports-summary-grid">

          <div className="reports-summary-card">
            <span>Total Payroll Records</span>
            <strong>{filteredPayroll.length}</strong>
          </div>

          <div className="reports-summary-card">
            <span>Gross Salary</span>
            <strong>
              {formatCurrency(totalGrossSalary)}
            </strong>
          </div>

          <div className="reports-summary-card">
            <span>Net Salary</span>
            <strong>
              {formatCurrency(totalNetSalary)}
            </strong>
          </div>

          <div className="reports-summary-card">
            <span>Total Deductions</span>
            <strong>
              {formatCurrency(totalDeductions)}
            </strong>
          </div>

        </div>

        <div className="reports-filters">

          <input
            type="text"
            placeholder="Search employee name or ID"
            value={payrollSearch}
            onChange={event =>
              setPayrollSearch(event.target.value)
            }
          />

          <select
            value={payrollMonth}
            onChange={event =>
              setPayrollMonth(event.target.value)
            }
          >
            <option value="ALL">All Months</option>

            {payrollMonths.map(month => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}

          </select>

          <select
            value={payrollStatus}
            onChange={event =>
              setPayrollStatus(event.target.value)
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setPayrollSearch('')
              setPayrollMonth('ALL')
              setPayrollStatus('ALL')
            }}
          >
            Clear Filters
          </button>

        </div>

        <div className="reports-table-wrapper">

          <table className="reports-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Month</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Payment Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {filteredPayroll.length > 0 ? (

                filteredPayroll.map(item => (

                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.employeeId}</td>
                    <td>{item.employeeName || '-'}</td>
                    <td>{item.month}</td>

                    <td>
                      {formatCurrency(item.grossSalary)}
                    </td>

                    <td>
                      {formatCurrency(item.deductions)}
                    </td>

                    <td>
                      {formatCurrency(item.netSalary)}
                    </td>

                    <td>
                      {formatDate(item.paymentDate)}
                    </td>

                    <td>
                      <span
                        className={`report-status ${item.status?.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan={9} className="no-records">
                    No payroll records found.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  )
}

export default AdminReports

