/* =====================================================
   UniGrade V2 — evaluationSchemes.js
   Customizable Evaluation Scheme Engine & Registry
   -----------------------------------------------------
   Decouples the Evaluation Scheme (how raw marks are
   combined into final subject marks) from the Grading
   System (how final marks map to letter grades & SGPA).
   ===================================================== */

export const ACTIVE_EVALUATION_SCHEME_KEY = 'ug_activeEvaluationSchemeId'
export const CUSTOM_EVALUATION_SCHEMES_KEY = 'ug_customEvaluationSchemes'

/* ── Built-in Evaluation Scheme Templates ───────────── */
export const BUILT_IN_EVALUATION_SCHEMES = [
  {
    id: 'unigrade-default-60-40',
    name: 'UniGrade Standard (Theory 60% / Practical 40%)',
    institution: 'Standard Template (DYPIU / CBCS)',
    description: 'Default scheme with 60% weighted Theory (CA 25, Mid 25, End 50) and 40% Practical (Lab 10, Assess 10, Viva 30, End 50).',
    isDefault: true,
    isCustom: false,
    createdAt: '15 Aug 2026',
    updatedAt: '15 Aug 2026',
    categories: [
      {
        id: 'cat-theory',
        name: 'Theory',
        weight: 60,
        components: [
          { id: 'comp-ca', name: 'Continuous Assessment (CA)', maxMarks: 25 },
          { id: 'comp-mid', name: 'Mid-Semester Exam', maxMarks: 25 },
          { id: 'comp-end', name: 'End-Semester Exam', maxMarks: 50 }
        ]
      },
      {
        id: 'cat-practical',
        name: 'Practical',
        weight: 40,
        components: [
          { id: 'comp-lab-manual', name: 'Lab Manual', maxMarks: 10 },
          { id: 'comp-lab-assess', name: 'Lab Assessment', maxMarks: 10 },
          { id: 'comp-viva', name: 'Internal Viva', maxMarks: 30 },
          { id: 'comp-end-practical', name: 'End Practical Exam', maxMarks: 50 }
        ]
      }
    ]
  },
  {
    id: 'internal-external-30-70',
    name: 'Internal (30%) & External (70%)',
    institution: 'State University Model',
    description: 'Continuous internal assessment (Assignments 10, Midterm 20) with high-weight End-Semester University Examination (100).',
    isDefault: false,
    isCustom: false,
    createdAt: '15 Aug 2026',
    updatedAt: '15 Aug 2026',
    categories: [
      {
        id: 'cat-internal',
        name: 'Internal Assessment',
        weight: 30,
        components: [
          { id: 'comp-assignment', name: 'Assignments / Quizzes', maxMarks: 10 },
          { id: 'comp-midterm-test', name: 'Midterm Examination', maxMarks: 20 }
        ]
      },
      {
        id: 'cat-external',
        name: 'External University Exam',
        weight: 70,
        components: [
          { id: 'comp-univ-exam', name: 'End-Semester Theory Exam', maxMarks: 100 }
        ]
      }
    ]
  },
  {
    id: 'theory-practical-70-30',
    name: 'Theory (70%) & Practical (30%)',
    institution: 'Engineering & Technology Model',
    description: '70% weighted Theory (Quiz 10, Midsem 30, Endsem 60) and 30% Practical (Lab Continuous 50, Practical Exam 50).',
    isDefault: false,
    isCustom: false,
    createdAt: '15 Aug 2026',
    updatedAt: '15 Aug 2026',
    categories: [
      {
        id: 'cat-theory-70',
        name: 'Theory',
        weight: 70,
        components: [
          { id: 'comp-quiz', name: 'Quizzes & Tutorials', maxMarks: 10 },
          { id: 'comp-midsem-30', name: 'Mid-Semester Exam', maxMarks: 30 },
          { id: 'comp-endsem-60', name: 'End-Semester Exam', maxMarks: 60 }
        ]
      },
      {
        id: 'cat-practical-30',
        name: 'Practical',
        weight: 30,
        components: [
          { id: 'comp-lab-continuous', name: 'Continuous Lab Work', maxMarks: 50 },
          { id: 'comp-viva-exam', name: 'Practical & Viva Exam', maxMarks: 50 }
        ]
      }
    ]
  },
  {
    id: 'pure-theory-100',
    name: 'Pure Theory (100% Single Category)',
    institution: 'Autonomous / CBCS Theory Courses',
    description: '100% Theory subject evaluated via Continuous Assessment (40 marks) and End-Term Exam (60 marks).',
    isDefault: false,
    isCustom: false,
    createdAt: '15 Aug 2026',
    updatedAt: '15 Aug 2026',
    categories: [
      {
        id: 'cat-pure-theory',
        name: 'Theory',
        weight: 100,
        components: [
          { id: 'comp-ca-40', name: 'Continuous Assessment', maxMarks: 40 },
          { id: 'comp-end-60', name: 'End-Term Examination', maxMarks: 60 }
        ]
      }
    ]
  },
  {
    id: 'pure-practical-100',
    name: 'Pure Practical / Studio (100% Single Category)',
    institution: 'Lab / Studio / Workshop Courses',
    description: '100% Lab evaluation with Continuous Work (50 marks) and Final Practical / Project Jury (50 marks).',
    isDefault: false,
    isCustom: false,
    createdAt: '15 Aug 2026',
    updatedAt: '15 Aug 2026',
    categories: [
      {
        id: 'cat-pure-practical',
        name: 'Practical / Studio',
        weight: 100,
        components: [
          { id: 'comp-lab-50', name: 'Continuous Practical Work', maxMarks: 50 },
          { id: 'comp-jury-50', name: 'Final Practical Exam / Project Jury', maxMarks: 50 }
        ]
      }
    ]
  }
]

