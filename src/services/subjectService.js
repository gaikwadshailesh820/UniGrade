/* =====================================================
   UniGrade V2 — subjectService.js
   Firestore Subject Management Service
   ===================================================== */

import { db } from '../firebase'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore'

export async function getSubjectsByInstitution(institutionId) {
  if (!institutionId) return []
  try {
    const q = query(collection(db, 'subjects'), where('institutionId', '==', institutionId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error fetching subjects:', err)
    return []
  }
}

export async function saveSubject(subjectData) {
  const subjectId = subjectData.subjectId || subjectData.id || `SUB-${Date.now()}`
  const now = new Date().toISOString()
  const payload = {
    ...subjectData,
    subjectId,
    credits: Number(subjectData.credits) || 4,
    updatedAt: now
  }
  if (!subjectData.createdAt) payload.createdAt = now

  await setDoc(doc(db, 'subjects', subjectId), payload)
  return payload
}

export async function updateSubject(subjectId, data) {
  if (!subjectId) throw new Error('Subject ID is required')
  await updateDoc(doc(db, 'subjects', subjectId), {
    ...data,
    credits: data.credits !== undefined ? Number(data.credits) : undefined,
    updatedAt: new Date().toISOString()
  })
}

export async function deleteSubject(subjectId) {
  if (!subjectId) throw new Error('Subject ID is required')
  await deleteDoc(doc(db, 'subjects', subjectId))
}
