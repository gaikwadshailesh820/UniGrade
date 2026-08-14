import { useState, useCallback } from 'react'
import {
  getAllSystems,
  getAbsoluteSystems,
  getRelativeSystems,
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

export function useGradingSystems() {
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

  const selectActiveAbsolute = useCallback((id) => {
    setActiveAbsoluteSystem(id)
    refresh()
  }, [refresh])

  const selectActiveRelative = useCallback((id) => {
    setActiveRelativeSystem(id)
    refresh()
  }, [refresh])

  const saveSystem = useCallback((system) => {
    const saved = saveCustomSystem(system)
    refresh()
    return saved
  }, [refresh])

  const deleteSystem = useCallback((id) => {
    deleteCustomSystem(id)
    refresh()
  }, [refresh])

  const duplicate = useCallback((id, newName) => {
    const copy = duplicateSystem(id, newName)
    refresh()
    return copy
  }, [refresh])

  return {
    activeAbsolute,
    activeRelative,
    customSystems,
    allSystems,
    absoluteSystems: getAbsoluteSystems(),
    relativeSystems: getRelativeSystems(),
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
