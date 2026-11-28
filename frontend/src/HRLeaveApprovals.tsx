import { useCallback, useEffect, useState } from 'react'
import './HRLeaveApprovals.css'

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

export default function HRLeaveApprovals() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchLeaves = useCallback(async () => {
    const token = sessionStorage.getItem('nexushr_token')

    if (!token) {
      setError('Authentication token not found. Please log in again.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/leaves', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Unable to load leave requests.')
      }

      const data: LeaveRequest[] = await response.json()
      setLeaves(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  const updateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    const token = sessionStorage.getItem('nexushr_token')

    if (!token) {
      setError('Please log in again.')
      return
    }

    setUpdatingId(id)
    setError('')

    try {
      const response = await fetch(
        `/api/leaves/${id}/status?status=${status}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `Unable to ${status.toLowerCase()} request.`)
      }

      await fetchLeaves()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed.')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (date: string) => {
    if (!date) return '-'
    return new Date(`${date}T00:00:00`).toLocaleDateString()
  }

  const getStatusClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'hr-leave-status approved'
      case 'REJECTED':
        return 'hr-leave-status rejected'
      default:
        return 'hr-leave-status pending'
    }
  }

  const pendingCount = leaves.filter(
    (leave) => leave.status?.toUpperCase() === 'PENDING',
  ).length

  const approvedCount = leaves.filter(
    (leave) => leave.status?.toUpperCase() === 'APPROVED',
  ).length

  const rejectedCount = leaves.filter(
    (leave) => leave.status?.toUpperCase() === 'REJECTED',
  ).length

  return (
    <div className="hr-leave-page">
      <header className="hr-leave-header">
        <div>
          <h1>Leave Approvals</h1>
          <p>Review and manage employee leave requests.</p>
        </div>

        <button onClick={fetchLeaves} disabled={loading}>
          Refresh
        </button>
      </header>

      <section className="hr-leave-summary">
        <div className="hr-leave-stat">
          <span>Total Requests</span>
          <strong>{leaves.length}</strong>
        </div>

        <div className="hr-leave-stat">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="hr-leave-stat">
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </div>

        <div className="hr-leave-stat">
          <span>Rejected</span>
          <strong>{rejectedCount}</strong>
        </div>
      </section>

      <section className="hr-leave-table-card">
        <h2>Employee Leave Requests</h2>

        {error && <div className="hr-leave-error">{error}</div>}

        {loading ? (
          <p>Loading leave requests...</p>
        ) : leaves.length === 0 ? (
          <p className="hr-leave-empty">No leave requests found.</p>
        ) : (
          <div className="hr-leave-table-wrapper">
            <table className="hr-leave-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Employee ID</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {leaves.map((leave) => {
                  const isPending =
                    leave.status?.toUpperCase() === 'PENDING'

                  return (
                    <tr key={leave.id}>
                      <td>#{leave.id}</td>
                      <td>{leave.employeeId}</td>
                      <td>{leave.leaveType}</td>
                      <td>{formatDate(leave.startDate)}</td>
                      <td>{formatDate(leave.endDate)}</td>
                      <td>{leave.reason || '-'}</td>
                      <td>
                        <span className={getStatusClass(leave.status)}>
                          {leave.status}
                        </span>
                      </td>
                      <td>
                        {isPending ? (
                          <div className="hr-leave-actions">
                            <button
                              className="approve-button"
                              disabled={updatingId === leave.id}
                              onClick={() => updateStatus(leave.id, 'APPROVED')}
                            >
                              Approve
                            </button>

                            <button
                              className="reject-button"
                              disabled={updatingId === leave.id}
                              onClick={() => updateStatus(leave.id, 'REJECTED')}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="hr-leave-processed">Processed</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

