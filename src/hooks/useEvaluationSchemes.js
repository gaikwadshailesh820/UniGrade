import { useState, useCallback, useEffect } from 'react'
import {
  getAllEvaluationSchemes,
  getCustomEvaluationSchemes,
  getActiveEvaluationScheme,
  setActiveEvaluationScheme,
  saveCustomEvaluationScheme,
  deleteCustomEvaluationScheme,
  duplicateEvaluationScheme,
  calculateCategoryScore,
  calculateFinalSubjectMarks,
  validateEvaluationScheme,
  createEmptyEvaluationScheme,
  BUILT_IN_EVALUATION_SCHEMES
} from '../data/evaluationSchemes'
import {
  getEvaluationSchemes as fetchFirestoreEvaluationSchemes,
  saveEvaluationScheme as saveFirestoreEvaluationScheme,
  deleteEvaluationScheme as deleteFirestoreEvaluationScheme
} from '../services/evaluationService'
import { useAuth } from '../contexts/AuthContext'

export function useEvaluationSchemes() {
  const { user } = useAuth()
  const [activeScheme, setActiveSchemeState] = useState(getActiveEvaluationScheme)
  const [customSchemes, setCustomSchemes] = useState(getCustomEvaluationSchemes)
  const [allSchemes, setAllSchemes] = useState(getAllEvaluationSchemes)

  const refresh = useCallback(() => {
    setActiveSchemeState(getActiveEvaluationScheme())
    setCustomSchemes(getCustomEvaluationSchemes())
    setAllSchemes(getAllEvaluationSchemes())
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadRemoteSchemes() {
      try {
        const remote = await fetchFirestoreEvaluationSchemes(user?.uid)
        if (isMounted && Array.isArray(remote) && remote.length > 0) {
          setAllSchemes(remote)
        }
      } catch {
        // fallback
      }
    }
    loadRemoteSchemes()
    return () => { isMounted = false }
  }, [user?.uid])

  const selectActiveScheme = useCallback((id) => {
    setActiveEvaluationScheme(id)
    refresh()
  }, [refresh])

  const saveScheme = useCallback(async (scheme) => {
    const saved = saveCustomEvaluationScheme(scheme)
    try {
      await saveFirestoreEvaluationScheme({ ...scheme, institutionId: user?.uid || 'custom' })
    } catch (err) {
      console.warn('Firestore save evaluation scheme non-fatal:', err)
    }
    refresh()
    return saved
  }, [user, refresh])

  const deleteScheme = useCallback(async (id) => {
    deleteCustomEvaluationScheme(id)
    try {
      await deleteFirestoreEvaluationScheme(id)
    } catch (err) {
      console.warn('Firestore delete evaluation scheme non-fatal:', err)
    }
    refresh()
  }, [refresh])

  const duplicateScheme = useCallback(async (id, newName) => {
    const copy = duplicateEvaluationScheme(id, newName)
    if (copy) {
      try {
        await saveFirestoreEvaluationScheme({ ...copy, institutionId: user?.uid || 'custom' })
      } catch (err) {
        console.warn('Firestore duplicate evaluation scheme non-fatal:', err)
      }
    }
    refresh()
    return copy
  }, [user, refresh])

  return {
    activeScheme,
    customSchemes,
    allSchemes,
    builtInSchemes: BUILT_IN_EVALUATION_SCHEMES,
    selectActiveScheme,
    saveScheme,
    deleteScheme,
    duplicateScheme,
    calculateCategoryScore,
    calculateFinalSubjectMarks,
    validateEvaluationScheme,
    createEmptyEvaluationScheme,
    refresh
  }
}
