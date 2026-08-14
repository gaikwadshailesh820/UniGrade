/* =====================================================
   UniGrade V2 — resultService.js
   Firestore Graded Results & SGPA Results Management Service
   ===================================================== */

import { db } from '../firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore'

/**
 * Fetch graded results by subject and batch.
 */
export async function getGradedResults(subject, batch) {
  try {
    let q = collection(db, 'results')
    if (subject && batch) {
      q = query(q, where('subject', '==', subject), where('batch', '==', batch))
    }
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error fetching results:', err)
    return []
  }
}

/**
 * Fetch all graded results for institution SGPA generation.
 */
export async function getAllResultsByInstitution(institutionId) {
  try {
    let q = collection(db, 'results')
    if (institutionId) {
      q = query(q, where('institutionId', '==', institutionId))
    }
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error querying institution results:', err)
    return []
  }
}

/**
 * Save graded results batch with lifecycle status (DRAFT | REVIEW | PUBLISHED | LOCKED).
 */
export async function saveResultsBatch(results, meta = {}) {
  if (!Array.isArray(results) || results.length === 0) return []

  const batch = writeBatch(db)
  const now = new Date().toISOString()
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
  const saved = []

  for (const r of results) {
    const resultId = r.id || `RES-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const ref = doc(db, 'results', resultId)
    const payload = {
      ...r,
      id: resultId,
      status: meta.status || r.status || 'PUBLISHED',
      gradedAt: now,
      gradedOn: formattedDate,
      institutionId: meta.institutionId || r.institutionId || ''
    }
    batch.set(ref, payload)
    saved.push(payload)
  }

  await batch.commit()
  return saved
}

/**
 * Save calculated SGPA batch into sgpaResults collection.
 */
export async function saveSgpaBatch(sgpaList, institutionId) {
  if (!Array.isArray(sgpaList) || sgpaList.length === 0) return []

  const batch = writeBatch(db)
  const now = new Date().toISOString()
  const saved = []

  for (const s of sgpaList) {
    const sgpaId = `SGPA-${s.rollNo}-${s.semester || 'SEM'}-${s.academicYear || 'YR'}`
    const ref = doc(db, 'sgpaResults', sgpaId)
    const payload = {
      ...s,
      id: sgpaId,
      institutionId: institutionId || s.institutionId || '',
      calculatedAt: now
    }
    batch.set(ref, payload)
    saved.push(payload)
  }

  await batch.commit()
  return saved
}

/**
 * Fetch calculated SGPA results from sgpaResults collection.
 */
export async function getSgpaResults(institutionId) {
  try {
    let q = collection(db, 'sgpaResults')
    if (institutionId) {
      q = query(q, where('institutionId', '==', institutionId))
    }
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error fetching SGPA records:', err)
    return []
  }
}
