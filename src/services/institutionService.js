/* =====================================================
   UniGrade V2 — institutionService.js
   Firestore Institution Management Service
   ===================================================== */

import { db, storage } from '../firebase.js'
import {
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

/**
 * Fetch an institution profile by UID from institutions/{uid}.
 */
export async function getInstitutionProfile(uid) {
  if (!uid) return null
  const snap = await getDoc(doc(db, 'institutions', uid))
  if (!snap.exists()) return null

  const data = snap.data()
  return {
    id: snap.id,
    uid: snap.id,
    ...data,
    logoURL: data.logoURL || data.logo || data.photoURL || null
  }
}

/**
 * Update an institution profile in institutions/{uid}.
 */
export async function updateInstitutionProfile(uid, data) {
  if (!uid) throw new Error('Institution UID is required')
  const payload = {
    ...data,
    updatedAt: new Date().toISOString()
  }

  // Ensure canonical logoURL
  if (data.logoURL !== undefined) {
    payload.logoURL = data.logoURL
  }

  await updateDoc(doc(db, 'institutions', uid), payload)
  return payload
}

/**
 * Upload institution logo to Firebase Storage and update institutions/{uid}.
 */
export async function uploadInstitutionLogo(uid, fileOrBase64) {
  if (!uid || !fileOrBase64) return null

  if (typeof fileOrBase64 === 'object' && fileOrBase64 instanceof File) {
    try {
      const sanitizedName = fileOrBase64.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `logos/institutions/${uid}_${Date.now()}_${sanitizedName}`
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, fileOrBase64)
      const downloadURL = await getDownloadURL(storageRef)
      await updateInstitutionProfile(uid, { logoURL: downloadURL })
      return downloadURL
    } catch (storageErr) {
      console.warn('Firebase Storage logo upload fallback:', storageErr)
    }
  }

  const url = typeof fileOrBase64 === 'string' ? fileOrBase64 : null
  if (url) {
    await updateInstitutionProfile(uid, { logoURL: url })
  }
  return url
}
