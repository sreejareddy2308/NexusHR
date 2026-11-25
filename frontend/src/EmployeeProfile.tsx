import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import './EmployeeProfile.css'

interface EmployeeProfileData {
  fullName: string
  email: string
  department: string
  jobTitle: string
  phone: string
  location: string
  salary?: number | null
}

interface EmployeeApiData {
  id?: number
  employeeName: string
  email: string
  department: string
  jobTitle: string
  phone: string
  location: string
  salary?: number | null
}

interface UpdateProfileRequest {
  employeeName: string
  phone: string
  location: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

const API_URL = '/api/employees/me'

export default function EmployeeProfile() {
  const navigate = useNavigate()

  const token = sessionStorage.getItem('nexushr_token')
  const email = sessionStorage.getItem('nexushr_email') || ''

  const [profile, setProfile] = useState<EmployeeProfileData>({
    fullName: '',
    email,
    department: '',
    jobTitle: '',
    phone: '',
    location: '',
    salary: null,
  })

  const [originalProfile, setOriginalProfile] =
    useState<EmployeeProfileData | null>(null)

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Load employee profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        const result: ApiResponse<EmployeeApiData> =
          await response.json()

        if (!response.ok) {
          throw new Error(
            result.message || 'Unable to load employee profile.'
          )
        }

        const employee = result.data

        const loadedProfile: EmployeeProfileData = {
          fullName: employee.employeeName || '',
          email: employee.email || email,
          department: employee.department || '',
          jobTitle: employee.jobTitle || '',
          phone: employee.phone || '',
          location: employee.location || '',
          salary: employee.salary ?? null,
        }

        setProfile(loadedProfile)
        setOriginalProfile(loadedProfile)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading your profile.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token, email, navigate])

  // Handle input changes
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Save employee profile
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      // Only send fields employees are allowed to update
      const requestBody: UpdateProfileRequest = {
        employeeName: profile.fullName,
        phone: profile.phone,
        location: profile.location,
      }

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result: ApiResponse<EmployeeApiData> =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'Unable to update profile.'
        )
      }

      const updatedEmployee = result.data

      const updatedProfile: EmployeeProfileData = {
        fullName: updatedEmployee.employeeName || '',
        email: updatedEmployee.email || profile.email,
        department: updatedEmployee.department || '',
        jobTitle: updatedEmployee.jobTitle || '',
        phone: updatedEmployee.phone || '',
        location: updatedEmployee.location || '',
        salary: updatedEmployee.salary ?? profile.salary,
      }

      setProfile(updatedProfile)
      setOriginalProfile(updatedProfile)
      setEditing(false)
      setMessage('Your profile has been updated successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving your profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Cancel editing and restore original details
  const handleCancel = () => {
    if (originalProfile) {
      setProfile(originalProfile)
    }

    setEditing(false)
    setMessage('')
    setError('')
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="employee-profile-page">

        {loading ? (
          <div className="profile-loading">
            <h2>Loading your profile...</h2>
          </div>
        ) : (
          <>
            {/* Profile Banner */}
            <section className="profile-banner">

              <div className="profile-large-avatar">
                {profile.fullName
                  ? profile.fullName.charAt(0).toUpperCase()
                  : email.charAt(0).toUpperCase()}
              </div>

              <div className="profile-banner-info">
                <h2>{profile.fullName || 'Employee Name'}</h2>
                <p>{profile.jobTitle || 'Employee'}</p>
                <span>{profile.email}</span>
              </div>

              <div className="profile-status">
                <span className="status-dot"></span>
                Employee Portal
              </div>

            </section>

            {/* Profile Details */}
            <section className="profile-card">

              <div className="profile-card-heading">
                <div>
                  <h2>Personal Information</h2>
                  <p>Manage your employee information.</p>
                </div>

                {!editing && (
                  <button
                    type="button"
                    className="profile-edit-button"
                    onClick={() => {
                      setMessage('')
                      setError('')
                      setEditing(true)
                    }}
                  >
                    ✎ Edit Profile
                  </button>
                )}
              </div>

              {message && (
                <div className="profile-success-message">
                  {message}
                </div>
              )}

              {error && (
                <div className="profile-error-message">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave}>

                <div className="profile-form-grid">

                  <div className="profile-field">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      value={profile.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      disabled={!editing || saving}
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={profile.email}
                      disabled
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="department">Department</label>
                    <input
                      id="department"
                      type="text"
                      name="department"
                      value={profile.department}
                      disabled
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="jobTitle">Job Title</label>
                    <input
                      id="jobTitle"
                      type="text"
                      name="jobTitle"
                      value={profile.jobTitle}
                      disabled
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      disabled={!editing || saving}
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      type="text"
                      name="location"
                      value={profile.location}
                      onChange={handleChange}
                      placeholder="Enter your location"
                      disabled={!editing || saving}
                    />
                  </div>

                </div>

                {editing && (
                  <div className="profile-form-actions">

                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="profile-save-button"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>

                  </div>
                )}

              </form>
            </section>

            <footer className="profile-footer">
              © 2026 NexusHR. PEOPLE. POTENTIAL. PROGRESS.
            </footer>
          </>
        )}

      </div>
    </DashboardLayout>
  )
}

