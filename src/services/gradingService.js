/* =====================================================
   UniGrade V2 — gradingService.js
   Firestore Grading Systems Management Service
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
import {
  BUILT_IN_SYSTEMS,
  BUILT_IN_RELATIVE_SYSTEMS
} from '../data/gradingSystems'

export async function getGradingSystems(institutionId) {
  try {
    let systems = [...BUILT_IN_SYSTEMS, ...BUILT_IN_RELATIVE_SYSTEMS]
    if (institutionId) {
      const q = query(collection(db, 'gradingSystems'), where('institutionId', '==', institutionId))
      const snap = await getDocs(q)
      const remoteSystems = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      systems = [...systems, ...remoteSystems]
    } else {
      const snap = await getDocs(collection(db, 'gradingSystems'))
      const remoteSystems = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      systems = [...systems, ...remoteSystems]
    }
    const map = new Map()
    systems.forEach(s => map.set(s.id, s))
    return Array.from(map.values())
  } catch (err) {
    console.warn('Error loading grading systems from Firestore, using built-ins:', err)
    return [...BUILT_IN_SYSTEMS, ...BUILT_IN_RELATIVE_SYSTEMS]
  }
}

export async function saveGradingSystem(system) {
  const systemId = system.id || `custom-${Date.now()}`
  const now = new Date().toISOString()
  const payload = {
    ...system,
    id: systemId,
    updatedAt: now,
    createdAt: system.createdAt || now
  }
  await setDoc(doc(db, 'gradingSystems', systemId), payload)
  return payload
}

export async function deleteGradingSystem(systemId) {
  if (!systemId) throw new Error('System ID is required')
  await deleteDoc(doc(db, 'gradingSystems', systemId))
}
