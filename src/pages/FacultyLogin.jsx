import { Link } from 'react-router-dom'

function FacultyLogin() {
  const handleLogin = (e) => {
    e.preventDefault()

    // Firebase authentication will be added later
    console.log('Faculty login submitted')
  }

  return (
    <main className="login-page">
      <div className="login-card fade-up">

        {/* Header */}
        <div className="login-header">

          <div className="login-icon">
            👨‍🏫
          </div>

          <h1>Faculty Login</h1>

          <p>
            Access your grading dashboard and student records.
          </p>

          <div className="hero-badge">
            Academic ERP • Student Records • Excel Upload
          </div>

        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>

          <label htmlFor="facultyEmail">
            Email Address
          </label>

          <input
            id="facultyEmail"
            type="email"
            placeholder="faculty@university.edu"
            required
          />

          <label htmlFor="facultyPassword">
            Password
          </label>

          <input
            id="facultyPassword"
            type="password"
            placeholder="Enter your password"
            required
          />

          <div className="forgot-password">
            <Link to="/faculty-forgot">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="login-button">
            Login to Dashboard →
          </button>

        </form>

        {/* Divider */}
        <div className="divider">
          <span>or</span>
        </div>

        {/* Register */}
        <Link
          to="/faculty-register"
          className="btn-secondary"
        >
          Create New Account →
        </Link>

        {/* Bottom link */}
        <p className="login-footer-text">
          Not a faculty?{' '}
          <Link to="/institution-login">
            Institution Login
          </Link>
        </p>

      </div>
    </main>
  )
}

export default FacultyLogin