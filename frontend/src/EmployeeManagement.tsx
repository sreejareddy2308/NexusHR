import { useEffect, useMemo, useState, type FormEvent } from 'react'
import DashboardLayout from './components/DashboardLayout'
import './EmployeeManagement.css'

interface Employee {
  id: number
  employeeName: string
  email: string
  department: string
  jobTitle: string
  salary: number
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

const emptyEmployee = {
  employeeName: '',
  email: '',
  department: '',
  jobTitle: '',
  salary: '',
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [inactiveEmployees, setInactiveEmployees] = useState<Employee[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null)
  const [newEmployee, setNewEmployee] = useState(emptyEmployee)

  const getHeaders = () => {
    const token = sessionStorage.getItem('nexushr_token')
    const tokenType =
      sessionStorage.getItem('nexushr_tokenType') || 'Bearer'

    if (!token) {
      throw new Error('Authentication token is missing. Please log in again.')
    }

    return {
      Authorization: `${tokenType} ${token}`,
      'Content-Type': 'application/json',
    }
  }

  // Load active and inactive employees
  async function loadEmployees() {
    try {
      setLoading(true)
      setError('')

      const headers = getHeaders()

      const activeResponse = await fetch('/api/employees', { headers })

      if (!activeResponse.ok) {
        throw new Error(
          `Unable to load employees (${activeResponse.status})`
        )
      }

      const activeResult: ApiResponse<Employee[]> =
        await activeResponse.json()

      setEmployees(
        Array.isArray(activeResult.data) ? activeResult.data : []
      )

      const inactiveResponse = await fetch(
        '/api/employees/inactive',
        { headers }
      )

      if (inactiveResponse.ok) {
        const inactiveResult: ApiResponse<Employee[]> =
          await inactiveResponse.json()

        setInactiveEmployees(
          Array.isArray(inactiveResult.data)
            ? inactiveResult.data
            : []
        )
      } else {
        console.warn(
          'Inactive employees endpoint returned:',
          inactiveResponse.status
        )
        setInactiveEmployees([])
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load employees'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEmployees()
  }, [])

  // Search and filter employees
  const displayedEmployees = useMemo(() => {
    const source = showInactive ? inactiveEmployees : employees
    const search = searchTerm.trim().toLowerCase()

    if (!search) return source

    return source.filter(employee =>
      [
        employee.employeeName,
        employee.email,
        employee.department,
        employee.jobTitle,
      ].some(value => value?.toLowerCase().includes(search))
    )
  }, [employees, inactiveEmployees, showInactive, searchTerm])

  // Edit employee
  function handleEdit(employee: Employee) {
    setEditingEmployeeId(employee.id)

    setNewEmployee({
      employeeName: employee.employeeName,
      email: employee.email,
      department: employee.department || '',
      jobTitle: employee.jobTitle || '',
      salary: String(employee.salary),
    })

    setShowForm(true)
    setShowInactive(false)
    setSearchTerm('')
    setActionError('')
    setSuccessMessage('')
  }

  // Cancel form
  function handleCancel() {
    setShowForm(false)
    setEditingEmployeeId(null)
    setNewEmployee(emptyEmployee)
  }

  // Add or update employee
  async function handleSaveEmployee(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    try {
      setSaving(true)
      setActionError('')
      setSuccessMessage('')

      const headers = getHeaders()
      const isEditing = editingEmployeeId !== null

      const url = isEditing
        ? `/api/employees/${editingEmployeeId}`
        : '/api/employees'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({
          ...newEmployee,
          salary: Number(newEmployee.salary),
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ||
            (isEditing
              ? 'Employee update failed'
              : 'Employee creation failed')
        )
      }

      setShowForm(false)
      setEditingEmployeeId(null)
      setNewEmployee(emptyEmployee)

      setSuccessMessage(
        result?.message ||
          (isEditing
            ? 'Employee updated successfully!'
            : 'Employee added successfully!')
      )

      await loadEmployees()
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to save employee'
      )
    } finally {
      setSaving(false)
    }
  }

  // Deactivate or reactivate employee
  async function changeEmployeeStatus(
    employee: Employee,
    action: 'deactivate' | 'reactivate'
  ) {
    const actionLabel =
      action === 'deactivate' ? 'deactivate' : 'reactivate'

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} ${employee.employeeName}?`
      )
    ) {
      return
    }

    try {
      setActionError('')
      setSuccessMessage('')

      const headers = getHeaders()

      const response = await fetch(
        `/api/employees/${employee.id}/${action}`,
        {
          method: 'PATCH',
          headers,
        }
      )

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Unable to ${actionLabel} employee`
        )
      }

      setSuccessMessage(
        result?.message ||
          `Employee ${
            action === 'deactivate' ? 'deactivated' : 'reactivated'
          } successfully!`
      )

      if (editingEmployeeId === employee.id) {
        handleCancel()
      }

      await loadEmployees()
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Unable to ${actionLabel} employee`
      )
    }
  }

  const formatSalary = (salary: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(salary || 0)

  return (
    <DashboardLayout title="Employee Management">
      <div className="employee-management-page">

        {/* Page heading */}
        <section className="employee-page-heading">
          <div>
            <span className="employee-eyebrow">
              PEOPLE MANAGEMENT
            </span>

            <h1>Employee Management</h1>

            <p>
              Manage your workforce, employee records and
              organizational information.
            </p>
          </div>

          <div className="employee-heading-actions">
            <button
              type="button"
              className="employee-refresh-button"
              onClick={() => void loadEmployees()}
              disabled={loading}
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              className="employee-add-button"
              onClick={() => {
                if (showForm) {
                  handleCancel()
                } else {
                  setEditingEmployeeId(null)
                  setNewEmployee(emptyEmployee)
                  setShowForm(true)
                  setShowInactive(false)
                  setActionError('')
                  setSuccessMessage('')
                }
              }}
            >
              {showForm ? 'Cancel' : '+ Add Employee'}
            </button>
          </div>
        </section>

        {/* Statistics */}
        <section className="employee-stats-grid">
          <div className="employee-stat-card">
            <div className="employee-stat-icon employee-icon-blue">
              ♙
            </div>

            <div>
              <span>Total Employees</span>
              <h2>{employees.length + inactiveEmployees.length}</h2>
              <small>Overall workforce</small>
            </div>
          </div>

          <div className="employee-stat-card">
            <div className="employee-stat-icon employee-icon-green">
              ✓
            </div>

            <div>
              <span>Active Employees</span>
              <h2>{employees.length}</h2>
              <small>Currently active</small>
            </div>
          </div>

          <div className="employee-stat-card">
            <div className="employee-stat-icon employee-icon-orange">
              ◷
            </div>

            <div>
              <span>Inactive Employees</span>
              <h2>{inactiveEmployees.length}</h2>
              <small>Currently inactive</small>
            </div>
          </div>
        </section>

        {/* Notifications */}
        {successMessage && (
          <div className="employee-alert employee-alert-success">
            <span>✓</span>
            {successMessage}

            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {actionError && (
          <div className="employee-alert employee-alert-error">
            <span>!</span>
            {actionError}

            <button
              type="button"
              onClick={() => setActionError('')}
              aria-label="Dismiss error message"
            >
              ×
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <section className="employee-form-card">
            <div className="employee-form-heading">
              <div>
                <h2>
                  {editingEmployeeId !== null
                    ? 'Edit Employee Details'
                    : 'Add New Employee'}
                </h2>

                <p>
                  Enter the employee information below.
                </p>
              </div>

              <span className="employee-form-badge">
                {editingEmployeeId !== null
                  ? 'EDIT MODE'
                  : 'NEW RECORD'}
              </span>
            </div>

            <form onSubmit={handleSaveEmployee}>
              <div className="employee-form-grid">
                <label>
                  Employee Name *
                  <input
                    type="text"
                    placeholder="Enter employee name"
                    value={newEmployee.employeeName}
                    onChange={e =>
                      setNewEmployee({
                        ...newEmployee,
                        employeeName: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Email Address *
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newEmployee.email}
                    onChange={e =>
                      setNewEmployee({
                        ...newEmployee,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Department
                  <input
                    type="text"
                    placeholder="e.g. IT, HR, Finance"
                    value={newEmployee.department}
                    onChange={e =>
                      setNewEmployee({
                        ...newEmployee,
                        department: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Job Title
                  <input
                    type="text"
                    placeholder="Enter job title"
                    value={newEmployee.jobTitle}
                    onChange={e =>
                      setNewEmployee({
                        ...newEmployee,
                        jobTitle: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Salary (₹) *
                  <input
                    type="number"
                    placeholder="Enter salary"
                    min="0"
                    step="0.01"
                    value={newEmployee.salary}
                    onChange={e =>
                      setNewEmployee({
                        ...newEmployee,
                        salary: e.target.value,
                      })
                    }
                    required
                  />
                </label>
              </div>

              <div className="employee-form-actions">
                <button
                  type="submit"
                  className="employee-save-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingEmployeeId !== null
                      ? 'Update Employee'
                      : 'Save Employee'}
                </button>

                <button
                  type="button"
                  className="employee-form-cancel"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Employee Directory */}
        <section className="employee-records-card">
          <div className="employee-records-heading">
            <div>
              <h2>Employee Directory</h2>
              <p>
                View and manage your organization's employees.
              </p>
            </div>

            <div className="employee-record-count">
              {displayedEmployees.length} Records
            </div>
          </div>

          {/* Tabs and search */}
          <div className="employee-toolbar">
            <div className="employee-management-tabs">
              <button
                type="button"
                className={!showInactive ? 'active-tab' : ''}
                onClick={() => {
                  setShowInactive(false)
                  setSearchTerm('')
                  setActionError('')
                }}
              >
                Active
                <span>{employees.length}</span>
              </button>

              <button
                type="button"
                className={showInactive ? 'active-tab' : ''}
                onClick={() => {
                  setShowInactive(true)
                  setSearchTerm('')
                  setActionError('')
                }}
              >
                Inactive
                <span>{inactiveEmployees.length}</span>
              </button>
            </div>

            <div className="employee-search-box">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading && (
            <div className="employee-loading">
              <div className="employee-spinner"></div>
              <p>Loading employee records...</p>
            </div>
          )}

          {error && !loading && (
            <div className="employee-error-state">
              <p>{error}</p>

              <button
                type="button"
                onClick={() => void loadEmployees()}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="employee-management-table-wrapper">
              {displayedEmployees.length === 0 ? (
                <div className="employee-empty-state">
                  <div>♙</div>
                  <h3>No employees found</h3>

                  <p>
                    {searchTerm
                      ? 'Try another search term.'
                      : showInactive
                        ? 'There are no inactive employees.'
                        : 'Add your first employee to get started.'}
                  </p>
                </div>
              ) : (
                <table className="employee-management-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>EMPLOYEE</th>
                      <th>DEPARTMENT</th>
                      <th>JOB TITLE</th>
                      <th>SALARY</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayedEmployees.map(employee => (
                      <tr key={employee.id}>
                        <td className="employee-id-cell">
                          #{employee.id}
                        </td>

                        <td>
                          <div className="employee-identity">
                            <div className="employee-avatar">
                              {employee.employeeName
                                ?.charAt(0)
                                .toUpperCase() || 'E'}
                            </div>

                            <div>
                              <strong>{employee.employeeName}</strong>
                              <span>{employee.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="employee-department">
                            {employee.department || 'Not assigned'}
                          </span>
                        </td>

                        <td>
                          {employee.jobTitle || 'Not specified'}
                        </td>

                        <td className="employee-salary">
                          {formatSalary(employee.salary)}
                        </td>

                        <td>
                          <span
                            className={`employee-status ${
                              showInactive ? 'inactive' : 'active'
                            }`}
                          >
                            <span></span>
                            {showInactive ? 'Inactive' : 'Active'}
                          </span>
                        </td>

                        <td className="employee-actions-cell">
                          {!showInactive ? (
                            <>
                              <button
                                type="button"
                                className="employee-edit-button"
                                onClick={() => handleEdit(employee)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="employee-deactivate-button"
                                onClick={() =>
                                  void changeEmployeeStatus(
                                    employee,
                                    'deactivate'
                                  )
                                }
                              >
                                Deactivate
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="employee-reactivate-button"
                              onClick={() =>
                                void changeEmployeeStatus(
                                  employee,
                                  'reactivate'
                                )
                              }
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="employee-table-footer">
            Showing {displayedEmployees.length} of{' '}
            {showInactive
              ? inactiveEmployees.length
              : employees.length}{' '}
            {showInactive ? 'inactive' : 'active'} employees
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

