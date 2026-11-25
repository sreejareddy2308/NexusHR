import { useEffect, useState } from 'react'
import './App.css'
//import Login from './Login'
interface Employee {
  id: number
  employeeName: string
  email: string
  department: string
  jobTitle: string
  salary: number
}

function Dashboard() {
    //return <Login />
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchName, setSearchName] = useState('')
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [status, setStatus] = useState('Loading employees...')
  const [loading, setLoading] = useState(false)

  const [employeeName, setEmployeeName] = useState('')
  const [email, setEmail] = useState('')
  const [newDepartment, setNewDepartment] = useState('')
  const [newJobTitle, setNewJobTitle] = useState('')
  const [salary, setSalary] = useState('')

  const [savingEmployee, setSavingEmployee] = useState(false)
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null)
  const [updatingEmployee, setUpdatingEmployee] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages] = useState(0)

  // Triggered on initialization to clear the default status message
  useEffect(() => {
    fetchEmployees('/api/employees', 'Loading employees')
  }, [])

  async function addEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const newEmployee = {
      employeeName: employeeName.trim(),
      email: email.trim(),
      department: newDepartment.trim(),
      jobTitle: newJobTitle.trim(),
      salary: Number(salary)
    }
    setSavingEmployee(true)
    setStatus('Adding employee...')
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEmployee)
      })
      if (!response.ok) {
        throw new Error('HTTP ' + response.status)
      }
      const result = await response.json()

      setEmployeeName('')
      setEmail('')
      setNewDepartment('')
      setNewJobTitle('')
      setSalary('')
      setStatus(result.message || 'Employee added successfully.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to add employee.')
    } finally {
      setSavingEmployee(false)
    }
  }

  async function updateEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editingEmployeeId === null) {
      return
    }
    const updatedEmployee = {
      employeeName: employeeName.trim(),
      email: email.trim(),
      department: newDepartment.trim(),
      jobTitle: newJobTitle.trim(),
      salary: Number(salary)
    }
    setUpdatingEmployee(true)
    setStatus('Updating employee...')
    try {
      const response = await fetch('/api/employees/' + editingEmployeeId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedEmployee)
      })
      if (!response.ok) {
        throw new Error('HTTP ' + response.status)
      }
      const result = await response.json()

      setEditingEmployeeId(null)
      setEmployeeName('')
      setEmail('')
      setNewDepartment('')
      setNewJobTitle('')
      setSalary('')
      setStatus(result.message || 'Employee updated successfully.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to update employee.')
    } finally {
      setUpdatingEmployee(false)
    }
  }

  async function deleteEmployee(id: number, name: string) {
    const confirmed = window.confirm('Are you sure you want to delete ' + name + '?')
    if (!confirmed) {
      return
    }
    setStatus('Deleting employee...')
    try {
      const response = await fetch('/api/employees/' + id, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('HTTP ' + response.status)
      }
      const result = await response.json()

      if (editingEmployeeId === id) {
        setEditingEmployeeId(null)
        setEmployeeName('')
        setEmail('')
        setNewDepartment('')
        setNewJobTitle('')
        setSalary('')
      }
      setStatus(result.message || 'Employee deleted successfully.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to delete employee.')
    }
  }

  async function fetchEmployees(url: string, action: string) {
    setLoading(true)
    setStatus(action + ' in progress...')
    try {
      const token = sessionStorage.getItem('nexushr_token')

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('HTTP ' + response.status)
      }
     // const result = await response.json()
      //const arrayData = result.data || []
      const result = await response.json()
      const arrayData = Array.isArray(result)
        ? result
        : Array.isArray(result.content)
          ? result.content
          : Array.isArray(result.data)
            ? result.data
            : []
      setEmployees(arrayData)
      setStatus(action + ' completed. ' + arrayData.length + ' employee(s) found.')
    } catch (error) {
      console.error('Employee API Error:', error)

      setStatus(action + ' failed.' +
          (error instanceof Error ? error.message : String(error))
          )
    } finally {
      setLoading(false)
    }
  }

  function handleSearchNameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!searchName.trim()) return
    fetchEmployees(`/api/employees/search?name=${encodeURIComponent(searchName.trim())}`, 'Search')
  }

  function handleFilterDeptSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!department) return
    fetchEmployees(`/api/employees/filter/department?department=${encodeURIComponent(department)}`, 'Department filter')
  }

  function handleSearchJobSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!jobTitle.trim()) return
    fetchEmployees(`/api/employees/search/job-title?jobTitle=${encodeURIComponent(jobTitle.trim())}`, 'Job title search')
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>NexusHR</h1>
        <p>Employee Management Dashboard</p>
      </header>

      <main className="dashboard-main">
        <section className="summary-card">
          <h2>Employees Displayed</h2>
          <p className="employee-count">{employees.length}</p>
        </section>

        <section className="employee-section">
          <h2>Employee Management</h2>
          <form className="add-employee-form" onSubmit={editingEmployeeId !== null ? updateEmployee : addEmployee}>
            <h3>{editingEmployeeId !== null ? 'Edit Employee' : 'Add New Employee'}</h3>
            <input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} placeholder="Employee Name" required />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
            <input value={newDepartment} onChange={(event) => setNewDepartment(event.target.value)} placeholder="Department" required />
            <input value={newJobTitle} onChange={(event) => setNewJobTitle(event.target.value)} placeholder="Job Title" required />
            <input type="number" min="0" max="100000000" step="0.01" value={salary} onChange={(event) => setSalary(event.target.value)} placeholder="Salary" required />
            <button type="submit" disabled={savingEmployee || updatingEmployee} >
              {editingEmployeeId !== null ? (updatingEmployee ? 'Updating...' : 'Update Employee') : (savingEmployee ? 'Adding...' : 'Add Employee')}
            </button>
            {editingEmployeeId !== null && (
              <button type="button" onClick={() => {
                setEditingEmployeeId(null)
                setEmployeeName('')
                setEmail('')
                setNewDepartment('')
                setNewJobTitle('')
                setSalary('')
                setStatus('Edit cancelled.')
              }} >
                Cancel
              </button>
            )}
          </form>

          <div className="filters">
            <form onSubmit={handleSearchNameSubmit}>
              <input value={searchName} onChange={(event) => setSearchName(event.target.value)} placeholder="Search employees by name" />
              <button type="submit">Search Name</button>
            </form>
            <form onSubmit={handleFilterDeptSubmit}>
              <select value={department} onChange={(event) => setDepartment(event.target.value)} >
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="Engineering">Engineering</option>
              </select>
              <button type="submit">Filter Department</button>
            </form>
            <form onSubmit={handleSearchJobSubmit}>
              <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Search by job title" />
              <button type="submit">Search Job Title</button>
            </form>
          </div>

          <p className="status">{loading ? 'Please wait...' : status}</p>

          <div className="pagination">
            <button type="button" disabled={loading || currentPage === 0} onClick={() => setCurrentPage(currentPage - 1)} >
              Previous
            </button>
            <span> Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages} </span>
            <button type="button" disabled={loading || currentPage >= totalPages - 1} onClick={() => setCurrentPage(currentPage + 1)} >
              Next
            </button>
          </div>

<div className="employee-grid">
  {employees.map((employee) => (
    <article className="employee-card" key={employee.id}>
      <h3>{employee.employeeName}</h3>
      <p><strong>Department:</strong> {employee.department}</p>
      <p><strong>Job Title:</strong> {employee.jobTitle}</p>
      <p><strong>Email:</strong> {employee.email}</p>
      <p><strong>Salary:</strong> ${employee.salary}</p>

      <button
        type="button"
        onClick={() => {
          setEditingEmployeeId(employee.id)
          setEmployeeName(employee.employeeName)
          setEmail(employee.email)
          setNewDepartment(employee.department)
          setNewJobTitle(employee.jobTitle)
          setSalary(String(employee.salary))
          setStatus('Editing employee: ' + employee.employeeName)
        }}
      >
        Edit
      </button>

      <button type="button"
        onClick={() => deleteEmployee(employee.id, employee.employeeName)}
      >
        Delete
      </button>
    </article>
  ))}
   </div>
    </section>
    </main>
    </div>
  )
}

export default Dashboard