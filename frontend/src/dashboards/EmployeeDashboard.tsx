import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import './EmployeeDashboard.css'

interface EmployeeProfile {
  employeeName: string
  email: string
  department?: string
  jobTitle?: string
}

interface ApiResponse {
  success: boolean
  message: string
  data: EmployeeProfile
}

export default function EmployeeDashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch logged-in employee profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = sessionStorage.getItem('nexushr_token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          '/api/employees/me',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error('Unable to load employee profile')
        }

        const result: ApiResponse = await response.json()

        if (result.success && result.data) {
          setProfile(result.data)
        }
      } catch (error) {
        console.error('Employee profile error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const features = [
    {
      title: 'My Profile',
      description: 'View and update your personal information.',
      icon: '👤',
      path: '/employee/profile',
    },
    {
      title: 'Attendance',
      description: 'Track your daily attendance and working hours.',
      icon: '📅',
      path: '/employee/attendance',
    },
    {
      title: 'Leave Management',
      description: 'Apply for leave and track your requests.',
      icon: '🌴',
      path: '/employee/leaves',
    },
    {
      title: 'My Payslips',
      description: 'View and download your monthly payslips.',
      icon: '💰',
      path: '/employee/payslips',
    },
    {
      title: 'Documents',
      description: 'View and download your personal documents.',
      icon: '📄',
      path: '/employee/documents',
    },
    {
      title: 'Notifications',
      description: 'View important updates and announcements.',
      icon: '🔔',
      path: '/notifications',
    },
  ]

  return (
    <DashboardLayout title="Employee Dashboard">
      <div className="employee-main">

        {/* Welcome Banner */}
        <section className="employee-welcome">
          <div>
            <span>EMPLOYEE PORTAL</span>

            <h2>
              {loading
                ? 'Welcome to NexusHR 👋'
                : `Welcome${profile?.employeeName ? `, ${profile.employeeName}` : ''}! 👋`}
            </h2>

            <p>
              {profile
                ? `${profile.jobTitle || 'Employee'}${profile.department ? ` | ${profile.department}` : ''}`
                : 'Manage your profile, attendance, leaves, payslips and important updates from one place.'}
            </p>
          </div>

          <div className="welcome-symbol">N</div>
        </section>

        {/* Employee Workspace */}
        <section className="employee-section">
          <div className="employee-section-heading">
            <h2>My Workspace</h2>
            <p>Access your employee services and information.</p>
          </div>

          {/* Feature Cards */}
          <div className="employee-feature-grid">
            {features.map((feature) => (
              <button
                key={feature.title}
                className="employee-feature-card"
                onClick={() => navigate(feature.path)}
              >
                <span className="feature-icon">
                  {feature.icon}
                </span>

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>

                <span className="feature-link">
                  Open →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="employee-footer">
          © 2026 NexusHR. PEOPLE. POTENTIAL. PROGRESS.
        </footer>

      </div>
    </DashboardLayout>
  )
}

