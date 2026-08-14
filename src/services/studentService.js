/* =====================================================
   UniGrade V2 — studentService.js
   Firestore Student Management Service
   ===================================================== */

import { db } from '../firebase.js'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore'

/**
 * Fetch all students for an institution.
 */
export async function getStudentsByInstitution(institutionId) {
  if (!institutionId) return []
  try {
    const q = query(collection(db, 'students'), where('institutionId', '==', institutionId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error fetching students by institution:', err)
    return []
  }
}

/**
 * Fetch students for a specific batch and department.
 */
export async function getStudentsByBatch(institutionId, batch, department) {
  if (!institutionId) return []
  try {
    let q = query(collection(db, 'students'), where('institutionId', '==', institutionId))
    if (batch) q = query(q, where('batch', '==', batch))
    if (department) q = query(q, where('department', '==', department))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error fetching students by batch:', err)
    return []
  }
}

/**
 * Create or save a student.
 */
export async function saveStudent(studentData) {
  const studentId = studentData.studentId || studentData.id || `STU-${Date.now()}`
  const now = new Date().toISOString()

  const payload = {
    ...studentData,
    studentId,
    updatedAt: now
  }
  if (!studentData.createdAt) payload.createdAt = now

  await setDoc(doc(db, 'students', studentId), payload)
  return payload
}

/**
 * Update an existing student.
 */
export async function updateStudent(studentId, data) {
  if (!studentId) throw new Error('Student ID is required')
  await updateDoc(doc(db, 'students', studentId), {
    ...data,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Delete a student record.
 */
export async function deleteStudent(studentId) {
  if (!studentId) throw new Error('Student ID is required')
  await deleteDoc(doc(db, 'students', studentId))
}

/**
 * Bulk insert/update students via Firestore batch.
 */
export async function bulkSaveStudents(students, institutionId) {
  if (!Array.isArray(students) || students.length === 0) return []

  const batch = writeBatch(db)
  const saved = []
  const now = new Date().toISOString()

  for (const s of students) {
    const studentId = s.studentId || s.id || `STU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    const ref = doc(db, 'students', studentId)
    const payload = {
      ...s,
      studentId,
      institutionId: institutionId || s.institutionId || '',
      updatedAt: now,
      createdAt: s.createdAt || now
    }
    batch.set(ref, payload)
    saved.push(payload)
  }

  await batch.commit()
  return saved
}