/* ── Storage Helpers ──────────────────────────────── */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function getCustomEvaluationSchemes() {
  return readJSON(CUSTOM_EVALUATION_SCHEMES_KEY, [])
}

export function getAllEvaluationSchemes() {
  return [...BUILT_IN_EVALUATION_SCHEMES, ...getCustomEvaluationSchemes()]
}

export function getEvaluationScheme(id) {
  return getAllEvaluationSchemes().find(s => s.id === id) || null
}

export function getActiveEvaluationScheme() {
  const id = localStorage.getItem(ACTIVE_EVALUATION_SCHEME_KEY) || 'unigrade-default-60-40'
  return getEvaluationScheme(id) || BUILT_IN_EVALUATION_SCHEMES[0]
}

export function setActiveEvaluationScheme(id) {
  localStorage.setItem(ACTIVE_EVALUATION_SCHEME_KEY, id)
}

export function saveCustomEvaluationScheme(scheme) {
  const schemes = getCustomEvaluationSchemes()
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const updatedScheme = {
    ...scheme,
    updatedAt: formattedDate,
    createdAt: scheme.createdAt || formattedDate,
    isCustom: true
  }

  const idx = schemes.findIndex(s => s.id === scheme.id)
  if (idx >= 0) {
    schemes[idx] = updatedScheme
  } else {
    schemes.push(updatedScheme)
  }

  localStorage.setItem(CUSTOM_EVALUATION_SCHEMES_KEY, JSON.stringify(schemes))
  return updatedScheme
}

export function deleteCustomEvaluationScheme(id) {
  const schemes = getCustomEvaluationSchemes().filter(s => s.id !== id)
  localStorage.setItem(CUSTOM_EVALUATION_SCHEMES_KEY, JSON.stringify(schemes))

  // If active scheme was deleted, reset to default
  const activeId = localStorage.getItem(ACTIVE_EVALUATION_SCHEME_KEY)
  if (activeId === id) {
    setActiveEvaluationScheme('unigrade-default-60-40')
  }
}

export function duplicateEvaluationScheme(id, newName) {
  const original = getEvaluationScheme(id)
  if (!original) return null

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const copy = {
    ...original,
    id: 'scheme-' + Date.now(),
    name: newName || `${original.name} (Copy)`,
    isCustom: true,
    isDefault: false,
    createdAt: formattedDate,
    updatedAt: formattedDate,
    categories: original.categories.map(cat => ({
      ...cat,
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      components: cat.components.map(comp => ({
        ...comp,
        id: 'comp-' + Math.random().toString(36).substring(2, 9)
      }))
    }))
  }

  saveCustomEvaluationScheme(copy)
  return copy
}

/* ── Mathematical Calculation Engine ─────────────── */

/**
 * Calculates the score percentage for a single category given student component marks.
 * Returns { categoryTotalObtained, categoryMaxMarks, categoryPercentage, weightedContribution }
 */
export function calculateCategoryScore(category, componentMarksMap = {}) {
  let obtainedTotal = 0
  let maxTotal = 0
  const componentBreakdown = []

  for (const comp of category.components || []) {
    const rawVal = componentMarksMap[comp.id] !== undefined
      ? componentMarksMap[comp.id]
      : componentMarksMap[comp.name]
    
    const obtained = Math.max(0, Number(rawVal) || 0)
    const max = Number(comp.maxMarks) || 0

    obtainedTotal += obtained
    maxTotal += max

    componentBreakdown.push({
      componentId: comp.id,
      componentName: comp.name,
      obtained,
      maxMarks: max
    })
  }

  // Normalized category score out of 100%
  const categoryPercentage = maxTotal > 0 ? (obtainedTotal / maxTotal) * 100 : 0
  const weight = Number(category.weight) || 0
  const weightedContribution = (categoryPercentage * weight) / 100

  return {
    categoryId: category.id,
    categoryName: category.name,
    weight,
    obtainedTotal: Math.round(obtainedTotal * 100) / 100,
    maxTotal: Math.round(maxTotal * 100) / 100,
    categoryPercentage: Math.round(categoryPercentage * 100) / 100,
    weightedContribution: Math.round(weightedContribution * 1000) / 1000,
    componentBreakdown
  }
}

