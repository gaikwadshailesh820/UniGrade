import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user, userRole, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const navClass = ({ isActive }) =>
    isActive ? 'active-nav' : ''

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to="/" className="logo">
          🎓 UniGrade
        </NavLink>

        <div className="nav-links">
          <NavLink to="/" className={navClass}>
            Home
          </NavLink>

          {/* Unauthenticated Links */}
          {!user && (
            <>
              <NavLink to="/sgpa" className={navClass}>
                SGPA Calculator
              </NavLink>
              <NavLink to="/evaluation-schemes" className={navClass}>
                Evaluation Schemes
              </NavLink>

              <div className="dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="signin-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  Sign In ▼
                </button>

                {dropdownOpen && (
                  <div className="dropdown-content">
                    <NavLink
                      to="/faculty-login"
                      onClick={() => setDropdownOpen(false)}
                    >
                      👨‍🏫 Faculty Login
                    </NavLink>

                    <NavLink
                      to="/institution-login"
                      onClick={() => setDropdownOpen(false)}
                    >
                      🏛️ Institution Login
                    </NavLink>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Faculty Authenticated Links */}
          {user && userRole === 'faculty' && (
            <>
              <NavLink to="/faculty-dashboard" className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/student-records" className={navClass}>
                Records
              </NavLink>
              <NavLink to="/relative-grading" className={navClass}>
                Relative Grading
              </NavLink>
              <NavLink to="/faculty-profile" className={navClass}>
                Profile
              </NavLink>
              <button
                type="button"
                className="signin-btn"
                onClick={handleLogout}
                style={{ color: '#dc2626' }}
              >
                Logout
              </button>
            </>
          )}

          {/* Institution Authenticated Links */}
          {user && userRole === 'institution' && (
            <>
              <NavLink to="/institution-dashboard" className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/institution-records" className={navClass}>
                Records
              </NavLink>
              <NavLink to="/institution-sgpa" className={navClass}>
                Generate SGPA
              </NavLink>
              <NavLink to="/view-sgpa" className={navClass}>
                Archived Results
              </NavLink>
              <NavLink to="/institution-profile" className={navClass}>
                Profile
              </NavLink>
              <button
                type="button"
                className="signin-btn"
                onClick={handleLogout}
                style={{ color: '#dc2626' }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar