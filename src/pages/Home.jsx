import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Home() {
  const { user, userRole } = useAuth()

  const getStartedPath = !user
    ? '/sgpa'
    : userRole === 'institution'
      ? '/institution-dashboard'
      : '/faculty-dashboard'

  return (
    <>
      <main className="home-container">
        <section className="hero-section">
          <h1>🎓 UniGrade</h1>
          <p>
            Simplifying Academic Evaluation, Grading &amp; Performance Management
          </p>

          <div className="hero-badge">
            ERP • SGPA Calculator • Relative Grading • Analytics
          </div>

          <div className="hero-actions">
            <Link to={getStartedPath}>
              <button type="button" className="hero-btn hero-btn-primary">
                {user ? 'Go to Dashboard →' : 'Calculate SGPA →'}
              </button>
            </Link>

            {!user && (
              <Link to="/faculty-login">
                <button type="button" className="hero-btn hero-btn-secondary">
                  Faculty Portal →
                </button>
              </Link>
            )}
          </div>
        </section>

        <section className="stats-section">
          <div className="stat">
            <h2>100%</h2>
            <p>Centralized Evaluation</p>
          </div>

          <div className="stat">
            <h2>Excel</h2>
            <p>Based Data Import</p>
          </div>

          <div className="stat">
            <h2>ERP</h2>
            <p>Faculty &amp; Institution Workflows</p>
          </div>

          <div className="stat">
            <h2>Fair</h2>
            <p>Relative Grading Engine</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <h3>🎓 UniGrade</h3>
          <p>Modern Academic Evaluation Platform for Students &amp; Faculty</p>
          <p>Developed during Web Development Internship at Teople Technologies</p>
          <p className="copyright">© 2026 UniGrade. All Rights Reserved.</p>
        </div>
      </footer>
    </>
  )
}

export default Home