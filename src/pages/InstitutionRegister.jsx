import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function InstitutionRegister() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [university, setUniversity] = useState('')
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
          city: city.trim(),
          university: university.trim() || name.trim(),
          phone: ''
        },
        'institution'
      )
      setAlert({
        type: 'success',
        message: '✅ Institution registered! Redirecting to login...'
      })
      setTimeout(() => {
        navigate('/institution-login')
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
          <div className="login-icon">🏛️</div>
          <h1>Register Institution</h1>
          <p>Create an institution account to manage batch grades and analytics.</p>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <label htmlFor="instName">Institution Name *</label>
          <input
            id="instName"
            type="text"
            placeholder="e.g. ABC University"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="instEmail">Admin Email *</label>
          <input
            id="instEmail"
            type="email"
            placeholder="admin@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="instCity">City / Location</label>
          <input
            id="instCity"
            type="text"
            placeholder="e.g. Mumbai"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="instUniv">Affiliated University</label>
          <input
            id="instUniv"
            type="text"
            placeholder="e.g. Savitribai Phule Pune University"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="instPassword">
            Password * <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 400 }}>(min 6 characters)</span>
          </label>
          <input
            id="instPassword"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="instConfirm">Confirm Password *</label>
          <input
            id="instConfirm"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button type="submit" className="login-button" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Registering...' : 'Register Institution →'}
          </button>
        </form>

        <p className="login-footer-text">
          Already registered? <Link to="/institution-login">Login here</Link>
        </p>
      </div>
    </main>
  )
}

export default InstitutionRegister
