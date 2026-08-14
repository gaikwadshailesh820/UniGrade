import { useState, useCallback, useEffect } from 'react'
import {
  getAllSystems,
  getCustomSystems,
  getActiveAbsoluteSystem,
  setActiveAbsoluteSystem,
  getActiveRelativeSystem,
  setActiveRelativeSystem,
  saveCustomSystem,
  deleteCustomSystem,
  duplicateSystem,
  resolveGrade,
  validateSystem,
  createEmptySystem
} from '../data/gradingSystems'
import {
  getGradingSystems as fetchFirestoreGradingSystems,
  saveGradingSystem as saveFirestoreGradingSystem,
  deleteGradingSystem as deleteFirestoreGradingSystem
} from '../services/gradingService'
import { useAuth } from '../contexts/AuthContext'

export function useGradingSystems() {
  const { user } = useAuth()
  const [activeAbsolute, setActiveAbsolute] = useState(getActiveAbsoluteSystem)
  const [activeRelative, setActiveRelative] = useState(getActiveRelativeSystem)
  const [customSystems, setCustomSystems] = useState(getCustomSystems)
  const [allSystems, setAllSystems] = useState(getAllSystems)

  const refresh = useCallback(() => {
    setActiveAbsolute(getActiveAbsoluteSystem())
    setActiveRelative(getActiveRelativeSystem())
    setCustomSystems(getCustomSystems())
    setAllSystems(getAllSystems())
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadRemoteGrading() {
      try {
        const remote = await fetchFirestoreGradingSystems(user?.uid)
        if (isMounted && Array.isArray(remote) && remote.length > 0) {
          setAllSystems(remote)
        }
      } catch {
        // fallback
      }
    }
    loadRemoteGrading()
    return () => { isMounted = false }
  }, [user?.uid])

  const selectActiveAbsolute = useCallback((id) => {
    setActiveAbsoluteSystem(id)
    refresh()
  }, [refresh])

  const selectActiveRelative = useCallback((id) => {
    setActiveRelativeSystem(id)
    refresh()
  }, [refresh])

  const saveSystem = useCallback(async (system) => {
    const saved = saveCustomSystem(system)
    try {
      await saveFirestoreGradingSystem({ ...system, institutionId: user?.uid || 'custom' })
    } catch (err) {
      console.warn('Firestore save grading system non-fatal:', err)
    }
    refresh()
    return saved
  }, [user, refresh])

  const deleteSystem = useCallback(async (id) => {
    deleteCustomSystem(id)
    try {
      await deleteFirestoreGradingSystem(id)
    } catch (err) {
      console.warn('Firestore delete grading system non-fatal:', err)
    }
    refresh()
  }, [refresh])

  const duplicate = useCallback(async (id, newName) => {
    const copy = duplicateSystem(id, newName)
    if (copy) {
      try {
        await saveFirestoreGradingSystem({ ...copy, institutionId: user?.uid || 'custom' })
      } catch (err) {
        console.warn('Firestore duplicate grading system non-fatal:', err)
      }
    }
    refresh()
    return copy
  }, [user, refresh])

  return {
    activeAbsolute,
    activeRelative,
    customSystems,
    allSystems,
    absoluteSystems: allSystems.filter(s => s.mode === 'absolute'),
    relativeSystems: allSystems.filter(s => s.mode === 'relative'),
    selectActiveAbsolute,
    selectActiveRelative,
    saveSystem,
    deleteSystem,
    duplicate,
    resolveGrade,
    validateSystem,
    createEmptySystem,
    refresh
  }
}
