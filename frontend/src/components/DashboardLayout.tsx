import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './DashboardLayout.css'

interface DashboardLayoutProps {
  title: string
  children: ReactNode
}

interface MenuItem {
  label: string
  path: string
}

export default function DashboardLayout({
  title,
  children,
}: DashboardLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const email =
    sessionStorage.getItem('nexushr_email') || 'User'

  // Read and normalize user roles
  const roles: string[] = (() => {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem('nexushr_roles') || '[]'
      )

      const roleList = Array.isArray(stored)
        ? stored
        : typeof stored === 'string'
          ? [stored]
          : []

      return roleList.map((r: unknown) =>
        String(r)
          .trim()
          .toUpperCase()
          .replace(/^ROLE_/, '')
      )
    } catch {
      return []
    }
  })()

  // Prioritize roles consistently
  const role =
    roles.includes('ADMIN')
      ? 'ROLE_ADMIN'
      : roles.includes('HR_MANAGER')
        ? 'ROLE_HR_MANAGER'
        : roles.includes('EMPLOYEE')
          ? 'ROLE_EMPLOYEE'
          : 'ROLE_UNKNOWN'

  const roleName = role
    .replace('ROLE_', '')
    .replace(/_/g, ' ')

  // Role-based navigation
  const menuItems: MenuItem[] =
    role === 'ROLE_ADMIN'
      ? [
          { label: 'Dashboard', path: '/admin' },
          { label: 'Employees', path: '/admin/employees' },
          { label: 'HR Management', path: '/admin/hr' },
          { label: 'Reports', path: '/admin/reports' },
          { label: 'AI Insights', path: '/admin/ai-insights' },
          { label: 'Documents', path: '/admin/documents' },
          { label: 'Settings', path: '/admin/settings' },
          { label: 'Notifications', path: '/notifications' },
        ]
      : role === 'ROLE_HR_MANAGER'
        ? [
            { label: 'Dashboard', path: '/hr' },
            { label: 'Employees', path: '/hr/employees' },
            { label: 'Attendance', path: '/hr/attendance' },
            { label: 'Leave Management', path: '/hr/leaves' },
            { label: 'Payroll', path: '/hr/payroll' },
            {
              label: 'Performance Management',
              path: '/hr/performance',
            },
            {
              label: 'Performance Reviews',
              path: '/hr/performance-reviews',
            },
            { label: 'AI Insights', path: '/admin/ai-insights' },
            { label: 'Documents', path: '/hr/documents' },
            { label: 'Notifications', path: '/notifications' },
          ]
        : [
            { label: 'Dashboard', path: '/employee' },
            { label: 'My Profile', path: '/employee/profile' },
            { label: 'Attendance', path: '/employee/attendance' },
            { label: 'My Leaves', path: '/employee/leaves' },
            { label: 'My Payslips', path: '/employee/payslips' },
            { label: 'Documents', path: '/employee/documents' },
            { label: 'Notifications', path: '/notifications' },
          ]

  function isActive(path: string) {
    if (location.pathname === path) {
      return true
    }

    const dashboardPaths = ['/admin', '/hr', '/employee']

    if (dashboardPaths.includes(path)) {
      return false
    }

    return location.pathname.startsWith(`${path}/`)
  }

  function handleLogout() {
    sessionStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside
        id="nexus-sidebar"
        className={`dashboard-sidebar ${
          sidebarOpen ? 'sidebar-open' : ''
        }`}
      >

        <div className="sidebar-brand">
          <h2 className="dashboard-logo">NexusHR</h2>
          <p className="sidebar-tagline">
            PEOPLE. POTENTIAL. PROGRESS.
          </p>
        </div>

        <div className="sidebar-role">
          {roleName}
        </div>

        <nav className="sidebar-navigation">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${
                isActive(item.path) ? 'active' : ''
              }`}
              aria-current={
                isActive(item.path) ? 'page' : undefined
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.label === 'AI Insights' && (
                <span className="ai-menu-icon">✦</span>
              )}
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <span>↪</span> Logout
        </button>

      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label={
              sidebarOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={sidebarOpen}
            aria-controls="nexus-sidebar"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>

          <div className="header-title">
            <h1>{title}</h1>
            <p>PEOPLE. POTENTIAL. PROGRESS.</p>
          </div>

          <div className="dashboard-user">
            <div className="user-details">
              <span className="user-email">{email}</span>
              <span className="user-role">{roleName}</span>
            </div>

            <div className="user-avatar">
              {email.charAt(0).toUpperCase()}
            </div>
          </div>

        </header>

        {/* Page Content */}
        <section className="dashboard-content">
          {children}
        </section>

      </main>

    </div>
  )
}

