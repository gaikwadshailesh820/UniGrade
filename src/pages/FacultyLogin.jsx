import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function FacultyLogin() {
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
      setAlert({ type: 'error', message: '⚠️ Please fill all fields.' })
      return
    }

    try {
      setLoading(true)
      await login(email, password, 'faculty')
      setAlert({ type: 'success', message: '✅ Login Successful! Redirecting...' })
      setTimeout(() => {
        navigate('/faculty-dashboard')
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
        {/* Header */}
        <div className="login-header">
          <div className="login-icon">👨‍🏫</div>
          <h1>Faculty Login</h1>
          <p>Access your grading dashboard and student records.</p>
          <div className="hero-badge">
            Academic ERP • Student Records • Excel Upload
          </div>
        </div>

        {/* Dynamic Alert */}
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <label htmlFor="facultyEmail">Email Address</label>
          <input
            id="facultyEmail"
            type="email"
            placeholder="faculty@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="facultyPassword">Password</label>
          <input
            id="facultyPassword"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <div className="forgot-password">
            <Link to="/faculty-forgot">Forgot Password?</Link>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Dashboard →'}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span>or</span>
        </div>

        {/* Register */}
        <Link to="/faculty-register" className="btn-secondary">
          Create New Account →
        </Link>

        {/* Bottom link */}
        <p className="login-footer-text">
          Not a faculty? <Link to="/institution-login">Institution Login</Link>
        </p>
      </div>
    </main>
  )
}

export default FacultyLogin