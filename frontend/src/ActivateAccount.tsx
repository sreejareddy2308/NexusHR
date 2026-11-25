import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './ActivateAccount.css'

const ActivateAccount = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setMessage('Invalid or missing activation link.')
      return
    }

    if (password.length < 8 || password.length > 72) {
      setMessage('Password must contain 8 to 72 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const response = await fetch(
        `/api/auth/activate?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newPassword: password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Account activation failed.')
      }

      setMessage('Account activated successfully! Redirecting to login...')

      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="activate-container">
      <form className="activate-card" onSubmit={handleActivate}>
        <h1>NexusHR</h1>
        <p className="activate-subtitle">
          PEOPLE. POTENTIAL. PROGRESS.
        </p>

        <h2>Activate Your Account</h2>

        <p>Create your password to activate your employee account.</p>

        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          minLength={8}
          maxLength={72}
          required
        />

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          minLength={8}
          maxLength={72}
          required
        />

        {message && <p className="activate-message">{message}</p>}

        <button type="submit" disabled={loading || !token}>
          {loading ? 'Activating...' : 'Activate Account'}
        </button>
      </form>
    </div>
  )
}

export default ActivateAccount

