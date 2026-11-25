
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ChangeEvent,
} from 'react'

import './PerformanceReviews.css'

interface Employee {
  id: number
  employeeName: string
  email: string
}

interface PerformanceReview {
  id: number
  employeeId: number
  reviewerEmail: string
  reviewPeriod: string
  rating: number
  feedback: string
  strengths: string
  improvementAreas: string
  goalsAchieved: number
  totalGoals: number
  status: string
  reviewDate: string
}

const API = '/api'

const initialForm = {
  employeeId: '',
  reviewerEmail: '',
  reviewPeriod: 'November 2026',
  rating: '4',
  feedback: '',
  strengths: '',
  improvementAreas: '',
  goalsAchieved: '0',
  totalGoals: '0',
}

export default function PerformanceReviews() {
  const token = sessionStorage.getItem('nexushr_token')
  const tokenType =
    sessionStorage.getItem('nexushr_tokenType') || 'Bearer'

  const [employees, setEmployees] = useState<Employee[]>([])
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [form, setForm] = useState(initialForm)

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
  }

  const loadData = async () => {
    if (!token) {
      setError('Please log in again. Authentication token not found.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const [employeeResponse, reviewResponse] = await Promise.all([
        fetch(`${API}/employees`, { headers }),
        fetch(`${API}/performance-reviews`, { headers }),
      ])

      if (!employeeResponse.ok) {
        throw new Error(`Employee API failed: ${employeeResponse.status}`)
      }

      if (!reviewResponse.ok) {
        throw new Error(
          `Performance Review API failed: ${reviewResponse.status}`,
        )
      }

      const employeeData = await employeeResponse.json()
      const reviewData = await reviewResponse.json()

      const employeeList: Employee[] = Array.isArray(employeeData)
        ? employeeData
        : employeeData.data ?? employeeData.content ?? []

      const reviewList: PerformanceReview[] = Array.isArray(reviewData)
        ? reviewData
        : reviewData.data ?? reviewData.content ?? []

      setEmployees(employeeList)
      setReviews(reviewList)
    } catch (err) {
      console.error('Performance Reviews loading error:', err)
      setError(
        err instanceof Error ? err.message : 'Unable to load data.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ ...initialForm })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!token) {
      setError('Please log in again.')
      return
    }

    if (!form.employeeId) {
      setError('Please select an employee.')
      return
    }

    const goalsAchieved = Number(form.goalsAchieved)
    const totalGoals = Number(form.totalGoals)

    if (goalsAchieved < 0 || totalGoals < 0) {
      setError('Goal values cannot be negative.')
      return
    }

    if (goalsAchieved > totalGoals) {
      setError('Goals achieved cannot exceed total goals.')
      return
    }

    const isEditing = editingId !== null

    const payload = {
      employeeId: Number(form.employeeId),
      reviewerEmail: form.reviewerEmail,
      reviewPeriod: form.reviewPeriod,
      rating: Number(form.rating),
      feedback: form.feedback,
      strengths: form.strengths,
      improvementAreas: form.improvementAreas,
      goalsAchieved,
      totalGoals,
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const url = isEditing
        ? `${API}/performance-reviews/${editingId}`
        : `${API}/performance-reviews`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          (await response.text()) || 'Unable to save review.',
        )
      }

      resetForm()
      await loadData()

      setSuccess(
        isEditing
          ? 'Performance review updated successfully.'
          : 'Performance review created successfully.',
      )
    } catch (err) {
      console.error('Save review error:', err)
      setError(
        err instanceof Error ? err.message : 'Unable to save review.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (review: PerformanceReview) => {
    setEditingId(review.id)

    setForm({
      employeeId: String(review.employeeId),
      reviewerEmail: review.reviewerEmail ?? '',
      reviewPeriod: review.reviewPeriod ?? '',
      rating: String(review.rating ?? 4),
      feedback: review.feedback ?? '',
      strengths: review.strengths ?? '',
      improvementAreas: review.improvementAreas ?? '',
      goalsAchieved: String(review.goalsAchieved ?? 0),
      totalGoals: String(review.totalGoals ?? 0),
    })

    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStatusChange = async (id: number, status: string) => {
    if (!token) {
      setError('Please log in again.')
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await fetch(
        `${API}/performance-reviews/${id}/status?status=${encodeURIComponent(status)}`,
        {
          method: 'PUT',
          headers,
        },
      )

      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(
          responseText || 'Unable to update review status.',
        )
      }

      await loadData()
      setSuccess('Review status updated successfully.')
    } catch (err) {
      console.error('Status update error:', err)
      setError(
        err instanceof Error ? err.message : 'Status update failed.',
      )
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await fetch(
        `${API}/performance-reviews/${id}`,
        {
          method: 'DELETE',
          headers,
        },
      )

      if (!response.ok && response.status !== 204) {
        throw new Error('Unable to delete review.')
      }

      if (editingId === id) {
        resetForm()
      }

      await loadData()
      setSuccess('Performance review deleted successfully.')
    } catch (err) {
      console.error('Delete review error:', err)
      setError(
        err instanceof Error ? err.message : 'Delete failed.',
      )
    }
  }

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(item => item.id === employeeId)
    return employee?.employeeName ?? `Employee #${employeeId}`
  }

  const getGoalPercentage = (review: PerformanceReview) => {
    const total = review.totalGoals ?? 0
    const achieved = review.goalsAchieved ?? 0

    if (total <= 0) return 0
    return Math.min(100, Math.round((achieved / total) * 100))
  }

  const filteredReviews = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return reviews.filter(review => {
      const employeeName = getEmployeeName(review.employeeId).toLowerCase()
      const period = (review.reviewPeriod ?? '').toLowerCase()
      const reviewer = (review.reviewerEmail ?? '').toLowerCase()
      const status = (review.status ?? 'PENDING').toUpperCase()

      const matchesSearch =
        !search ||
        employeeName.includes(search) ||
        period.includes(search) ||
        reviewer.includes(search)

      const matchesStatus =
        statusFilter === 'ALL' || status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [reviews, employees, searchTerm, statusFilter])

  const pendingCount = reviews.filter(
    review => (review.status ?? 'PENDING').toUpperCase() === 'PENDING',
  ).length

  const completedCount = reviews.filter(
    review => (review.status ?? '').toUpperCase() === 'COMPLETED',
  ).length

  const approvedCount = reviews.filter(
    review => (review.status ?? '').toUpperCase() === 'APPROVED',
  ).length

  const averageRating = reviews.length
    ? (
        reviews.reduce((total, review) => total + (review.rating || 0), 0) /
        reviews.length
      ).toFixed(1)
    : '0.0'

  const getStatusClass = (status: string) => {
    const normalized = (status || 'PENDING').toLowerCase()
    return ['pending', 'completed', 'approved'].includes(normalized)
      ? normalized
      : 'pending'
  }

  return (
    <div className="performance-reviews-page">
      <div className="reviews-intro">
        <div>
          <span className="reviews-eyebrow">PEOPLE DEVELOPMENT</span>
          <h2>Review workspace</h2>
          <p>
            Evaluate employee performance, recognize achievements and
            support continuous growth.
          </p>
        </div>

        <button
          type="button"
          className="reviews-refresh-button"
          onClick={loadData}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="review-alert review-alert-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="review-alert review-alert-success" role="status">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      <section className="review-stats">
        <article className="review-stat-card">
          <div className="review-stat-icon stat-icon-blue">▤</div>
          <div>
            <span>Total reviews</span>
            <strong>{reviews.length}</strong>
            <small>All employee reviews</small>
          </div>
        </article>

        <article className="review-stat-card">
          <div className="review-stat-icon stat-icon-amber">◷</div>
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
            <small>Awaiting completion</small>
          </div>
        </article>

        <article className="review-stat-card">
          <div className="review-stat-icon stat-icon-green">✓</div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
            <small>Reviews completed</small>
          </div>
        </article>

        <article className="review-stat-card">
          <div className="review-stat-icon stat-icon-purple">★</div>
          <div>
            <span>Average rating</span>
            <strong>{averageRating}<small className="rating-out-of">/5</small></strong>
            <small>{approvedCount} approved reviews</small>
          </div>
        </article>
      </section>

      <section className="review-form-panel">
        <div className="review-section-heading">
          <div>
            <span className="section-kicker">
              {editingId !== null ? 'EDIT EXISTING REVIEW' : 'REVIEW ENTRY'}
            </span>
            <h3>
              {editingId !== null
                ? 'Update performance review'
                : 'Create performance review'}
            </h3>
            <p>
              Enter the employee details, performance rating and review
              feedback.
            </p>
          </div>

          {editingId !== null && (
            <span className="editing-indicator">Editing review #{editingId}</span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="review-form-subheading">
            <span className="form-step">01</span>
            <div>
              <strong>Review information</strong>
              <small>Employee and evaluation details</small>
            </div>
          </div>

          <div className="review-form-grid">
            <label>
              Employee <span className="required-mark">*</span>
              <select
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                required
                disabled={editingId !== null}
              >
                <option value="">Select an employee</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeName} (ID: {employee.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Reviewer email
              <input
                type="email"
                name="reviewerEmail"
                value={form.reviewerEmail}
                onChange={handleChange}
                placeholder="hr@nexushr.com"
              />
            </label>

            <label>
              Review period <span className="required-mark">*</span>
              <input
                type="text"
                name="reviewPeriod"
                value={form.reviewPeriod}
                onChange={handleChange}
                placeholder="November 2026"
                required
              />
            </label>

            <label>
              Performance rating <span className="required-mark">*</span>
              <select
                name="rating"
                value={form.rating}
                onChange={handleChange}
                required
              >
                <option value="1">1 - Poor</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="3">3 - Meets Expectations</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </label>

            <label>
              Goals achieved
              <input
                type="number"
                name="goalsAchieved"
                min="0"
                value={form.goalsAchieved}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Total goals
              <input
                type="number"
                name="totalGoals"
                min="0"
                value={form.totalGoals}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="review-form-subheading review-feedback-heading">
            <span className="form-step">02</span>
            <div>
              <strong>Performance assessment</strong>
              <small>Document feedback and development opportunities</small>
            </div>
          </div>

          <div className="review-form-grid">
            <label className="review-full-width">
              Overall feedback
              <textarea
                name="feedback"
                value={form.feedback}
                onChange={handleChange}
                placeholder="Summarize the employee's performance during this review period..."
                rows={3}
              />
            </label>

            <label>
              Key strengths
              <textarea
                name="strengths"
                value={form.strengths}
                onChange={handleChange}
                placeholder="Highlight skills, contributions and achievements..."
                rows={3}
              />
            </label>

            <label>
              Areas for improvement
              <textarea
                name="improvementAreas"
                value={form.improvementAreas}
                onChange={handleChange}
                placeholder="Identify development areas and opportunities..."
                rows={3}
              />
            </label>
          </div>

          <div className="review-form-actions">
            <button
              type="submit"
              className="review-primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId !== null
                  ? 'Save changes'
                  : 'Create review'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="review-secondary-button"
                onClick={resetForm}
              >
                Cancel editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="reviews-list-section">
        <div className="reviews-list-heading">
          <div>
            <span className="section-kicker">TEAM EVALUATIONS</span>
            <h3>Employee performance reviews</h3>
            <p>Review employee progress and manage evaluation status.</p>
          </div>
          <span className="review-count">{filteredReviews.length} reviews</span>
        </div>

        <div className="review-toolbar">
          <div className="review-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search employee, reviewer or period..."
              aria-label="Search performance reviews"
            />
          </div>

          <select
            className="review-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter by review status"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>

        {loading ? (
          <div className="reviews-empty-state">
            <div className="review-loading-spinner" />
            <strong>Loading performance reviews</strong>
            <p>Please wait while your review records are retrieved.</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="reviews-empty-state">
            <div className="empty-review-icon">▤</div>
            <strong>
              {reviews.length === 0
                ? 'No performance reviews yet'
                : 'No matching reviews found'}
            </strong>
            <p>
              {reviews.length === 0
                ? 'Create your first employee performance review using the form above.'
                : 'Try changing your search term or status filter.'}
            </p>
          </div>
        ) : (
          <div className="review-cards-grid">
            {filteredReviews.map(review => {
              const status = review.status ?? 'PENDING'
              const goalPercentage = getGoalPercentage(review)

              return (
                <article className="review-card" key={review.id}>
                  <div className="review-card-top">
                    <div className="review-employee-avatar">
                      {getEmployeeName(review.employeeId)
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="review-employee-details">
                      <h4>{getEmployeeName(review.employeeId)}</h4>
                      <span>Employee ID: {review.employeeId}</span>
                    </div>

                    <span className={`review-status ${getStatusClass(status)}`}>
                      {status}
                    </span>
                  </div>

                  <div className="review-card-meta">
                    <div>
                      <span>REVIEW PERIOD</span>
                      <strong>{review.reviewPeriod || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span>RATING</span>
                      <strong className="review-rating">
                        <span aria-hidden="true">★</span> {review.rating ?? 0}/5
                      </strong>
                    </div>
                  </div>

                  <div className="review-goals">
                    <div className="review-goals-label">
                      <span>Goals achieved</span>
                      <strong>
                        {review.goalsAchieved ?? 0}/{review.totalGoals ?? 0}
                      </strong>
                    </div>
                    <div
                      className="review-progress-track"
                      role="progressbar"
                      aria-valuenow={goalPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Goals achieved"
                    >
                      <div
                        className="review-progress-fill"
                        style={{ width: `${goalPercentage}%` }}
                      />
                    </div>
                    <small>{goalPercentage}% completion</small>
                  </div>

                  <div className="review-card-content">
                    <div>
                      <strong>Feedback</strong>
                      <p>{review.feedback || 'No feedback provided.'}</p>
                    </div>

                    <div>
                      <strong>Key strengths</strong>
                      <p>{review.strengths || 'Not provided.'}</p>
                    </div>

                    <div>
                      <strong>Improvement areas</strong>
                      <p>
                        {review.improvementAreas || 'Not provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="review-card-footer">
                    <button
                      type="button"
                      className="review-edit-button"
                      onClick={() => handleEdit(review)}
                    >
                      Edit review
                    </button>

                    <select
                      className="review-status-select"
                      value={status}
                      onChange={e =>
                        handleStatusChange(review.id, e.target.value)
                      }
                      aria-label={`Change status for ${getEmployeeName(review.employeeId)}`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="APPROVED">Approved</option>
                    </select>

                    <button
                      type="button"
                      className="review-delete-button"
                      onClick={() => handleDelete(review.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

