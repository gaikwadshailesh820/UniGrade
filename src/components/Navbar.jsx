import { useState } from 'react'
import { NavLink } from 'react-router-dom'

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const navClass = ({ isActive }) =>
    isActive ? 'active-nav' : ''

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

          <NavLink to="/sgpa" className={navClass}>
            SGPA Calculator
          </NavLink>

          <div className="dropdown">

            <button
              className="signin-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Sign In ▼
            </button>

            {dropdownOpen && (
              <div className="dropdown-content">

                <NavLink to="/faculty-login">
                  👨‍🏫 Faculty Login
                </NavLink>

                <NavLink to="/institution-login">
                  🏛️ Institution Login
                </NavLink>

              </div>
            )}

          </div>

        </div>

      </div>
    </nav>
  )
}

export default Navbar