
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './EmployeeLeaves.css'

interface LeaveRequest {
  id: number
  employeeId: number
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  createdAt: string
}

const API_URL = '/api/leaves'

export default function EmployeeLeaves() {
  const navigate = useNavigate()

  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [leaveType, setLeaveType] = useState('CASUAL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Get local date without UTC conversion.
  const getToday = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const today = getToday()

  // Monthly leave summary
  const currentMonth = today.substring(0, 7)

  const pendingLeaves = leaves.filter(
    leave => leave.status?.toUpperCase() === 'PENDING'
  ).length

  const approvedLeaves = leaves.filter(
    leave => leave.status?.toUpperCase() === 'APPROVED'
  ).length

  const rejectedLeaves = leaves.filter(
    leave => leave.status?.toUpperCase() === 'REJECTED'
  ).length

  const monthlyLeaves = leaves.filter(
    leave => leave.startDate?.startsWith(currentMonth)
  ).length

  // Load employee leave history
  const fetchLeaves = useCallback(async () => {
    const token = sessionStorage.getItem('nexushr_token')

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
        throw new Error(
          `Access denied (${response.status}). Please check your login session.`
        )
      }

      if (!response.ok) {
        throw new Error(
          `Unable to load leave history (${response.status}).`
        )
      }

      const data = await response.json()

      const leaveData = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : []

      setLeaves(leaveData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading leave history.'
      )
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  // Apply for leave
  const handleApplyLeave = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!startDate || !endDate) {
      setError('Please select both leave dates.')
      return
    }

    if (startDate < today) {
      setError('Leave cannot start in the past.')
      return
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date.')
      return
    }

    if (!reason.trim()) {
      setError('Please enter a reason for your leave.')
      return
    }

    const token = sessionStorage.getItem('nexushr_token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`${API_URL}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason: reason.trim(),
        }),
      })

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Leave application denied (${response.status}). Please check your permissions.`
        )
      }

      if (!response.ok) {
        const responseText = await response.text()

        let errorMessage = 'Failed to submit leave request.'

        if (responseText) {
          try {
            const result = JSON.parse(responseText)
            errorMessage =
              result.message ||
              result.error ||
              errorMessage
          } catch {
            errorMessage = responseText
          }
        }

        throw new Error(errorMessage)
      }

      setSuccess('Your leave request was submitted successfully!')

      setLeaveType('CASUAL')
      setStartDate('')
      setEndDate('')
      setReason('')

      await fetchLeaves()

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit leave request.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Status styling
  const getStatusClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'leave-status approved'

      case 'REJECTED':
        return 'leave-status rejected'

      default:
        return 'leave-status pending'
    }
  }

  // Format leave type
  const formatLeaveType = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CASUAL':
        return 'Casual Leave'

      case 'SICK':
        return 'Sick Leave'

      case 'EARNED':
        return 'Earned Leave'

      default:
        return type || '-'
    }
  }

  // Format date
  const formatDate = (date: string) => {
    if (!date) return '-'

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  return (
    <div className="employee-leaves">

      {/* Header */}
      <div className="leaves-header">
        <div>
          <span className="leaves-eyebrow">
            EMPLOYEE PORTAL
          </span>

          <h1>Leave Management</h1>

          <p>
            Apply for leave and track your requests.
          </p>
        </div>

        <button
          type="button"
          className="leaves-refresh-button"
          onClick={fetchLeaves}
          disabled={loading}
        >
          ↻ {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="leave-message error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="leave-message success" role="status">
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <section className="leave-summary">

        <div className="leave-summary-card">
          <div className="leave-summary-icon blue">
            📅
          </div>

          <div>
            <p>Total Requests</p>
            <h2>{leaves.length}</h2>
            <small>All submitted requests</small>
          </div>
        </div>

        <div className="leave-summary-card">
          <div className="leave-summary-icon orange">
            ⏳
          </div>

          <div>
            <p>Pending Requests</p>
            <h2>{pendingLeaves}</h2>
            <small>Awaiting HR approval</small>
          </div>
        </div>

        <div className="leave-summary-card">
          <div className="leave-summary-icon green">
            ✓
          </div>

          <div>
            <p>Approved Requests</p>
            <h2>{approvedLeaves}</h2>
            <small>Approved by HR</small>
          </div>
        </div>

        <div className="leave-summary-card">
          <div className="leave-summary-icon red">
            ✕
          </div>

          <div>
            <p>Rejected Requests</p>
            <h2>{rejectedLeaves}</h2>
            <small>Rejected by HR</small>
          </div>
        </div>

      </section>

      {/* Apply Leave Form */}
      <section className="leave-form-card">

        <div className="leave-section-heading">
          <div>
            <h2>Apply for Leave</h2>
            <p>Submit a new leave application.</p>
          </div>
        </div>

        <form onSubmit={handleApplyLeave}>

          <div className="leave-form-grid">

            {/* Leave Type */}
            <div className="leave-field">
              <label htmlFor="leaveType">
                Leave Type
              </label>

              <select
                id="leaveType"
                value={leaveType}
                onChange={e => setLeaveType(e.target.value)}
                required
              >
                <option value="CASUAL">
                  Casual Leave
                </option>

                <option value="SICK">
                  Sick Leave
                </option>

                <option value="EARNED">
                  Earned Leave
                </option>
              </select>
            </div>

            {/* Start Date */}
            <div className="leave-field">
              <label htmlFor="startDate">
                Start Date
              </label>

              <input
                id="startDate"
                type="date"
                min={today}
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)

                  if (endDate && e.target.value > endDate) {
                    setEndDate('')
                  }
                }}
                required
              />
            </div>

            {/* End Date */}
            <div className="leave-field">
              <label htmlFor="endDate">
                End Date
              </label>

              <input
                id="endDate"
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>

          </div>

          {/* Reason */}
          <div className="leave-field leave-reason-field">
            <label htmlFor="reason">
              Reason for Leave
            </label>

            <textarea
              id="reason"
              rows={4}
              maxLength={500}
              placeholder="Enter the reason for your leave..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            />

            <small>
              {reason.length}/500 characters
            </small>
          </div>

          <button
            type="submit"
            className="leave-submit-button"
            disabled={submitting || loading}
          >
            {submitting
              ? 'Submitting Request...'
              : 'Submit Leave Request'}
          </button>

        </form>
      </section>

      {/* Leave History */}
      <section className="leave-history-card">

        <div className="leave-history-heading">
          <div>
            <h2>My Leave History</h2>
            <p>
              View and track your submitted leave applications.
            </p>
          </div>

          <span className="leave-history-count">
            {monthlyLeaves} This Month
          </span>
        </div>

        {loading ? (
          <div className="leave-empty">
            Loading leave history...
          </div>
        ) : leaves.length === 0 ? (
          <div className="leave-empty">
            <div className="leave-empty-icon">
              📄
            </div>

            <h3>No Leave Requests Yet</h3>

            <p>
              Your submitted leave applications will appear here.
            </p>
          </div>
        ) : (
          <div className="leave-table-wrapper">

            <table className="leave-table">

              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {[...leaves]
                  .sort((a, b) =>
                    b.startDate.localeCompare(a.startDate)
                  )
                  .map(leave => (
                    <tr key={leave.id}>

                      <td>
                        <strong>
                          {formatLeaveType(leave.leaveType)}
                        </strong>
                      </td>

                      <td>
                        {formatDate(leave.startDate)}
                      </td>

                      <td>
                        {formatDate(leave.endDate)}
                      </td>

                      <td className="leave-reason-cell">
                        {leave.reason || '-'}
                      </td>

                      <td>
                        <span className={getStatusClass(leave.status)}>
                          {leave.status || 'PENDING'}
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
      <footer className="leaves-footer">
        © 2026 NexusHR. PEOPLE. POTENTIAL. PROGRESS.
      </footer>

    </div>
  )
}

