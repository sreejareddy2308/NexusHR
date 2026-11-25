
import { useCallback, useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import './EmployeePayslips.css'

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

const API_URL = '/api/payroll'

export default function EmployeePayslips() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0)

  const totalNetSalary = payrolls.reduce(
    (total, payroll) =>
      total + Number(payroll.netSalary || 0),
    0
  )

  const totalGrossSalary = payrolls.reduce(
    (total, payroll) =>
      total + Number(payroll.grossSalary || 0),
    0
  )

  const getDeductions = (payroll: Payroll) =>
    Number(payroll.pf || 0) +
    Number(payroll.tax || 0) +
    Number(payroll.deductions || 0)

  // Load employee payslips
  const loadPayslips = useCallback(async () => {
    const token = sessionStorage.getItem('nexushr_token')

    if (!token) {
      setError('Your session has expired. Please log in again.')
      setLoading(false)
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
        throw new Error(
          `Access denied (${response.status}). Please check your login session and permissions.`
        )
      }

      if (!response.ok) {
        throw new Error(
          `Unable to load payslips (${response.status}).`
        )
      }

      const data = await response.json()

      const payrollData = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : []

      setPayrolls(payrollData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading payslips.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPayslips()
  }, [loadPayslips])

  // PDF Download
  const downloadPayslip = (payroll: Payroll) => {
    try {
      setDownloadingId(payroll.id)

      const doc = new jsPDF()

      const money = (amount: number) =>
        `INR ${Number(amount || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`

      const totalDeductions = getDeductions(payroll)

      // Company heading
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('NexusHR', 20, 22)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('PEOPLE. POTENTIAL. PROGRESS.', 20, 30)

      doc.setFontSize(15)
      doc.setFont('helvetica', 'bold')
      doc.text('EMPLOYEE SALARY SLIP', 20, 43)

      doc.line(20, 49, 190, 49)

      // Employee details
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')

      const employeeName = doc.splitTextToSize(
        `Employee Name: ${payroll.employeeName || 'N/A'}`,
        165
      )

      doc.text(`Payslip ID: ${payroll.id}`, 20, 60)
      doc.text(`Employee ID: ${payroll.employeeId}`, 20, 70)
      doc.text(employeeName, 20, 80)

      const detailsY = 80 + employeeName.length * 6

      doc.text(`Payroll Month: ${payroll.month}`, 20, detailsY + 5)
      doc.text(
        `Payment Date: ${payroll.paymentDate || 'N/A'}`,
        20,
        detailsY + 15
      )
      doc.text(`Status: ${payroll.status || 'N/A'}`, 20, detailsY + 25)

      const sectionY = detailsY + 38

      doc.line(20, sectionY, 190, sectionY)

      // Earnings
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('EARNINGS', 20, sectionY + 12)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)

      doc.text(`Basic Salary: ${money(payroll.basicSalary)}`, 20, sectionY + 25)
      doc.text(`HRA: ${money(payroll.hra)}`, 20, sectionY + 35)
      doc.text(`Allowances: ${money(payroll.allowances)}`, 20, sectionY + 45)
      doc.text(`Gross Salary: ${money(payroll.grossSalary)}`, 20, sectionY + 58)

      const deductionY = sectionY + 68

      doc.line(20, deductionY, 190, deductionY)

      // Deductions
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('DEDUCTIONS', 20, deductionY + 12)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)

      doc.text(`PF: ${money(payroll.pf)}`, 20, deductionY + 25)
      doc.text(`Tax: ${money(payroll.tax)}`, 20, deductionY + 35)
      doc.text(
        `Other Deductions: ${money(payroll.deductions)}`,
        20,
        deductionY + 45
      )
      doc.text(
        `Total Deductions: ${money(totalDeductions)}`,
        20,
        deductionY + 58
      )

      const netY = deductionY + 70

      doc.line(20, netY, 190, netY)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)

      doc.text(
        `NET SALARY: ${money(payroll.netSalary)}`,
        20,
        netY + 15
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)

      doc.text(
        'This is a computer-generated payslip.',
        20,
        netY + 30
      )

      const safeMonth = String(payroll.month || 'salary')
        .replace(/[^a-zA-Z0-9_-]/g, '_')

      doc.save(
        `NexusHR_Payslip_${payroll.employeeId}_${safeMonth}.pdf`
      )
    } catch {
      setError('Unable to generate payslip PDF.')
    } finally {
      setDownloadingId(null)
    }
  }

  // CSV Export
  const exportCSV = () => {
    if (payrolls.length === 0) return

    const headers = [
      'Payslip ID',
      'Employee ID',
      'Employee Name',
      'Month',
      'Gross Salary',
      'Deductions',
      'Net Salary',
      'Payment Date',
      'Status',
    ]

    const escapeCSV = (value: string | number) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`

    const rows = payrolls.map(payroll => [
      payroll.id,
      payroll.employeeId,
      payroll.employeeName,
      payroll.month,
      payroll.grossSalary,
      getDeductions(payroll),
      payroll.netSalary,
      payroll.paymentDate || 'N/A',
      payroll.status,
    ])

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row =>
        row.map(escapeCSV).join(',')
      ),
    ].join('\r\n')

    const blob = new Blob(
      ['\uFEFF', csvContent],
      { type: 'text/csv;charset=utf-8;' }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'NexusHR_Payslips.csv'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const sortedPayrolls = [...payrolls].sort((a, b) =>
    String(b.month || '').localeCompare(String(a.month || ''))
  )

  const getStatusClass = (status: string) =>
    status?.toUpperCase() === 'PAID'
      ? 'paid'
      : 'pending'

  return (
    <div className="employee-payslips-page">

      {/* Page Introduction */}
      <div className="payslips-intro">
        <div>
          <span className="payslips-portal-label">
            EMPLOYEE PAYROLL
          </span>

          <h1>My Payslips</h1>

          <p>
            View your salary details, payment history and download
            your payslips.
          </p>
        </div>

        <button
          className="payslip-refresh-button"
          onClick={loadPayslips}
          disabled={loading}
        >
          ↻ {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="payslip-alert error">
          <strong>!</strong>
          {error}
        </div>
      )}

      {/* Summary */}
      <section className="payslip-summary">

        <div className="payslip-summary-card">
          <div className="summary-card-top">
            <span>Total Payslips</span>
            <span className="summary-icon blue-icon">▤</span>
          </div>

          <strong>
            {loading ? '--' : payrolls.length}
          </strong>

          <small>Available salary statements</small>
        </div>

        <div className="payslip-summary-card">
          <div className="summary-card-top">
            <span>Total Net Salary</span>
            <span className="summary-icon green-icon">₹</span>
          </div>

          <strong className="summary-net">
            {loading ? '--' : formatCurrency(totalNetSalary)}
          </strong>

          <small>Total net amount recorded</small>
        </div>

        <div className="payslip-summary-card">
          <div className="summary-card-top">
            <span>Total Gross Salary</span>
            <span className="summary-icon purple-icon">₹</span>
          </div>

          <strong>
            {loading ? '--' : formatCurrency(totalGrossSalary)}
          </strong>

          <small>Before deductions</small>
        </div>

      </section>

      {/* Salary History */}
      <section className="employee-payslips-panel">

        <div className="payslips-panel-header">
          <div>
            <h2>Salary History</h2>
            <p>Review your monthly salary records.</p>
          </div>

          <button
            className="payslip-csv-button"
            onClick={exportCSV}
            disabled={loading || payrolls.length === 0}
          >
            ↓ Export CSV
          </button>
        </div>

        {loading ? (
          <div className="payslip-empty">
            <div className="payslip-loader"></div>
            <p>Loading your payslips...</p>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="payslip-empty">
            <span className="empty-icon">▤</span>
            <h3>No Payslips Available</h3>
            <p>Your salary statements will appear here.</p>
          </div>
        ) : (
          <div className="employee-payslip-table-wrapper">

            <table className="employee-payslip-table">

              <thead>
                <tr>
                  <th>Month</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                  <th>Download</th>
                </tr>
              </thead>

              <tbody>
                {sortedPayrolls.map(payroll => (
                  <tr key={payroll.id}>

                    <td className="payslip-month">
                      {payroll.month}
                    </td>

                    <td>
                      {formatCurrency(payroll.grossSalary)}
                    </td>

                    <td>
                      {formatCurrency(getDeductions(payroll))}
                    </td>

                    <td className="payslip-net-salary">
                      {formatCurrency(payroll.netSalary)}
                    </td>

                    <td>
                      {payroll.paymentDate || 'N/A'}
                    </td>

                    <td>
                      <span
                        className={`employee-payslip-status ${getStatusClass(payroll.status)}`}
                      >
                        {payroll.status || 'PENDING'}
                      </span>
                    </td>

                    <td>
                      <button
                        className="employee-payslip-download"
                        onClick={() => downloadPayslip(payroll)}
                        disabled={downloadingId !== null}
                      >
                        {downloadingId === payroll.id
                          ? 'Generating...'
                          : '↓ PDF'}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

        {!loading && payrolls.length > 0 && (
          <div className="payslip-record-count">
            Showing {payrolls.length} salary record
            {payrolls.length !== 1 ? 's' : ''}
          </div>
        )}

      </section>

      {/* Footer */}
      <footer className="payslips-footer">
        NexusHR · PEOPLE. POTENTIAL. PROGRESS.
      </footer>

    </div>
  )
}

