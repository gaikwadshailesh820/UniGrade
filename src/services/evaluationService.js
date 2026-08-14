/* =====================================================
   UniGrade V2 — evaluationService.js
   Firestore Evaluation Scheme Management Service
   ===================================================== */

import { db } from '../firebase'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore'
import { BUILT_IN_SCHEMES } from '../data/evaluationSchemes'

export async function getEvaluationSchemes(institutionId) {
  try {
    let schemes = [...BUILT_IN_SCHEMES]
    if (institutionId) {
      const q = query(collection(db, 'evaluationSchemes'), where('institutionId', '==', institutionId))
      const snap = await getDocs(q)
      const remoteSchemes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      schemes = [...schemes, ...remoteSchemes]
    } else {
      const snap = await getDocs(collection(db, 'evaluationSchemes'))
      const remoteSchemes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      schemes = [...schemes, ...remoteSchemes]
    }
    const map = new Map()
    schemes.forEach(s => map.set(s.id, s))
    return Array.from(map.values())
  } catch (err) {
    console.warn('Error loading evaluation schemes from Firestore, using built-ins:', err)
    return BUILT_IN_SCHEMES
  }
}

export async function saveEvaluationScheme(scheme) {
  const schemeId = scheme.id || `eval-${Date.now()}`
  const now = new Date().toISOString()
  const payload = {
    ...scheme,
    id: schemeId,
    updatedAt: now,
    createdAt: scheme.createdAt || now
  }
  await setDoc(doc(db, 'evaluationSchemes', schemeId), payload)
  return payload
}

export async function deleteEvaluationScheme(schemeId) {
  if (!schemeId) throw new Error('Scheme ID is required')
  await deleteDoc(doc(db, 'evaluationSchemes', schemeId))
}