/**
 * Calculates the final subject marks (out of 100) from an evaluation scheme and raw student marks.
 * Formula: FinalMark = Sum( CategoryScore_c * (CategoryWeight_c / 100) )
 */
export function calculateFinalSubjectMarks(scheme, studentMarksMap = {}) {
  if (!scheme || !Array.isArray(scheme.categories) || scheme.categories.length === 0) {
    return {
      finalMarks: 0,
      totalWeight: 0,
      categoriesBreakdown: []
    }
  }

  let finalMarks = 0
  let totalWeight = 0
  const categoriesBreakdown = []

  for (const category of scheme.categories) {
    const catScore = calculateCategoryScore(category, studentMarksMap)
    finalMarks += catScore.weightedContribution
    totalWeight += catScore.weight
    categoriesBreakdown.push(catScore)
  }

  return {
    finalMarks: Math.round(finalMarks * 10) / 10, // Round to 1 decimal place (e.g. 88.6)
    totalWeight,
    categoriesBreakdown
  }
}

/* ── Validation Engine ────────────────────────────── */

export function validateEvaluationScheme(scheme) {
  const errors = []

  if (!scheme.name || !scheme.name.trim()) {
    errors.push('Scheme name is required.')
  }

  if (!Array.isArray(scheme.categories) || scheme.categories.length === 0) {
    errors.push('At least one evaluation category is required.')
    return errors
  }

  let totalWeight = 0
  const categoryNames = new Set()

  scheme.categories.forEach((cat, catIdx) => {
    const catNum = catIdx + 1
    const trimmedCatName = (cat.name || '').trim()

    if (!trimmedCatName) {
      errors.push(`Category ${catNum}: category name is required.`)
    } else if (categoryNames.has(trimmedCatName.toLowerCase())) {
      errors.push(`Category "${cat.name}": duplicate category name found.`)
    } else {
      categoryNames.add(trimmedCatName.toLowerCase())
    }

    const weightNum = Number(cat.weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      errors.push(`Category "${cat.name || catNum}": weight must be greater than 0%.`)
    } else {
      totalWeight += weightNum
    }

    if (!Array.isArray(cat.components) || cat.components.length === 0) {
      errors.push(`Category "${cat.name || catNum}": must contain at least one assessment component.`)
    } else {
      const compNames = new Set()
      cat.components.forEach((comp, compIdx) => {
        const compNum = compIdx + 1
        const trimmedCompName = (comp.name || '').trim()

        if (!trimmedCompName) {
          errors.push(`Category "${cat.name || catNum}" > Component ${compNum}: component name is required.`)
        } else if (compNames.has(trimmedCompName.toLowerCase())) {
          errors.push(`Category "${cat.name || catNum}": duplicate component name "${comp.name}" within this category.`)
        } else {
          compNames.add(trimmedCompName.toLowerCase())
        }

        const maxM = Number(comp.maxMarks)
        if (isNaN(maxM) || maxM <= 0) {
          errors.push(`Category "${cat.name || catNum}" > Component "${comp.name || compNum}": maximum marks must be greater than 0.`)
        }
      })
    }
  })

  // Exact 100% total weight check (tolerating float rounding within 0.001)
  if (Math.abs(totalWeight - 100) > 0.01) {
    errors.push(`Total category weight must equal exactly 100%. (Current total: ${Math.round(totalWeight * 100) / 100}%)`)
  }

  return errors
}

export function createEmptyEvaluationScheme() {
  return {
    id: 'scheme-' + Date.now(),
    name: '',
    institution: '',
    description: '',
    isCustom: true,
    isDefault: false,
    categories: [
      {
        id: 'cat-' + Date.now() + '-1',
        name: 'Theory',
        weight: 60,
        components: [
          { id: 'comp-' + Date.now() + '-1', name: 'Continuous Assessment', maxMarks: 25 },
          { id: 'comp-' + Date.now() + '-2', name: 'End-Semester Exam', maxMarks: 75 }
        ]
      },
      {
        id: 'cat-' + Date.now() + '-2',
        name: 'Practical',
        weight: 40,
        components: [
          { id: 'comp-' + Date.now() + '-3', name: 'Continuous Lab', maxMarks: 50 },
          { id: 'comp-' + Date.now() + '-4', name: 'Practical & Viva Exam', maxMarks: 50 }
        ]
      }
    ]
  }
}
