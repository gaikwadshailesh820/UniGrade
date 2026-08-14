import { Link } from 'react-router-dom'

function InstitutionLogin() {
  const handleLogin = (e) => {
    e.preventDefault()

    // Firebase authentication will be added later
    console.log('Institution login submitted')
  }

  return (
    <main className="login-page">
      <div className="login-card fade-up">

        <div className="login-header">

          <div className="login-icon">
            🏛️
          </div>

          <h1>Institution Login</h1>

          <p>
            Manage batch records, generate grades and export results.
          </p>

        </div>

        <form onSubmit={handleLogin}>

          <label htmlFor="institutionEmail">
            Institution Email
          </label>

          <input
            id="institutionEmail"
            type="email"
            placeholder="admin@university.edu"
            required
          />

          <label htmlFor="institutionPassword">
            Password
          </label>

          <input
            id="institutionPassword"
            type="password"
            placeholder="Enter your password"
            required
          />

          <div className="forgot-password">
            <Link to="/institution-forgot">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="login-button"
          >
            Login to Dashboard →
          </button>

        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <Link
          to="/institution-register"
          className="btn-secondary"
        >
          Register Institution →
        </Link>

        <p className="login-footer-text">
          Are you a Faculty?{' '}
          <Link to="/faculty-login">
            Faculty Login
          </Link>
        </p>

      </div>
    </main>
  )
}

export default InstitutionLogin