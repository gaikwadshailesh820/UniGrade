/* =====================================================
   UniGrade V2 — gradingSystems.js
   Universal Grading Engine (Fixed & Relative)
   -----------------------------------------------------
   Supports:
   1. Absolute / Fixed Percentage Grading (SPPU, Mumbai, VTU, UGC...)
   2. Relative Grading:
      - Rank-Based (Primary / Institutional Default)
      - Z-Score / Standard Normal Distribution
      - Custom Scales
   ===================================================== */

export const ACTIVE_ABSOLUTE_KEY = 'ug_activeAbsoluteSystemId'
export const ACTIVE_RELATIVE_KEY = 'ug_activeRelativeSystemId'
export const CUSTOM_SYSTEMS_KEY = 'ug_customGradingSystems'

/* ── Built-in Absolute Grading Systems ─────────────── */
export const BUILT_IN_SYSTEMS = [
  {
    id: 'unigrade-default',
    name: 'UniGrade Standard',
    university: 'Default (Generic 10-point CBCS)',
    mode: 'absolute',
    description: 'The original UniGrade scale. Used automatically if no other system is selected.',
    passingGradePoint: 5,
    isCustom: false,
    rules: [
      { grade: 'O', min: 90, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 80, max: 89.99, gradePoint: 9 },
      { grade: 'A', min: 70, max: 79.99, gradePoint: 8 },
      { grade: 'B+', min: 60, max: 69.99, gradePoint: 7 },
      { grade: 'B', min: 50, max: 59.99, gradePoint: 6 },
      { grade: 'C', min: 40, max: 49.99, gradePoint: 5 },
      { grade: 'F', min: 0, max: 39.99, gradePoint: 0 }
    ]
  },
  {
    id: 'sppu',
    name: 'Savitribai Phule Pune University (SPPU)',
    university: 'SPPU, Pune',
    mode: 'absolute',
    description: 'Approximate SPPU 10-point grading scale. Verify against the current SPPU circular before official use.',
    passingGradePoint: 4,
    isCustom: false,
    rules: [
      { grade: 'O', min: 90, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 80, max: 89.99, gradePoint: 9 },
      { grade: 'A', min: 70, max: 79.99, gradePoint: 8 },
      { grade: 'B+', min: 60, max: 69.99, gradePoint: 7 },
      { grade: 'B', min: 55, max: 59.99, gradePoint: 6 },
      { grade: 'C', min: 50, max: 54.99, gradePoint: 5 },
      { grade: 'P', min: 40, max: 49.99, gradePoint: 4 },
      { grade: 'F', min: 0, max: 39.99, gradePoint: 0 }
    ]
  },
  {
    id: 'mumbai-university',
    name: 'Mumbai University',
    university: 'University of Mumbai',
    mode: 'absolute',
    description: 'Approximate Mumbai University 10-point grading scale. Verify against the current circular before official use.',
    passingGradePoint: 4,
    isCustom: false,
    rules: [
      { grade: 'O', min: 80, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 75, max: 79.99, gradePoint: 9 },
      { grade: 'A', min: 70, max: 74.99, gradePoint: 8 },
      { grade: 'B+', min: 65, max: 69.99, gradePoint: 7 },
      { grade: 'B', min: 60, max: 64.99, gradePoint: 6 },
      { grade: 'C', min: 55, max: 59.99, gradePoint: 5 },
      { grade: 'P', min: 50, max: 54.99, gradePoint: 4 },
      { grade: 'F', min: 0, max: 49.99, gradePoint: 0 }
    ]
  },
  {
    id: 'vtu',
    name: 'Visvesvaraya Technological University (VTU)',
    university: 'VTU, Karnataka',
    mode: 'absolute',
    description: 'Approximate VTU 10-point grading scale. Verify against the current VTU circular before official use.',
    passingGradePoint: 4,
    isCustom: false,
    rules: [
      { grade: 'O', min: 90, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 80, max: 89.99, gradePoint: 9 },
      { grade: 'A', min: 70, max: 79.99, gradePoint: 8 },
      { grade: 'B+', min: 60, max: 69.99, gradePoint: 7 },
      { grade: 'B', min: 55, max: 59.99, gradePoint: 6 },
      { grade: 'C', min: 50, max: 54.99, gradePoint: 5 },
      { grade: 'P', min: 40, max: 49.99, gradePoint: 4 },
      { grade: 'F', min: 0, max: 39.99, gradePoint: 0 }
    ]
  },
  {
    id: 'anna-university',
    name: 'Anna University',
    university: 'Anna University, Chennai',
    mode: 'absolute',
    description: 'Approximate Anna University 10-point grading scale. Verify against the current circular before official use.',
    passingGradePoint: 5,
    isCustom: false,
    rules: [
      { grade: 'O', min: 91, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 81, max: 90.99, gradePoint: 9 },
      { grade: 'A', min: 71, max: 80.99, gradePoint: 8 },
      { grade: 'B+', min: 61, max: 70.99, gradePoint: 7 },
      { grade: 'B', min: 50, max: 60.99, gradePoint: 6 },
      { grade: 'RA', min: 0, max: 49.99, gradePoint: 0 }
    ]
  },
  {
    id: 'absolute-ugc',
    name: 'Absolute Grading (UGC-style 10 point)',
    university: 'Generic / Autonomous Colleges',
    mode: 'absolute',
    description: 'A generic fixed-percentage absolute grading scale, suitable for autonomous colleges or as a starting template.',
    passingGradePoint: 4,
    isCustom: false,
    rules: [
      { grade: 'O', min: 90, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 80, max: 89.99, gradePoint: 9 },
      { grade: 'A', min: 70, max: 79.99, gradePoint: 8 },
      { grade: 'B+', min: 60, max: 69.99, gradePoint: 7 },
      { grade: 'B', min: 55, max: 59.99, gradePoint: 6 },
      { grade: 'C', min: 50, max: 54.99, gradePoint: 5 },
      { grade: 'P', min: 40, max: 49.99, gradePoint: 4 },
      { grade: 'F', min: 0, max: 39.99, gradePoint: 0 }
    ]
  }
]

