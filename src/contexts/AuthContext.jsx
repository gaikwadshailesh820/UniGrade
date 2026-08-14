/* =====================================================
   UniGrade V2 — AuthContext
   
   Provides authentication state, login, register,
   logout, and password reset across the app.
   
   Supports two roles: 'faculty' and 'institution'.
   Faculty accounts require institution approval
   (approved === true) before access is granted.
   ===================================================== */

import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import {
  loginUser,
  registerUser,
  logoutUser,
  resetUserPassword,
  changeUserPassword
} from '../services/authService'
import { seedInstitutionData } from '../services/seedService'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  /* ── Listen for auth state changes ────────────── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        try {
          // Check faculty collection first
          const facultyDoc = await getDoc(doc(db, 'faculty', firebaseUser.uid))
          if (facultyDoc.exists()) {
            setUserProfile(facultyDoc.data())
            setUserRole('faculty')
          } else {
            // Check institutions collection
            const instDoc = await getDoc(doc(db, 'institutions', firebaseUser.uid))
            if (instDoc.exists()) {
              setUserProfile(instDoc.data())
              setUserRole('institution')
              // Trigger institutional seeding if needed
              seedInstitutionData(firebaseUser.uid)
            } else {
              // Fallback to base user doc
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
              if (userDoc.exists()) {
                const uData = userDoc.data()
                setUserProfile(uData)
                setUserRole(uData.role || null)
              } else {
                setUserProfile(null)
                setUserRole(null)
              }
            }
          }
        } catch (err) {
          console.error('Error hydrating profile onAuthStateChanged:', err)
        }
      } else {
        setUser(null)
        setUserProfile(null)
        setUserRole(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  /* ── Login ────────────────────────────────────── */
  async function login(email, password, role) {
    const res = await loginUser(email, password, role)
    setUser(res.user)
    setUserProfile(res.profile)
    setUserRole(res.role)
    if (res.role === 'institution') {
      seedInstitutionData(res.user.uid)
    }
    return res.profile
  }

  /* ── Register ─────────────────────────────────── */
  async function register(data, role) {
    return await registerUser(data, role)
  }

  /* ── Logout ───────────────────────────────────── */
  async function logout() {
    await logoutUser()
    setUser(null)
    setUserProfile(null)
    setUserRole(null)
  }

  /* ── Password Reset ───────────────────────────── */
  async function resetPassword(email) {
    return await resetUserPassword(email)
  }

  /* ── Update Password ──────────────────────────── */
  async function updatePassword(newPass) {
    return await changeUserPassword(newPass)
  }

  const value = {
    user,
    userProfile,
    userRole,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
