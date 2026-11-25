import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

interface LoginResponse {
  token?: string
  refreshToken?: string
  type?: string
  roles?: string[]
  role?: string
  email?: string
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()

        console.error('Login response:', {
          status: response.status,
          body: errorBody,
        })

        setMessage(
          `Login failed (${response.status}): ${errorBody.slice(0, 300)}`
        )
        return
      }

      const data: LoginResponse = await response.json()

      // Validate JWT token
      if (!data.token) {
        setMessage(
          'Login response has no JWT token. Check the backend response.'
        )
        return
      }

      // Normalize role names
      const rawRoles: string[] = Array.isArray(data.roles)
        ? data.roles
        : data.role
          ? [data.role]
          : []

      const roles = rawRoles.map((role) => {
        const normalized = role.trim().toUpperCase().replace(/^ROLE_/, '')
        return `ROLE_${normalized}`
      })

      // Determine dashboard based on role
      let dashboardPath = ''

      if (roles.includes('ROLE_ADMIN')) {
        dashboardPath = '/admin'
      } else if (roles.includes('ROLE_HR_MANAGER')) {
        dashboardPath = '/hr'
      } else if (roles.includes('ROLE_EMPLOYEE')) {
        dashboardPath = '/employee'
      }

      if (!dashboardPath) {
        setMessage('No valid role assigned to this account.')
        return
      }

      // Clear previous session
      sessionStorage.removeItem('nexushr_token')
      sessionStorage.removeItem('nexushr_refreshToken')
      sessionStorage.removeItem('nexushr_tokenType')
      sessionStorage.removeItem('nexushr_roles')
      sessionStorage.removeItem('nexushr_email')

      // Store authentication details
      sessionStorage.setItem('nexushr_token', data.token)

      if (data.refreshToken) {
        sessionStorage.setItem(
          'nexushr_refreshToken',
          data.refreshToken
        )
      }

      sessionStorage.setItem(
        'nexushr_tokenType',
        data.type || 'Bearer'
      )

      sessionStorage.setItem(
        'nexushr_roles',
        JSON.stringify(roles)
      )

      sessionStorage.setItem(
        'nexushr_email',
        data.email || email.trim()
      )

      // Navigate according to assigned role
      navigate(dashboardPath, { replace: true })

    } catch (error) {
      console.error('Login error:', error)
      setMessage(
        'Unable to connect to the backend. Check whether Spring Boot is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      {/* Left Branding Section */}
      <div className="login-decoration">

        <div className="login-brand">
          <div className="brand-icon">N</div>
          <span>NexusHR</span>
        </div>

        <div className="login-intro">
          <span className="eyebrow">
            PEOPLE. POTENTIAL. PROGRESS.
          </span>

          <h1>
            Where people<br />
            and progress<br />
            come together.
          </h1>

          <p>
            A smarter way to manage your workforce, simplify HR
            operations, and empower your people.
          </p>
        </div>

        <div className="login-footer">
          AI-Enabled Enterprise HR &amp; Workforce Intelligence
        </div>

      </div>

      {/* Right Login Section */}
      <div className="login-form-side">

        <form className="login-card" onSubmit={handleSubmit}>

          <div className="mobile-brand">
            <div className="brand-icon">N</div>
            <span>NexusHR</span>
          </div>

          <span className="welcome-label">
            WELCOME BACK
          </span>

          <h2>Sign in to your account</h2>

          <p className="login-subtitle">
            Enter your credentials to access your workspace.
          </p>

          {/* Email */}
          <label htmlFor="login-email">
            Work email
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="you@company.com"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {/* Password */}
          <div className="password-heading">
            <label htmlFor="login-password">
              Password
            </label>
          </div>

          <div className="password-field">

            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button
              type="button"
              className="show-password"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>

          </div>

          {/* Login Links */}
          <div className="login-links">

            <Link to="/forgot-password">
              Forgot password?
            </Link>

            <p>
              New user? <Link to="/register">Create account</Link>
            </p>

          </div>

          {/* Submit */}
          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}

            {!loading && (
              <span aria-hidden="true"> →</span>
            )}
          </button>

          {/* Error Message */}
          {message && (
            <p className="login-message" role="alert">
              {message}
            </p>
          )}

          {/* Security Footer */}
          <div className="login-security">
            <span aria-hidden="true">▣</span>
            Secure access for your organization
          </div>

        </form>

        <p className="copyright">
          © 2026 NexusHR. Enterprise workforce intelligence.
        </p>

      </div>

    </div>
  )
}

