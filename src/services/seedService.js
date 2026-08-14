/* =====================================================
   UniGrade V2 — seedService.js
   Firestore Database Seeder & Initial Setup Utility
   ===================================================== */

import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { BUILT_IN_SCHEMES } from '../data/evaluationSchemes'
import { BUILT_IN_SYSTEMS, BUILT_IN_RELATIVE_SYSTEMS } from '../data/gradingSystems'
import { getAcademicStructure } from './academicService'

/**
 * Ensures standard evaluation schemes, grading systems, and academic structures
 * exist in Firestore for an institution upon initialization.
 */
export async function seedInstitutionData(institutionId) {
  if (!institutionId) return

  try {
    // 1. Initialize Academic Structure
    await getAcademicStructure(institutionId)

    // 2. Seed Built-In Evaluation Schemes
    for (const scheme of BUILT_IN_SCHEMES) {
      const schemeRef = doc(db, 'evaluationSchemes', scheme.id)
      const snap = await getDoc(schemeRef)
      if (!snap.exists()) {
        await setDoc(schemeRef, {
          ...scheme,
          institutionId: 'system',
          isDefault: true,
          createdAt: new Date().toISOString()
        })
      }
    }

    // 3. Seed Built-In Absolute & Relative Grading Systems
    for (const system of [...BUILT_IN_SYSTEMS, ...BUILT_IN_RELATIVE_SYSTEMS]) {
      const sysRef = doc(db, 'gradingSystems', system.id)
      const snap = await getDoc(sysRef)
      if (!snap.exists()) {
        await setDoc(sysRef, {
          ...system,
          institutionId: 'system',
          isCustom: false,
          createdAt: new Date().toISOString()
        })
      }
    }

    console.log('✅ Institutional database initialized in Firestore.')
  } catch (err) {
    console.warn('Seeder non-fatal error:', err)
  }
}
