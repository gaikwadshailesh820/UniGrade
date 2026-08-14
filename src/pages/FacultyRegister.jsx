import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function FacultyRegister() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setAlert(null)

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setAlert({ type: 'error', message: '⚠️ Please fill all required fields.' })
      return
    }

    if (!email.includes('@') || !email.includes('.')) {
      setAlert({ type: 'error', message: '⚠️ Enter a valid email address.' })
      return
    }

    if (password.length < 6) {
      setAlert({ type: 'error', message: '⚠️ Password must be at least 6 characters.' })
      return
    }

    if (password !== confirmPassword) {
      setAlert({ type: 'error', message: '⚠️ Passwords do not match.' })
      return
    }

    try {
      setLoading(true)
      await register(
        {
          name: name.trim(),
          email: email.trim(),
          department: department.trim(),
          password
        },
        'faculty'
      )
      setAlert({
        type: 'success',
        message: '✅ Account created successfully! Redirecting to login...'
      })
      setTimeout(() => {
        navigate('/faculty-login')
      }, 1500)
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
          <div className="login-icon">👨‍🏫</div>
          <h1>Create Faculty Account</h1>
          <p>Register with a unique email and password to access the faculty portal.</p>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <label htmlFor="regName">Full Name *</label>
          <input
            id="regName"
            type="text"
            placeholder="Dr. John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="regEmail">Email Address *</label>
          <input
            id="regEmail"
            type="email"
            placeholder="faculty@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="regDept">Department</label>
          <input
            id="regDept"
            type="text"
            placeholder="e.g. Computer Science"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="regPassword">
            Password * <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 400 }}>(min 6 characters)</span>
          </label>
          <input
            id="regPassword"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="regConfirm">Confirm Password *</label>
          <input
            id="regConfirm"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button type="submit" className="login-button" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <p className="login-footer-text">
          Already have an account? <Link to="/faculty-login">Login here</Link>
        </p>
      </div>
    </main>
  )
}

export default FacultyRegister
