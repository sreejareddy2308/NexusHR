import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from 'react-router-dom'

import Login from './Login'
import Register from './Register'
import ForgotPassword from './ForgotPassword'
import Dashboard from './Dashboard'
import Performance from './Performance'
import AIInsights from './AIInsights'
import ResetPassword from './ResetPassword'
import ActivateAccount from './ActivateAccount'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import DocumentManagement from './components/DocumentManagement'

import AdminDashboard from './dashboards/AdminDashboard'
import HRDashboard from './dashboards/HRDashboard'
import EmployeeDashboard from './dashboards/EmployeeDashboard'

import EmployeeManagement from './EmployeeManagement'
import EmployeeProfile from './EmployeeProfile'
import EmployeeAttendance from './EmployeeAttendance'
import EmployeeLeaves from './EmployeeLeaves'
import EmployeePayslips from './EmployeePayslips'
import EmployeeDocuments from './EmployeeDocuments'

import HRLeaveApprovals from './HRLeaveApprovals'
import HRPayroll from './HRPayroll'
import HRAttendance from './HRAttendance'

import PerformanceReviews from './PerformanceReviews'
import Notifications from './Notifications'
import AdminReports from './AdminReports'
import Documents from './Documents'
import AdminSettings from './AdminSettings'

// Unauthorized Page
function Unauthorized() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>403 - Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/login">Return to Login</Link>
    </div>
  )
}

// Admin HR Management Operations
function AdminHROperations() {
  return (
    <DashboardLayout title="HR Management Operations">
      <div className="welcome-section">
        <h2>HR Management Operations</h2>
        <p>
          Manage your organization's employees, attendance,
          payroll, leave requests and performance from one place.
        </p>
      </div>

      <div className="admin-sections">

        <Link to="/hr/employees" className="admin-card">
          <h3>Employee Management</h3>
          <p>Manage employee records and workforce information.</p>
          <span>Open Employee Management →</span>
        </Link>

        <Link to="/hr/attendance" className="admin-card">
          <h3>Attendance Management</h3>
          <p>Monitor and manage employee attendance records.</p>
          <span>Open Attendance →</span>
        </Link>

        <Link to="/hr/leaves" className="admin-card">
          <h3>Leave Management</h3>
          <p>Review and manage employee leave requests.</p>
          <span>Open Leave Management →</span>
        </Link>

        <Link to="/hr/payroll" className="admin-card">
          <h3>Payroll Management</h3>
          <p>Manage employee salaries and payroll information.</p>
          <span>Open Payroll →</span>
        </Link>

        <Link to="/hr/performance" className="admin-card">
          <h3>Performance Management</h3>
          <p>Manage employee goals and performance progress.</p>
          <span>Open Performance →</span>
        </Link>

        <Link to="/hr/performance-reviews" className="admin-card">
          <h3>Performance Reviews</h3>
          <p>Review employee performance and feedback.</p>
          <span>Open Reviews →</span>
        </Link>

        <Link to="/hr/documents" className="admin-card">
          <h3>Document Management</h3>
          <p>Manage employee and organizational documents.</p>
          <span>Open Documents →</span>
        </Link>

        <Link to="/notifications" className="admin-card">
          <h3>Notifications</h3>
          <p>View HR and organizational notifications.</p>
          <span>Open Notifications →</span>
        </Link>

        <Link to="/admin/reports" className="admin-card">
          <h3>Workforce Reports</h3>
          <p>View available organizational reports.</p>
          <span>Open Reports →</span>
        </Link>

        <Link to="/admin/ai-insights" className="admin-card">
          <h3>AI Workforce Insights</h3>
          <p>
            Analyze employee attrition, workforce trends
            and skill gaps using AI.
          </p>
          <span>Open AI Insights →</span>
        </Link>

      </div>
    </DashboardLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Main Dashboards */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={['HR_MANAGER']}>
              <HRDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin HR Operations */}

        <Route
          path="/admin/hr"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminHROperations />
            </ProtectedRoute>
          }
        />

        {/* Employee Modules */}

        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/attendance"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <DashboardLayout title="My Attendance">
                <EmployeeAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/leaves"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <DashboardLayout title="My Leaves">
                <EmployeeLeaves />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/payslips"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <DashboardLayout title="My Payslips">
                <EmployeePayslips />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/documents"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <DashboardLayout>
                <EmployeeDocuments />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Employee Management */}

        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/employees"
          element={
            <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />

        {/* HR Attendance */}

        <Route
          path="/hr/attendance"
          element={
            <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
              <HRAttendance />
            </ProtectedRoute>
          }
        />

        {/* HR Leaves */}

        <Route
          path="/hr/leaves"
          element={
            <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
              <DashboardLayout title="Leave Management">
                <HRLeaveApprovals />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* HR Payroll */}

        <Route
          path="/hr/payroll"
          element={
            <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
              <DashboardLayout title="Payroll Management">
                <HRPayroll />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* HR Performance */}

        <Route
          path="/hr/performance"
          element={
            <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
              <DashboardLayout title="Performance Management">
                <Performance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/performance-reviews"
          element={
            <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
              <DashboardLayout title="Performance Reviews">
                <PerformanceReviews />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Documents */}

        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout title="Document Management">
                <Documents />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/documents"
          element={
            <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
              <DashboardLayout title="Document Management">
                <Documents />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Notifications */}

        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'EMPLOYEE']}>
              <DashboardLayout title="Notifications">
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Reports */}

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout title="Reports">
                <AdminReports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Settings */}

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout title="Settings">
                <AdminSettings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* AI Workforce Insights */}

        <Route
          path="/admin/ai-insights"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER']}>
              <DashboardLayout title="AI Workforce Insights">
                <AIInsights />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
           path="/activate-account"
           element={<ActivateAccount />}
         />

        {/* Unauthorized */}

        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

        {/* Unknown Routes */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

