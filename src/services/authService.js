/* =====================================================
   UniGrade V2 — authService.js
   Firebase Authentication & Role Management Service
   ===================================================== */

import { auth, db } from '../firebase.js'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as fbUpdatePassword
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

/**
 * Login user and load authorized profile.
 */
export async function loginUser(email, password, role) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid

  const collectionName = role === 'institution' ? 'institutions' : 'faculty'
  const profileDoc = await getDoc(doc(db, collectionName, uid))

  if (!profileDoc.exists()) {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (!userDoc.exists() || userDoc.data().role !== role) {
      await signOut(auth)
      throw new Error(
        role === 'institution'
          ? 'Access denied. You are not registered as an institution administrator.'
          : 'Faculty profile not found in system.'
      )
    }
  }

  const profileData = profileDoc.exists() ? profileDoc.data() : {}

  if (role === 'faculty' && profileData.approved === false) {
    await signOut(auth)
    throw new Error('Your faculty account is pending institution approval.')
  }

  return {
    user: credential.user,
    profile: profileData,
    role
  }
}

/**
 * Register a new Faculty or Institution account.
 * Note: Only saves fields provided during registration into 'institutions' or 'faculty'.
 */
export async function registerUser(data, role) {
  const { email, password, name, phone, ...extraData } = data
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid
  const now = new Date().toISOString()
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  // 1. Base User Record in users/{uid}
  const baseUserData = {
    uid,
    email,
    name: name || '',
    phone: phone || '',
    role,
    createdAt: now,
    createdOn: formattedDate,
    updatedAt: now
  }
  await setDoc(doc(db, 'users', uid), baseUserData)

  // 2. Role-specific record
  if (role === 'institution') {
    const instData = {
      uid,
      institutionId: uid,
      name: name || '',
      email,
      phone: phone || '',
      institutionCode: extraData.institutionCode || '',
      university: extraData.university || '',
      website: extraData.website || '',
      departments: extraData.departments || '',
      programs: extraData.programs || '',
      academicYear: extraData.academicYear || '',
      address: extraData.address || '',
      city: extraData.city || '',
      state: extraData.state || '',
      country: extraData.country || '',
      postalCode: extraData.postalCode || '',
      logoURL: null,
      role: 'institution',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
    // Single source of truth: institutions/{uid}
    await setDoc(doc(db, 'institutions', uid), instData)
  } else {
    // Faculty
    const facultyData = {
      uid,
      name: name || '',
      email,
      phone: phone || '',
      dateOfBirth: '',
      gender: '',
      facultyId: extraData.facultyId || '',
      department: extraData.department || '',
      designation: extraData.designation || '',
      qualification: '',
      specialization: '',
      joiningDate: '',
      assignedSubjects: '',
      assignedBatches: '',
      academicYear: '',
      avatarURL: null,
      institutionId: extraData.institutionId || '',
      role: 'faculty',
      approved: false,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    }
    await setDoc(doc(db, 'faculty', uid), facultyData)
  }

  await signOut(auth)
  return { uid, email, role }
}

/**
 * Logout current user.
 */
export async function logoutUser() {
  await signOut(auth)
}

/**
 * Send password reset email.
 */
export async function resetUserPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

/**
 * Change authenticated user's password.
 */
export async function changeUserPassword(newPassword) {
  if (!auth.currentUser) throw new Error('No user is currently authenticated.')
  await fbUpdatePassword(auth.currentUser, newPassword)
}
