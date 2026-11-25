import { useEffect, useState, type FormEvent } from 'react'
import './Performance.css'

interface Employee {
  id: number
  employeeName: string
  email: string
}

interface PerformanceGoal {
  id: number
  employeeId: number
  employeeName: string
  title: string
  description: string
  progress: number
  status: string
  dueDate: string
  createdAt: string
}

const API = '/api'

export default function Performance() {
  const [goals, setGoals] = useState<PerformanceGoal[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [employeeId, setEmployeeId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [progressValues, setProgressValues] = useState<
    Record<number, number>
  >({})

  const token = sessionStorage.getItem('nexushr_token')
  const tokenType =
    sessionStorage.getItem('nexushr_tokenType') || 'Bearer'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `${tokenType} ${token}`
  }

  // Load performance goals and employees
  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [goalResponse, employeeResponse] = await Promise.all([
        fetch(`${API}/performance/goals`, { headers }),
        fetch(`${API}/employees`, { headers }),
      ])

      if (!goalResponse.ok || !employeeResponse.ok) {
        throw new Error('Unable to load performance data.')
      }

      const goalData = await goalResponse.json()
      const employeeData = await employeeResponse.json()

      setGoals(
        Array.isArray(goalData)
          ? goalData
          : goalData.content ?? []
      )

      setEmployees(
        Array.isArray(employeeData)
          ? employeeData
          : employeeData.data ?? employeeData.content ?? []
      )

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Create performance goal
  const createGoal = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    try {
      setError('')

      const response = await fetch(
        `${API}/performance/goals`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            employeeId: Number(employeeId),
            title,
            description,
            dueDate,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create performance goal.')
      }

      setTitle('')
      setDescription('')
      setEmployeeId('')
      setDueDate('')

      await loadData()

      alert('Performance goal created successfully!')

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create goal.'
      )
    }
  }

  // Update goal progress
  const updateProgress = async (
    goal: PerformanceGoal,
    progress: number
  ) => {
    try {
      setError('')

      const response = await fetch(
        `${API}/performance/goals/${goal.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            employeeId: goal.employeeId,
            title: goal.title,
            description: goal.description,
            dueDate: goal.dueDate,
            progress,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update goal progress.')
      }

      setProgressValues(prev => {
        const updated = { ...prev }
        delete updated[goal.id]
        return updated
      })

      await loadData()

      alert('Progress updated successfully!')

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update progress.'
      )
    }
  }

  // Delete performance goal
  const deleteGoal = async (id: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this goal?'
      )
    ) {
      return
    }

    try {
      setError('')

      const response = await fetch(
        `${API}/performance/goals/${id}`,
        {
          method: 'DELETE',
          headers,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete performance goal.')
      }

      setProgressValues(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })

      await loadData()

      alert('Performance goal deleted successfully!')

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete goal.'
      )
    }
  }

  // Performance statistics
  const completed = goals.filter(
    goal => goal.status === 'COMPLETED'
  ).length

  const inProgress = goals.filter(
    goal => goal.status === 'IN_PROGRESS'
  ).length

  const notStarted = goals.filter(
    goal => goal.status === 'NOT_STARTED'
  ).length

  return (
    <div className="performance-page">

      {/* Header */}
      <header className="performance-header">
        <div>
          <h1>Performance Management</h1>
          <p>
            Track employee goals, progress and achievements.
          </p>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="performance-error">
          {error}
        </div>
      )}

      {/* Performance Summary */}
      <section className="performance-summary">

        <div className="performance-summary-card">
          <h3>Total Goals</h3>
          <h2>{goals.length}</h2>
        </div>

        <div className="performance-summary-card">
          <h3>Completed</h3>
          <h2>{completed}</h2>
        </div>

        <div className="performance-summary-card">
          <h3>In Progress</h3>
          <h2>{inProgress}</h2>
        </div>

        <div className="performance-summary-card">
          <h3>Not Started</h3>
          <h2>{notStarted}</h2>
        </div>

      </section>

      {/* Create Goal Form */}
      <section className="performance-form-section">

        <h2>Create Performance Goal</h2>

        <form
          onSubmit={createGoal}
          className="performance-form"
        >

          <div className="performance-field">
            <label>Employee</label>

            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              required
            >
              <option value="">Select Employee</option>

              {employees.map(employee => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.employeeName} (ID: {employee.id})
                </option>
              ))}

            </select>
          </div>

          <div className="performance-field">
            <label>Goal Title</label>

            <input
              type="text"
              placeholder="Enter goal title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={150}
            />
          </div>

          <div className="performance-field">
            <label>Description</label>

            <textarea
              placeholder="Describe the performance goal"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div className="performance-field">
            <label>Due Date</label>

            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <button
            type="submit"
            className="performance-submit"
            disabled={!employees.length}
          >
            Create Goal
          </button>

        </form>

      </section>

      {/* Employee Performance Goals */}
      <section className="performance-goals-section">

        <h2>Employee Performance Goals</h2>

        {loading ? (
          <p>Loading performance goals...</p>
        ) : goals.length === 0 ? (
          <p>
            No performance goals found. Create your first goal.
          </p>
        ) : (

          <div className="performance-goals-grid">

            {goals.map(goal => {

              const progress = goal.progress ?? 0
              const status = goal.status ?? 'NOT_STARTED'

              return (
                <article
                  className="performance-goal-card"
                  key={goal.id}
                >

                  <div className="performance-goal-top">

                    <div>
                      <h3>{goal.title}</h3>

                      <p>{goal.employeeName}</p>

                      <small>
                        Employee ID: {goal.employeeId}
                      </small>
                    </div>

                    <span
                      className={`goal-status ${status.toLowerCase()}`}
                    >
                      {status.replace('_', ' ')}
                    </span>

                  </div>

                  <p className="performance-description">
                    {goal.description || 'No description provided.'}
                  </p>

                  {/* Progress Information */}
                  <div className="performance-progress-info">
                    <strong>Progress</strong>
                    <strong>{progress}%</strong>
                  </div>

                  {/* Progress Bar */}
                  <div className="performance-progress-track">
                    <div
                      className="performance-progress-fill"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  {/* Progress Slider */}
                  <label className="progress-label">
                    Update Progress
                  </label>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={
                      progressValues[goal.id] ?? progress
                    }
                    onChange={e =>
                      setProgressValues(prev => ({
                        ...prev,
                        [goal.id]: Number(e.target.value),
                      }))
                    }
                    disabled={status === 'COMPLETED'}
                    className="performance-range"
                  />

                  {/* Save Progress */}
                  <button
                    type="button"
                    onClick={() =>
                      updateProgress(
                        goal,
                        progressValues[goal.id] ?? progress
                      )
                    }
                    disabled={
                      progressValues[goal.id] === undefined ||
                      progressValues[goal.id] === progress
                    }
                  >
                    Save Progress
                  </button>

                  {/* Goal Footer */}
                  <div className="performance-goal-footer">

                    <span>
                      Due: {goal.dueDate}
                    </span>

                    <button
                      type="button"
                      className="performance-delete"
                      onClick={() => deleteGoal(goal.id)}
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