/* ── Built-in Relative Grading Systems ─────────────── */
export const BUILT_IN_RELATIVE_SYSTEMS = [
  {
    id: 'relative-rank-standard',
    name: 'UniGrade Standard (Rank-Based)',
    university: 'Institutional Rank-Based Model',
    mode: 'relative',
    method: 'rank',
    description: 'Primary relative grading method. Maps student cohort ranks directly to letter grades (Rank 1–5: O, 6–10: A+, 11–20: A, 21–30: B+, 31–40: B, 41–50: C, 51–60: D, 61+: F).',
    passingGradePoint: 4,
    isCustom: false,
    rules: [
      { grade: 'O', startRank: 1, min: 1, gradePoint: 10 },
      { grade: 'A+', startRank: 6, min: 6, gradePoint: 9 },
      { grade: 'A', startRank: 11, min: 11, gradePoint: 8 },
      { grade: 'B+', startRank: 21, min: 21, gradePoint: 7 },
      { grade: 'B', startRank: 31, min: 31, gradePoint: 6 },
      { grade: 'C', startRank: 41, min: 41, gradePoint: 5 },
      { grade: 'D', startRank: 51, min: 51, gradePoint: 4 },
      { grade: 'F', startRank: 61, min: 61, gradePoint: 0 }
    ]
  },
  {
    id: 'relative-rank-cohort-small',
    name: 'Small Cohort Scale (Rank-Based)',
    university: 'Autonomous / Small Department Scale',
    mode: 'relative',
    method: 'rank',
    description: 'Rank-based grading optimized for small batches (Rank 1–2: O, 3–5: A+, 6–10: A, 11–15: B+, 16–20: B, 21–25: C, 26–30: D, 31+: F).',
    passingGradePoint: 4,
    isCustom: false,
    rules: [
      { grade: 'O', startRank: 1, min: 1, gradePoint: 10 },
      { grade: 'A+', startRank: 3, min: 3, gradePoint: 9 },
      { grade: 'A', startRank: 6, min: 6, gradePoint: 8 },
      { grade: 'B+', startRank: 11, min: 11, gradePoint: 7 },
      { grade: 'B', startRank: 16, min: 16, gradePoint: 6 },
      { grade: 'C', startRank: 21, min: 21, gradePoint: 5 },
      { grade: 'D', startRank: 26, min: 26, gradePoint: 4 },
      { grade: 'F', startRank: 31, min: 31, gradePoint: 0 }
    ]
  },
  {
    id: 'relative-zscore-standard',
    name: 'Standard Relative Grading (Z-Score / 8 bands)',
    university: 'Statistical Bell-Curve Model',
    mode: 'relative',
    method: 'z-score',
    description: 'Statistical relative grading curve based on standard deviations (Z-Scores) from the class mean.',
    passingGradePoint: 4,
    isCustom: false,
    rules: [
      { grade: 'A+', min: 1.5, max: Infinity, gradePoint: 10 },
      { grade: 'A', min: 0.5, max: 1.4999, gradePoint: 9 },
      { grade: 'B+', min: -0.5, max: 0.4999, gradePoint: 8 },
      { grade: 'B', min: -1.5, max: -0.5001, gradePoint: 7 },
      { grade: 'C+', min: -2.5, max: -1.5001, gradePoint: 6 },
      { grade: 'C', min: -3.5, max: -2.5001, gradePoint: 5 },
      { grade: 'D', min: -4.5, max: -3.5001, gradePoint: 4 },
      { grade: 'F', min: -Infinity, max: -4.5001, gradePoint: 0 }
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

export function getCustomSystems() {
  return readJSON(CUSTOM_SYSTEMS_KEY, [])
}

export function saveCustomSystem(system) {
  const systems = getCustomSystems()
  const idx = systems.findIndex(s => s.id === system.id)
  if (idx >= 0) systems[idx] = system
  else systems.push(system)
  localStorage.setItem(CUSTOM_SYSTEMS_KEY, JSON.stringify(systems))
  return system
}

export function deleteCustomSystem(id) {
  const systems = getCustomSystems().filter(s => s.id !== id)
  localStorage.setItem(CUSTOM_SYSTEMS_KEY, JSON.stringify(systems))
}

export function duplicateSystem(id, newName) {
  const original = getSystem(id)
  if (!original) return null
  const copy = {
    ...original,
    id: 'custom-' + Date.now(),
    name: newName || (original.name + ' (Copy)'),
    isCustom: true,
    rules: original.rules.map(r => ({ ...r }))
  }
  saveCustomSystem(copy)
  return copy
}

/* ── Public Registry Functions ───────────────────── */
export function getAllSystems() {
  return [...BUILT_IN_SYSTEMS, ...BUILT_IN_RELATIVE_SYSTEMS, ...getCustomSystems()]
}

export function getAbsoluteSystems() {
  return getAllSystems().filter(s => s.mode === 'absolute')
}

export function getRelativeSystems() {
  return getAllSystems().filter(s => s.mode === 'relative')
}

export function getSystem(id) {
  return getAllSystems().find(s => s.id === id) || null
}

export function getActiveAbsoluteSystem() {
  const id = localStorage.getItem(ACTIVE_ABSOLUTE_KEY) || 'unigrade-default'
  return getSystem(id) || BUILT_IN_SYSTEMS[0]
}

export function setActiveAbsoluteSystem(id) {
  localStorage.setItem(ACTIVE_ABSOLUTE_KEY, id)
}

export function getActiveRelativeSystem() {
  const id = localStorage.getItem(ACTIVE_RELATIVE_KEY) || 'relative-rank-standard'
  return getSystem(id) || BUILT_IN_RELATIVE_SYSTEMS[0]
}

export function setActiveRelativeSystem(id) {
  localStorage.setItem(ACTIVE_RELATIVE_KEY, id)
}

/* ── Core Calculation Engines ─────────────────────── */

/**
 * Standard Competition Ranking (1224 ranking) with exact tie handling.
 * If students have identical marks, they receive the exact same rank.
 * Example: Marks [95, 90, 90, 85, 80] -> Ranks [1, 2, 2, 4, 5]
 */
export function calculateStudentRanks(records) {
  if (!Array.isArray(records) || records.length === 0) return []

  const sorted = [...records].sort((a, b) => (Number(b.marks) || 0) - (Number(a.marks) || 0))

  let currentRank = 1
  return sorted.map((rec, index) => {
    if (index > 0) {
      const prevMarks = Number(sorted[index - 1].marks) || 0
      const currMarks = Number(rec.marks) || 0
      if (currMarks < prevMarks) {
        currentRank = index + 1
      }
    }
    return {
      ...rec,
      rank: currentRank
    }
  })
}

/**
 * Resolves a letter grade and grade point from student rank in Rank-Based Relative Grading.
 * Threshold model: Rules specify starting ranks (e.g. O: 1, A+: 6, A: 11...).
 * A student with Rank R gets the grade corresponding to the highest starting rank <= R.
 */
export function resolveRankGrade(system, rank) {
  if (!system || !Array.isArray(system.rules) || system.rules.length === 0) {
    return { grade: 'F', gradePoint: 0 }
  }

  const r = Math.max(1, Math.round(Number(rank) || 1))
  const sorted = [...system.rules].sort((a, b) => {
    const startA = Number(a.startRank !== undefined ? a.startRank : a.min) || 1
    const startB = Number(b.startRank !== undefined ? b.startRank : b.min) || 1
    return startB - startA // descending order
  })

  for (const rule of sorted) {
    const start = Number(rule.startRank !== undefined ? rule.startRank : rule.min) || 1
    if (r >= start) {
      return { grade: rule.grade, gradePoint: rule.gradePoint }
    }
  }

  const lowest = sorted[sorted.length - 1]
  return { grade: lowest.grade, gradePoint: lowest.gradePoint }
}

/**
 * Universal Grade Resolver:
 * - Absolute scales: Evaluates percentage marks against min thresholds.
 * - Rank-based relative scales: Evaluates student rank against startRank thresholds.
 * - Z-score relative scales: Evaluates Z-score against min thresholds.
 */
export function resolveGrade(system, value) {
  if (!system || !Array.isArray(system.rules) || system.rules.length === 0) {
    return { grade: 'F', gradePoint: 0 }
  }

  if (system.mode === 'relative' && (system.method === 'rank' || system.method === undefined)) {
    // If rules have startRank or method is rank
    const hasStartRank = system.rules.some(r => r.startRank !== undefined)
    if (hasStartRank || system.method === 'rank') {
      return resolveRankGrade(system, value)
    }
  }

  // Absolute or Z-Score evaluation
  const numericVal = Number(value) || 0
  const sorted = [...system.rules].sort((a, b) => b.min - a.min)

  for (const rule of sorted) {
    if (numericVal >= rule.min) {
      return { grade: rule.grade, gradePoint: rule.gradePoint }
    }
  }

  const lowest = sorted[sorted.length - 1]
  return { grade: lowest.grade, gradePoint: lowest.gradePoint }
}

export function getGradePoint(system, value) {
  return resolveGrade(system, value).gradePoint
}

export function getGradeLabel(system, value) {
  return resolveGrade(system, value).grade
}

/* ── Validation (used by Custom Grading Builder) ── */
export function validateSystem(system) {
  const errors = []
  if (!system.name || !system.name.trim()) errors.push('Grading system name is required.')
  if (!Array.isArray(system.rules) || system.rules.length === 0) {
    errors.push('At least one grade rule is required.')
    return errors
  }

  const gradeNames = new Set()
  const startRanks = new Set()

  system.rules.forEach((r, i) => {
    const rowNum = i + 1
    const gradeStr = (r.grade || '').trim()

    if (!gradeStr) {
      errors.push(`Row ${rowNum}: grade name is required.`)
    } else if (gradeNames.has(gradeStr.toLowerCase())) {
      errors.push(`Row ${rowNum}: duplicate grade name "${r.grade}".`)
    } else {
      gradeNames.add(gradeStr.toLowerCase())
    }

    if (system.mode === 'relative' && system.method === 'rank') {
      const sRank = Number(r.startRank !== undefined ? r.startRank : r.min)
      if (isNaN(sRank) || sRank < 1) {
        errors.push(`Row ${rowNum} ("${r.grade}"): starting rank must be an integer ≥ 1.`)
      } else if (startRanks.has(sRank)) {
        errors.push(`Row ${rowNum} ("${r.grade}"): duplicate starting rank ${sRank}.`)
      } else {
        startRanks.add(sRank)
      }
    } else {
      if (r.min === '' || r.min === null || r.min === undefined || isNaN(Number(r.min))) {
        errors.push(`Row ${rowNum}: minimum threshold is required.`)
      }
    }

    if (r.gradePoint === '' || r.gradePoint === null || r.gradePoint === undefined || isNaN(Number(r.gradePoint))) {
      errors.push(`Row ${rowNum}: grade point is required.`)
    }
  })

  // Check that Rank-based scale starts at Rank 1
  if (system.mode === 'relative' && system.method === 'rank') {
    if (!startRanks.has(1)) {
      errors.push('A rank-based grading system must include a grade rule starting at Rank 1.')
    }
  }

  return errors
}

export function createEmptySystem(mode = 'absolute', method = 'rank') {
  if (mode === 'relative' && method === 'rank') {
    return {
      id: 'custom-' + Date.now(),
      name: '',
      university: '',
      mode: 'relative',
      method: 'rank',
      description: '',
      passingGradePoint: 4,
      isCustom: true,
      rules: [
        { grade: 'O', startRank: 1, min: 1, gradePoint: 10 },
        { grade: 'A', startRank: 6, min: 6, gradePoint: 8 },
        { grade: 'B', startRank: 16, min: 16, gradePoint: 6 },
        { grade: 'F', startRank: 31, min: 31, gradePoint: 0 }
      ]
    }
  }

  return {
    id: 'custom-' + Date.now(),
    name: '',
    university: '',
    mode,
    method: mode === 'relative' ? method : undefined,
    description: '',
    passingGradePoint: 4,
    isCustom: true,
    rules: mode === 'absolute'
      ? [
          { grade: 'O', min: 90, max: 100, gradePoint: 10 },
          { grade: 'F', min: 0, max: 39.99, gradePoint: 0 }
        ]
      : [
          { grade: 'A+', min: 1.5, max: Infinity, gradePoint: 10 },
          { grade: 'F', min: -Infinity, max: -1.5, gradePoint: 0 }
        ]
  }
}
