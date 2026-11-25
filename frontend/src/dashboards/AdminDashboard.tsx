import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import './AdminDashboard.css'
const cardLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  cursor: 'pointer',
}

const comingSoonStyle: React.CSSProperties = {
  opacity: 0.65,
  cursor: 'not-allowed',
}

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="welcome-section">
        <h2>Welcome to NexusHR Administration 👋</h2>
        <p>
          Manage your organization, workforce and HR operations
          from one central workspace.
        </p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <h2>—</h2>
          <p>Workforce overview</p>
        </div>

        <div className="stat-card">
          <h3>HR Managers</h3>
          <h2>—</h2>
          <p>HR team overview</p>
        </div>

        <div className="stat-card">
          <h3>Pending Approvals</h3>
          <h2>—</h2>
          <p>Awaiting action</p>
        </div>

        <div className="stat-card">
          <h3>Organization</h3>
          <h2>Active</h2>
          <p>Workspace status</p>
        </div>
      </div>

      <h2 className="admin-section-title">
        Administration Operations
      </h2>

      <div className="admin-sections">
        <Link
          to="/admin/employees"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Employee Management</h3>
          <p>Manage employee records and workforce information.</p>
          <span>Open Employee Management →</span>
        </Link>

        <Link
          to="/admin/reports"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Workforce Analytics</h3>
          <p>Monitor organizational workforce performance and reports.</p>
          <span>Open Reports →</span>
        </Link>

        <div
          className="admin-card"
          style={comingSoonStyle}
        >
          <h3>Role Management</h3>
          <p>Manage Admin, HR Manager and Employee access.</p>
          <span>Coming Soon</span>
        </div>

        <div
          className="admin-card"
          style={comingSoonStyle}
        >
          <h3>System Settings</h3>
          <p>Configure organization-wide application settings.</p>
          <span>Coming Soon</span>
        </div>
      </div>

      <h2 className="admin-section-title">
        HR Management Operations
      </h2>

      <div className="admin-sections">
        <Link
          to="/hr/attendance"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Attendance Management</h3>
          <p>Monitor employee attendance records.</p>
          <span>Open Attendance →</span>
        </Link>

        <Link
          to="/hr/leaves"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Leave Management</h3>
          <p>Review and manage employee leave requests.</p>
          <span>Open Leave Management →</span>
        </Link>

        <Link
          to="/hr/payroll"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Payroll Management</h3>
          <p>Manage payroll and employee salary information.</p>
          <span>Open Payroll →</span>
        </Link>

        <Link
          to="/hr/performance"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Performance Management</h3>
          <p>Manage employee goals and performance progress.</p>
          <span>Open Performance →</span>
        </Link>

        <Link
          to="/hr/performance-reviews"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Performance Reviews</h3>
          <p>Review employee performance and feedback.</p>
          <span>Open Reviews →</span>
        </Link>

        <Link
          to="/admin/documents"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Document Management</h3>
          <p>Access and manage organizational documents.</p>
          <span>Open Documents →</span>
        </Link>

        <Link
          to="/admin/reports"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Reports</h3>
          <p>View available organizational reports.</p>
          <span>Open Reports →</span>
        </Link>

        <Link
          to="/notifications"
          className="admin-card"
          style={cardLinkStyle}
        >
          <h3>Notifications</h3>
          <p>View system and workforce notifications.</p>
          <span>Open Notifications →</span>
        </Link>
      </div>
    </DashboardLayout>
  )
}

