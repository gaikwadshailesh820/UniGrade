/* =====================================================
   UniGrade V2 — ProtectedRoute
   
   Wraps routes that require authentication.
   Optionally restricts by role ('faculty' | 'institution').
   Redirects unauthenticated users to the appropriate
   login page.
   ===================================================== */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children, allowedRole }) {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return (
      <main className="page-container" style={{ textAlign: 'center', paddingTop: '120px' }}>
        <div className="loading-spinner">Loading...</div>
      </main>
    )
  }

  // Not logged in
  if (!user) {
    const loginPath = allowedRole === 'institution'
      ? '/institution-login'
      : '/faculty-login'
    return <Navigate to={loginPath} replace />
  }

  // Wrong role
  if (allowedRole && userRole !== allowedRole) {
    const dashboardPath = userRole === 'institution'
      ? '/institution-dashboard'
      : '/faculty-dashboard'
    return <Navigate to={dashboardPath} replace />
  }

  return children
}

export default ProtectedRoute
