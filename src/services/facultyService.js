/* =====================================================
   UniGrade V2 — facultyService.js
   Firestore Faculty Management Service
   ===================================================== */

import { db, storage } from '../firebase.js'
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

/**
 * Fetch a faculty profile by UID from Firestore.
 */
export async function getFacultyProfile(uid) {
  if (!uid) return null
  const snap = await getDoc(doc(db, 'faculty', uid))
  if (!snap.exists()) return null

  const data = snap.data()
  return {
    id: snap.id,
    uid: snap.id,
    ...data,
    avatarURL: data.avatarURL || data.avatar || data.photoURL || null
  }
}

/**
 * Update faculty profile in Firestore.
 */
export async function updateFacultyProfile(uid, data) {
  if (!uid) throw new Error('Faculty UID is required')
  const refDoc = doc(db, 'faculty', uid)
  const now = new Date().toISOString()

  const payload = {
    ...data,
    updatedAt: now
  }
  // Ensure canonical avatarURL
  if (data.avatarURL !== undefined) {
    payload.avatarURL = data.avatarURL
  }

  await updateDoc(refDoc, payload)
  return payload
}

/**
 * Upload a faculty profile picture to Firebase Storage and update avatarURL in Firestore.
 */
export async function uploadFacultyAvatar(uid, fileOrBase64) {
  if (!uid || !fileOrBase64) return null

  // If it is a File object, upload to Firebase Storage
  if (typeof fileOrBase64 === 'object' && fileOrBase64 instanceof File) {
    try {
      const sanitizedName = fileOrBase64.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `avatars/faculty/${uid}_${Date.now()}_${sanitizedName}`
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, fileOrBase64)
      const downloadURL = await getDownloadURL(storageRef)
      await updateFacultyProfile(uid, { avatarURL: downloadURL })
      return downloadURL
    } catch (storageErr) {
      console.warn('Firebase Storage upload fallback to DataURL:', storageErr)
    }
  }

  // If string (Base64 DataURL or existing URL)
  const url = typeof fileOrBase64 === 'string' ? fileOrBase64 : null
  if (url) {
    await updateFacultyProfile(uid, { avatarURL: url })
  }
  return url
}

/**
 * Fetch all faculty records belonging to an institution.
 */
export async function getFacultyByInstitution(institutionId) {
  if (!institutionId) return []
  try {
    const q = query(collection(db, 'faculty'), where('institutionId', '==', institutionId))
    const snap = await getDocs(q)
    return snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        uid: d.id,
        ...data,
        avatarURL: data.avatarURL || data.avatar || data.photoURL || null
      }
    })
  } catch (err) {
    console.error('Error fetching faculty by institution:', err)
    return []
  }
}

/**
 * Approve or reject a faculty account.
 */
export async function setFacultyApproval(uid, approved = true) {
  if (!uid) throw new Error('Faculty UID is required')
  const refDoc = doc(db, 'faculty', uid)
  await updateDoc(refDoc, {
    approved,
    status: approved ? 'active' : 'unapproved',
    updatedAt: new Date().toISOString()
  })
}

/**
 * Delete a faculty record.
 */
export async function deleteFaculty(uid) {
  if (!uid) throw new Error('Faculty UID is required')
  await deleteDoc(doc(db, 'faculty', uid))
}
