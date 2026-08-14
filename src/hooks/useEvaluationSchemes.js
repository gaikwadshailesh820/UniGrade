import { useState, useCallback } from 'react'
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

export function useEvaluationSchemes() {
  const [activeScheme, setActiveSchemeState] = useState(getActiveEvaluationScheme)
  const [customSchemes, setCustomSchemes] = useState(getCustomEvaluationSchemes)
  const [allSchemes, setAllSchemes] = useState(getAllEvaluationSchemes)

  const refresh = useCallback(() => {
    setActiveSchemeState(getActiveEvaluationScheme())
    setCustomSchemes(getCustomEvaluationSchemes())
    setAllSchemes(getAllEvaluationSchemes())
  }, [])

  const selectActiveScheme = useCallback((id) => {
    setActiveEvaluationScheme(id)
    refresh()
  }, [refresh])

  const saveScheme = useCallback((scheme) => {
    const saved = saveCustomEvaluationScheme(scheme)
    refresh()
    return saved
  }, [refresh])

  const deleteScheme = useCallback((id) => {
    deleteCustomEvaluationScheme(id)
    refresh()
  }, [refresh])

  const duplicateScheme = useCallback((id, newName) => {
    const copy = duplicateEvaluationScheme(id, newName)
    refresh()
    return copy
  }, [refresh])

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
