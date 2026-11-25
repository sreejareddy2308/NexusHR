import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import './HRDashboard.css'

const stats = [
  {
    title: 'Total Employees',
    value: '250',
    description: 'Workforce overview',
    icon: '👥',
    color: 'purple',
  },
  {
    title: 'Present Today',
    value: '218',
    description: 'Attendance overview',
    icon: '🟢',
    color: 'green',
  },
  {
    title: 'Pending Leaves',
    value: '12',
    description: 'Awaiting approval',
    icon: '📅',
    color: 'orange',
  },
  {
    title: 'Departments',
    value: '8',
    description: 'Organization structure',
    icon: '🏢',
    color: 'blue',
  },
]

const modules = [
  {
    title: 'Employee Management',
    description: 'Manage employee profiles and workforce information.',
    icon: '👥',
    path: '/hr/employees',
    color: 'purple',
  },
  {
    title: 'Attendance',
    description: 'Monitor employee attendance and working hours.',
    icon: '⏰',
    path: '/hr/attendance',
    color: 'green',
  },
  {
    title: 'Leave Management',
    description: 'Review and manage employee leave requests.',
    icon: '📅',
    path: '/hr/leaves',
    color: 'orange',
  },
  {
    title: 'Payroll',
    description: 'Manage salary records and payroll operations.',
    icon: '💰',
    path: '/hr/payroll',
    color: 'blue',
  },
  {
    title: 'Performance Management',
    description: 'Monitor employee goals and performance progress.',
    icon: '📊',
    path: '/hr/performance',
    color: 'pink',
  },
  {
    title: 'Workforce Analytics',
    description: 'Understand workforce trends and organizational insights.',
    icon: '📈',
    path: '/hr/analytics',
    color: 'cyan',
  },
]

export default function HRDashboard() {
  return (
    <DashboardLayout title="HR Manager Dashboard">
      <div className="hr-dashboard">

        <section className="hr-welcome">
          <div>
            <span className="hr-welcome-label">
              HR MANAGEMENT PORTAL
            </span>
            <h1>Welcome to HR Management 👋</h1>
            <p>
              Manage employees, attendance, leave requests and
              workforce operations from one centralized platform.
            </p>
          </div>
        </section>

        <section className="hr-stats">
          {stats.map((stat) => (
            <div
              className="hr-stat-card"
              key={stat.title}
            >
              <div className="hr-stat-top">
                <span>{stat.title}</span>
                <div className={`hr-stat-icon ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>

              <strong>{stat.value}</strong>
              <p>{stat.description}</p>
            </div>
          ))}
        </section>

        <section className="hr-operations">
          <div className="hr-section-heading">
            <div>
              <span>WORKSPACE</span>
              <h2>HR Operations</h2>
              <p>
                Access and manage all your HR activities.
              </p>
            </div>
          </div>

          <div className="hr-modules">
            {modules.map((module) => (
              <Link
                to={module.path}
                className="hr-module-card"
                key={module.title}
              >
                <div className={`hr-module-icon ${module.color}`}>
                  {module.icon}
                </div>

                <div className="hr-module-content">
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </div>

                <span className="hr-module-arrow">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="hr-intelligence">
          <div className="hr-intelligence-icon">
            ✨
          </div>

          <div>
            <span>SMART WORKFORCE MANAGEMENT</span>
            <h2>Workforce Intelligence</h2>
            <p>
              NexusHR brings employee information and HR operations
              together in one centralized platform. Use workforce
              analytics to understand organizational trends and
              support better HR decisions.
            </p>

            <Link to="/hr/analytics">
              Explore Workforce Analytics →
            </Link>
          </div>
        </section>

        <footer className="hr-dashboard-footer">
          <span>NexusHR</span>
          <span>PEOPLE. POTENTIAL. PROGRESS.</span>
        </footer>

      </div>
    </DashboardLayout>
  )
}


