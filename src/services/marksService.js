/* =====================================================
   UniGrade V2 — marksService.js
   Firestore Student Marks Management Service
   ===================================================== */

import { db } from '../firebase'
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore'

/**
 * Fetch marks by faculty UID.
 */
export async function getMarksByFaculty(facultyId) {
  if (!facultyId) return []
  try {
    const q = query(collection(db, 'marks'), where('facultyId', '==', facultyId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error fetching marks by faculty:', err)
    return []
  }
}

/**
 * Fetch marks by subject and batch.
 */
export async function getMarksBySubjectAndBatch(subject, batch, facultyId) {
  try {
    let q = collection(db, 'marks')
    if (facultyId) {
      q = query(q, where('facultyId', '==', facultyId), where('subject', '==', subject), where('batch', '==', batch))
    } else {
      q = query(q, where('subject', '==', subject), where('batch', '==', batch))
    }
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error querying marks:', err)
    return []
  }
}

/**
 * Bulk save marks from Excel upload or form entry.
 */
export async function saveMarksBatch(records, facultyUser) {
  if (!Array.isArray(records) || records.length === 0) return []

  const batch = writeBatch(db)
  const now = new Date().toISOString()
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
  const savedRecords = []

  for (const r of records) {
    const markId = r.id || `MARK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const ref = doc(db, 'marks', markId)
    const payload = {
      ...r,
      id: markId,
      marks: Number(r.marks) || 0,
      credits: Number(r.credits) || 4,
      facultyId: facultyUser?.uid || r.facultyId || '',
      facultyEmail: facultyUser?.email || r.facultyEmail || '',
      institutionId: r.institutionId || facultyUser?.institutionId || '',
      uploadedAt: now,
      uploadedOn: formattedDate
    }
    batch.set(ref, payload)
    savedRecords.push(payload)
  }

  await batch.commit()
  return savedRecords
}

/**
 * Delete a single mark record.
 */
export async function deleteMark(markId) {
  if (!markId) throw new Error('Mark ID is required')
  await deleteDoc(doc(db, 'marks', markId))
}

/**
 * Clear all marks for a specific batch and subject.
 */
export async function deleteMarksBatch(subject, batch, facultyId) {
  const records = await getMarksBySubjectAndBatch(subject, batch, facultyId)
  if (records.length === 0) return

  const wb = writeBatch(db)
  records.forEach(r => {
    wb.delete(doc(db, 'marks', r.id))
  })
  await wb.commit()
}
