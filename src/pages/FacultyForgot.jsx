import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function FacultyForgot() {
  const [email, setEmail] = useState('')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  const handleReset = async (e) => {
    e.preventDefault()
    setAlert(null)

    if (!email || !email.includes('@')) {
      setAlert({ type: 'error', message: '⚠️ Enter a valid registered email address.' })
      return
    }

    try {
      setLoading(true)
      await resetPassword(email.trim())
      setSent(true)
      setAlert({
        type: 'success',
        message: '✅ Password reset email sent! Check your inbox for instructions to reset your password.'
      })
    } catch (err) {
      setAlert({ type: 'error', message: `⚠️ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card fade-up" style={{ maxWidth: 520 }}>
        <div className="login-header">
          <div className="login-icon">🔑</div>
          <h1>Reset Password</h1>
          <p>Enter your registered faculty email to receive a password reset link.</p>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleReset}>
            <label htmlFor="forgotEmail">Registered Email Address</label>
            <input
              id="forgotEmail"
              type="email"
              placeholder="faculty@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Sending Link...' : 'Send Password Reset Link →'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/faculty-login" className="btn-secondary">
              ← Return to Login
            </Link>
          </div>
        )}

        <p className="login-footer-text">
          Remembered your password? <Link to="/faculty-login">Login here</Link>
        </p>
      </div>
    </main>
  )
}

export default FacultyForgot
