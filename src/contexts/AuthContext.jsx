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
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore'

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

        // Try to load profile from faculty first, then institution
        const facultyDoc = await getDoc(doc(db, 'faculty', firebaseUser.uid))
        if (facultyDoc.exists()) {
          setUserProfile(facultyDoc.data())
          setUserRole('faculty')
        } else {
          const instDoc = await getDoc(doc(db, 'institution', firebaseUser.uid))
          if (instDoc.exists()) {
            setUserProfile(instDoc.data())
            setUserRole('institution')
          } else {
            setUserProfile(null)
            setUserRole(null)
          }
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const uid = userCredential.user.uid

    const collection = role === 'institution' ? 'institution' : 'faculty'
    const profileDoc = await getDoc(doc(db, collection, uid))

    if (!profileDoc.exists()) {
      await signOut(auth)
      throw new Error(
        role === 'institution'
          ? 'Access denied. You are not an institution administrator.'
          : 'Faculty profile not found.'
      )
    }

    // Faculty approval check
    if (role === 'faculty' && !profileDoc.data().approved) {
      await signOut(auth)
      throw new Error('Your account is waiting for institution approval.')
    }

    setUserProfile(profileDoc.data())
    setUserRole(role)
    return profileDoc.data()
  }

  /* ── Register ─────────────────────────────────── */
  async function register(data, role) {
    const { email, password, ...profileData } = data

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = userCredential.user.uid

    const collection = role === 'institution' ? 'institution' : 'faculty'

    const profileDoc = {
      ...profileData,
      email,
      role,
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      })
    }

    // Faculty accounts start as unapproved
    if (role === 'faculty') {
      profileDoc.approved = false
    }

    await setDoc(doc(db, collection, uid), profileDoc)

    // Sign out after registration — user must log in
    await signOut(auth)
  }

  /* ── Logout ───────────────────────────────────── */
  async function logout() {
    await signOut(auth)
    setUser(null)
    setUserProfile(null)
    setUserRole(null)
  }

  /* ── Password Reset ───────────────────────────── */
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email)
  }

  const value = {
    user,
    userProfile,
    userRole,
    loading,
    login,
    register,
    logout,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
