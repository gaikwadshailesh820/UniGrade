/* =====================================================
   UniGrade V2 — academicService.js
   Firestore Academic Structure Service (Years, Semesters, Departments)
   ===================================================== */

import { db } from '../firebase'
import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore'

const DEFAULT_STRUCTURE = {
  academicYears: ['2023-2024', '2024-2025', '2025-2026', '2026-2027'],
  semesters: [
    'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
    'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
  ],
  departments: [
    'Computer Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Information Technology',
    'Electronics & Telecommunication',
    'Mechanical Engineering',
    'Civil Engineering'
  ],
  programs: ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'Ph.D.'],
  sections: ['A', 'B', 'C', 'D']
}

export async function getAcademicStructure(institutionId) {
  if (!institutionId) return DEFAULT_STRUCTURE
  try {
    const snap = await getDoc(doc(db, 'academicStructures', institutionId))
    if (snap.exists()) {
      return { ...DEFAULT_STRUCTURE, ...snap.data() }
    }
    await setDoc(doc(db, 'academicStructures', institutionId), {
      institutionId,
      ...DEFAULT_STRUCTURE,
      createdAt: new Date().toISOString()
    })
    return DEFAULT_STRUCTURE
  } catch (err) {
    console.error('Error fetching academic structure:', err)
    return DEFAULT_STRUCTURE
  }
}

export async function updateAcademicStructure(institutionId, data) {
  if (!institutionId) throw new Error('Institution ID is required')
  await setDoc(doc(db, 'academicStructures', institutionId), {
    ...data,
    institutionId,
    updatedAt: new Date().toISOString()
  }, { merge: true })
}
