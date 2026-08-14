/* =====================================================
   UniGrade V2 — auditService.js
   Firestore Immutable Audit Log Service
   ===================================================== */

import { db } from '../firebase'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore'

/**
 * Record an audit event into auditLogs collection.
 */
export async function logAuditEvent(action, details = {}, user = null) {
  try {
    const payload = {
      action,
      details,
      userId: user?.uid || 'system',
      userEmail: user?.email || 'system',
      role: user?.role || 'system',
      institutionId: user?.institutionId || details.institutionId || '',
      timestamp: new Date().toISOString(),
      createdOn: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    }
    await addDoc(collection(db, 'auditLogs'), payload)
    return payload
  } catch (err) {
    console.warn('Audit log write skipped:', err.message)
    return null
  }
}

/**
 * Fetch recent audit logs for an institution.
 */
export async function getRecentAuditLogs(institutionId, maxLogs = 50) {
  try {
    let q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limit(maxLogs)
    )
    if (institutionId) {
      q = query(
        collection(db, 'auditLogs'),
        where('institutionId', '==', institutionId),
        orderBy('timestamp', 'desc'),
        limit(maxLogs)
      )
    }
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error fetching audit logs:', err)
    return []
  }
}
