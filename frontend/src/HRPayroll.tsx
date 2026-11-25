import { useEffect, useState, type FormEvent } from 'react'
import './HRPayroll.css'
import jsPDF from 'jspdf'

interface Employee {
  id: number
  employeeName: string
  email: string
  department?: string
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

const API = '/api'

// Handles different employee API response structures.
const extractList = (responseData: any): any[] => {
  if (Array.isArray(responseData)) {
    return responseData
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data
  }

  if (Array.isArray(responseData?.content)) {
    return responseData.content
  }

  if (Array.isArray(responseData?.employees)) {
    return responseData.employees
  }

  if (Array.isArray(responseData?.data?.content)) {
    return responseData.data.content
  }

  return []
}

export default function HRPayroll() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrolls, setPayrolls] = useState<Payroll[]>([])

  const [employeeId, setEmployeeId] = useState('')

  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`
  })

  const [basicSalary, setBasicSalary] = useState('30000')
  const [hra, setHra] = useState('12000')
  const [allowances, setAllowances] = useState('3000')
  const [pf, setPf] = useState('1800')
  const [tax, setTax] = useState('1000')
  const [deductions, setDeductions] = useState('500')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const token = sessionStorage.getItem('nexushr_token')
  const tokenType =
    sessionStorage.getItem('nexushr_tokenType') || 'Bearer'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `${tokenType} ${token}`
  }

  const grossSalary =
    Number(basicSalary || 0) +
    Number(hra || 0) +
    Number(allowances || 0)

  const totalDeductions =
    Number(pf || 0) +
    Number(tax || 0) +
    Number(deductions || 0)

  const netSalary = grossSalary - totalDeductions

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)

  // Download employee payslip as PDF.
  const downloadPayslip = (payroll: Payroll) => {
    const doc = new jsPDF()

    const money = (amount: number) =>
      `INR ${Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`

    const payrollDeductions =
      Number(payroll.pf) +
      Number(payroll.tax) +
      Number(payroll.deductions)

    doc.setFontSize(20)
    doc.text('NexusHR', 20, 22)

    doc.setFontSize(11)
    doc.text('EMPLOYEE SALARY SLIP', 20, 32)

    doc.line(20, 38, 190, 38)

    doc.setFontSize(11)
    doc.text(`Payslip ID: ${payroll.id}`, 20, 50)
    doc.text(`Employee ID: ${payroll.employeeId}`, 20, 60)
    doc.text(`Employee Name: ${payroll.employeeName}`, 20, 70)
    doc.text(`Payroll Month: ${payroll.month}`, 20, 80)
    doc.text(`Payment Date: ${payroll.paymentDate || 'N/A'}`, 20, 90)
    doc.text(`Status: ${payroll.status}`, 20, 100)

    doc.line(20, 108, 190, 108)

    doc.setFontSize(13)
    doc.text('EARNINGS', 20, 120)

    doc.setFontSize(11)
    doc.text(`Basic Salary: ${money(payroll.basicSalary)}`, 20, 132)
    doc.text(`HRA: ${money(payroll.hra)}`, 20, 142)
    doc.text(`Allowances: ${money(payroll.allowances)}`, 20, 152)
    doc.text(`Gross Salary: ${money(payroll.grossSalary)}`, 20, 164)

    doc.line(20, 172, 190, 172)

    doc.setFontSize(13)
    doc.text('DEDUCTIONS', 20, 184)

    doc.setFontSize(11)
    doc.text(`PF: ${money(payroll.pf)}`, 20, 196)
    doc.text(`Tax: ${money(payroll.tax)}`, 20, 206)
    doc.text(`Other Deductions: ${money(payroll.deductions)}`, 20, 216)
    doc.text(`Total Deductions: ${money(payrollDeductions)}`, 20, 228)

    doc.line(20, 238, 190, 238)

    doc.setFontSize(15)
    doc.text(`NET SALARY: ${money(payroll.netSalary)}`, 20, 252)

    doc.setFontSize(9)
    doc.text(
      'This is a computer-generated payslip.',
      20,
      275
    )

    doc.save(
      `NexusHR_Payslip_${payroll.employeeId}_${payroll.month}.pdf`
    )
  }

  // Load employees and payroll records.
  const loadData = async () => {
    if (!token) {
      setError('Authentication token not found. Please log in again.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [employeeResponse, payrollResponse] =
        await Promise.all([
          fetch(`${API}/employees`, { headers }),
          fetch(`${API}/payroll`, { headers }),
        ])

      if (!employeeResponse.ok) {
        throw new Error(
          `Employee loading failed (${employeeResponse.status}).`
        )
      }

      if (!payrollResponse.ok) {
        throw new Error(
          `Payroll loading failed (${payrollResponse.status}).`
        )
      }

      const employeeData = await employeeResponse.json()
      const payrollData = await payrollResponse.json()

      const employeeList = extractList(employeeData)

      // Normalize employee field names without changing the API.
      const normalizedEmployees: Employee[] = employeeList
        .filter((employee: any) => employee?.id != null)
        .map((employee: any) => ({
          id: Number(employee.id),
          employeeName:
            employee.employeeName ??
            employee.emp_name ??
            employee.name ??
            'Unnamed Employee',
          email: employee.email ?? '',
          department: employee.department ?? '',
        }))

      const payrollList = extractList(payrollData)

      setEmployees(normalizedEmployees)
      setPayrolls(payrollList)

      // Select the first employee only when no employee is selected.
      setEmployeeId(current => {
        if (
          current &&
          normalizedEmployees.some(
            employee => String(employee.id) === current
          )
        ) {
          return current
        }

        return normalizedEmployees.length > 0
          ? String(normalizedEmployees[0].id)
          : ''
      })

      if (normalizedEmployees.length === 0) {
        setError(
          'No employees were returned by the Employee API. Please check the API response.'
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load payroll data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Generate employee payroll.
  const handleGeneratePayroll = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!employeeId) {
      setError('Please select an employee.')
      return
    }

    if (grossSalary <= 0) {
      setError('Gross salary must be greater than zero.')
      return
    }

    if (totalDeductions > grossSalary) {
      setError('Total deductions cannot exceed gross salary.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API}/payroll/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employeeId: Number(employeeId),
          month,
          basicSalary: Number(basicSalary),
          hra: Number(hra),
          allowances: Number(allowances),
          pf: Number(pf),
          tax: Number(tax),
          deductions: Number(deductions),
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Payroll generation failed.')
      }

      const createdPayroll: Payroll = await response.json()

      setSuccess(
        `Payroll generated successfully for ${createdPayroll.employeeName}.`
      )

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate payroll.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Delete payroll record.
  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this payroll record?'
      )
    ) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API}/payroll/${id}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        throw new Error('Unable to delete payroll record.')
      }

      setSuccess('Payroll record deleted successfully.')
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Delete operation failed.'
      )
    }
  }

  // Filter payroll records.
  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch =
      (payroll.employeeName ?? '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(payroll.employeeId).includes(searchTerm)

    const matchesMonth =
      !filterMonth || payroll.month === filterMonth

    const matchesStatus =
      filterStatus === 'ALL' ||
      payroll.status === filterStatus

    return matchesSearch && matchesMonth && matchesStatus
  })

  // Export payroll records to CSV.
  const exportPayrollCSV = () => {
    if (filteredPayrolls.length === 0) {
      alert('No payroll records available to export.')
      return
    }

    const csvHeaders = [
      'Payroll ID',
      'Employee ID',
      'Employee Name',
      'Month',
      'Basic Salary',
      'HRA',
      'Allowances',
      'PF',
      'Tax',
      'Other Deductions',
      'Gross Salary',
      'Net Salary',
      'Payment Date',
      'Status',
    ]

    const rows = filteredPayrolls.map(payroll => [
      payroll.id,
      payroll.employeeId,
      payroll.employeeName,
      payroll.month,
      payroll.basicSalary,
      payroll.hra,
      payroll.allowances,
      payroll.pf,
      payroll.tax,
      payroll.deductions,
      payroll.grossSalary,
      payroll.netSalary,
      payroll.paymentDate,
      payroll.status,
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...rows.map(row =>
        row
          .map(value =>
            `"${String(value ?? '').replace(/"/g, '""')}"`
          )
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'NexusHR_Payroll_Report.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="hr-payroll-page">
      <div className="payroll-heading">
        <div>
          <h1>Payroll Management</h1>
          <p>Generate and manage employee salary records.</p>
        </div>

        <button
          className="payroll-refresh"
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
        >
          Refresh Records
        </button>
      </div>

      {error && (
        <div className="payroll-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="payroll-alert success">
          {success}
        </div>
      )}

      <div className="payroll-summary">
        <div className="payroll-summary-card">
          <span>Total Payroll Records</span>
          <strong>{payrolls.length}</strong>
        </div>

        <div className="payroll-summary-card">
          <span>Total Net Payroll</span>
          <strong>
            {formatCurrency(
              payrolls.reduce(
                (total, item) =>
                  total + Number(item.netSalary || 0),
                0
              )
            )}
          </strong>
        </div>

        <div className="payroll-summary-card">
          <span>Generated Records</span>
          <strong>
            {
              payrolls.filter(
                item => item.status === 'GENERATED'
              ).length
            }
          </strong>
        </div>
      </div>

      <section className="payroll-panel">
        <h2>Generate Employee Payroll</h2>

        <form onSubmit={handleGeneratePayroll}>
          <div className="payroll-form-grid">
            <label>
              Employee

              <select
                value={employeeId}
                onChange={event =>
                  setEmployeeId(event.target.value)
                }
                required
                disabled={employees.length === 0}
              >
                <option value="">Select employee</option>

                {employees.map(employee => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.employeeName} — {employee.email}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Payroll Month
              <input
                type="month"
                value={month}
                onChange={event =>
                  setMonth(event.target.value)
                }
                required
              />
            </label>

            <label>
              Basic Salary (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={basicSalary}
                onChange={event =>
                  setBasicSalary(event.target.value)
                }
                required
              />
            </label>

            <label>
              HRA (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={hra}
                onChange={event =>
                  setHra(event.target.value)
                }
                required
              />
            </label>

            <label>
              Allowances (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={allowances}
                onChange={event =>
                  setAllowances(event.target.value)
                }
                required
              />
            </label>

            <label>
              PF (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={pf}
                onChange={event =>
                  setPf(event.target.value)
                }
                required
              />
            </label>

            <label>
              Tax (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={event =>
                  setTax(event.target.value)
                }
                required
              />
            </label>

            <label>
              Other Deductions (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={deductions}
                onChange={event =>
                  setDeductions(event.target.value)
                }
                required
              />
            </label>
          </div>

          <div className="payroll-calculation">
            <div>
              <span>Gross Salary</span>
              <strong>{formatCurrency(grossSalary)}</strong>
            </div>

            <div>
              <span>Total Deductions</span>
              <strong>{formatCurrency(totalDeductions)}</strong>
            </div>

            <div className="net-salary">
              <span>Net Salary</span>
              <strong>{formatCurrency(netSalary)}</strong>
            </div>
          </div>

          <button
            type="submit"
            className="generate-payroll-button"
            disabled={
              submitting ||
              loading ||
              employees.length === 0
            }
          >
            {submitting
              ? 'Generating...'
              : 'Generate Payroll'}
          </button>
        </form>
      </section>

      <section className="payroll-panel">
        <h2>Payroll Records</h2>

        <button
          type="button"
          className="payroll-export-btn"
          onClick={exportPayrollCSV}
        >
          Export CSV
        </button>

        <div className="payroll-filters">
          <input
            type="text"
            placeholder="Search employee name or ID"
            value={searchTerm}
            onChange={event =>
              setSearchTerm(event.target.value)
            }
          />

          <input
            type="month"
            value={filterMonth}
            onChange={event =>
              setFilterMonth(event.target.value)
            }
          />

          <select
            value={filterStatus}
            onChange={event =>
              setFilterStatus(event.target.value)
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="GENERATED">Generated</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              setFilterMonth('')
              setFilterStatus('ALL')
            }}
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <p>Loading payroll records...</p>
        ) : filteredPayrolls.length === 0 ? (
          <p>No matching payroll records found.</p>
        ) : (
          <div className="payroll-table-wrapper">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Month</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayrolls.map(payroll => (
                  <tr key={payroll.id}>
                    <td>{payroll.id}</td>
                    <td>{payroll.employeeName}</td>
                    <td>{payroll.month}</td>

                    <td>
                      {formatCurrency(
                        Number(payroll.grossSalary)
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        Number(payroll.pf) +
                        Number(payroll.tax) +
                        Number(payroll.deductions)
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        Number(payroll.netSalary)
                      )}
                    </td>

                    <td>
                      <span className="payroll-status">
                        {payroll.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="download-payroll-button"
                        onClick={() =>
                          downloadPayslip(payroll)
                        }
                      >
                        Download PDF
                      </button>

                      <button
                        type="button"
                        className="delete-payroll-button"
                        onClick={() =>
                          void handleDelete(payroll.id)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

