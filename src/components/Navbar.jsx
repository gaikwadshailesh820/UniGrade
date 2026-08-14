import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

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

          <div className="dropdown" ref={dropdownRef}>

            <button
              className="signin-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Sign In ▼
            </button>

            {dropdownOpen && (
              <div className="dropdown-content">

                <NavLink
                  to="/FacultyLogin"
                  onClick={() => setDropdownOpen(false)}
                >
                  👨‍🏫 Faculty Login
                </NavLink>

                <NavLink
                  to="/InstitutionLogin"
                  onClick={() => setDropdownOpen(false)}
                >
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