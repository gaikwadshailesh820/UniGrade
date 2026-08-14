/* =====================================================
   UniGrade V2 — userService.js
   Firestore User Profile Management Service
   ===================================================== */

import { db } from '../firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export async function getUserProfile(uid) {
  if (!uid) return null
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function updateUserProfile(uid, data) {
  if (!uid) throw new Error('User ID is required')
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString()
  })
}
