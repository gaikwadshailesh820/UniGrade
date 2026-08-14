import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function InstitutionLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setAlert(null)

    if (!email || !password) {
      setAlert({ type: 'error', message: '⚠️ Please fill in all fields.' })
      return
    }

    try {
      setLoading(true)
      await login(email, password, 'institution')
      setAlert({ type: 'success', message: '✅ Login Successful! Redirecting...' })
      setTimeout(() => {
        navigate('/institution-dashboard')
      }, 800)
    } catch (err) {
      setAlert({ type: 'error', message: `⚠️ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card fade-up">
        <div className="login-header">
          <div className="login-icon">🏛️</div>
          <h1>Institution Login</h1>
          <p>Manage batch records, generate grades and export results.</p>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label htmlFor="institutionEmail">Institution Email</label>
          <input
            id="institutionEmail"
            type="email"
            placeholder="admin@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="institutionPassword">Password</label>
          <input
            id="institutionPassword"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <div className="forgot-password">
            <Link to="/institution-forgot">Forgot Password?</Link>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Dashboard →'}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <Link to="/institution-register" className="btn-secondary">
          Register Institution →
        </Link>

        <p className="login-footer-text">
          Are you a Faculty? <Link to="/faculty-login">Faculty Login</Link>
        </p>
      </div>
    </main>
  )
}

export default InstitutionLogin