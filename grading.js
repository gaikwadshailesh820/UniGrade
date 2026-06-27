/* =====================================================
   UniGrade — grading.js
   Universal Grading Engine
   -----------------------------------------------------
   Defines the data model + built-in grading systems used
   across the whole app (SGPA Calculator, Relative Grading,
   Student/Institution Records). Calculation logic NEVER
   hardcodes grade boundaries — it always reads them from
   a GradingSystem object produced by this module.

   Data model
   ----------
   GradeRule:
     { grade: 'O', min: 90, max: 100, gradePoint: 10 }
     For mode = 'relative', `min`/`max` are z-score bounds
     instead of marks/percentage bounds.

   GradingSystem:
     {
       id, name, university, mode: 'absolute' | 'relative',
       description, passingGradePoint, rules: GradeRule[],
       isCustom: boolean
     }
   ===================================================== */

const ACTIVE_ABSOLUTE_KEY = 'ug_activeAbsoluteSystemId';
const ACTIVE_RELATIVE_KEY = 'ug_activeRelativeSystemId';
const CUSTOM_SYSTEMS_KEY = 'ug_customGradingSystems';

/* ── Built-in Absolute Grading Systems ───────────────
   NOTE: Exact official boundaries vary by year/circular for
   each university. These presets are reasonable approximations
   of commonly published 10-point scales and are fully editable —
   duplicate any of them into a Custom system and adjust to match
   your institution's current circular. */

const BUILT_IN_SYSTEMS = [
  {
    id: 'unigrade-default',
    name: 'UniGrade Standard',
    university: 'Default (Generic 10-point CBCS)',
    mode: 'absolute',
    description: 'The original UniGrade scale. Used automatically if no other system is selected.',
    passingGradePoint: 5,
    isCustom: false,
    rules: [
      { grade: 'O',  min: 90, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 80, max: 89.99, gradePoint: 9 },
      { grade: 'A',  min: 70, max: 79.99, gradePoint: 8 },
      { grade: 'B+', min: 60, max: 69.99, gradePoint: 7 },
      { grade: 'B',  min: 50, max: 59.99, gradePoint: 6 },
      { grade: 'C',  min: 40, max: 49.99, gradePoint: 5 },
      { grade: 'F',  min: 0,  max: 39.99, gradePoint: 0 }
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
      { grade: 'O',  min: 90, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 80, max: 89.99, gradePoint: 9 },
      { grade: 'A',  min: 70, max: 79.99, gradePoint: 8 },
      { grade: 'B+', min: 60, max: 69.99, gradePoint: 7 },
      { grade: 'B',  min: 55, max: 59.99, gradePoint: 6 },
      { grade: 'C',  min: 50, max: 54.99, gradePoint: 5 },
      { grade: 'P',  min: 40, max: 49.99, gradePoint: 4 },
      { grade: 'F',  min: 0,  max: 39.99, gradePoint: 0 }
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
      { grade: 'O',  min: 80, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 75, max: 79.99, gradePoint: 9 },
      { grade: 'A',  min: 70, max: 74.99, gradePoint: 8 },
      { grade: 'B+', min: 65, max: 69.99, gradePoint: 7 },
      { grade: 'B',  min: 60, max: 64.99, gradePoint: 6 },
      { grade: 'C',  min: 55, max: 59.99, gradePoint: 5 },
      { grade: 'P',  min: 50, max: 54.99, gradePoint: 4 },
      { grade: 'F',  min: 0,  max: 49.99, gradePoint: 0 }
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
      { grade: 'O',  min: 90, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 80, max: 89.99, gradePoint: 9 },
      { grade: 'A',  min: 70, max: 79.99, gradePoint: 8 },
      { grade: 'B+', min: 60, max: 69.99, gradePoint: 7 },
      { grade: 'B',  min: 55, max: 59.99, gradePoint: 6 },
      { grade: 'C',  min: 50, max: 54.99, gradePoint: 5 },
      { grade: 'P',  min: 40, max: 49.99, gradePoint: 4 },
      { grade: 'F',  min: 0,  max: 39.99, gradePoint: 0 }
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
      { grade: 'O',  min: 91, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 81, max: 90.99, gradePoint: 9 },
      { grade: 'A',  min: 71, max: 80.99, gradePoint: 8 },
      { grade: 'B+', min: 61, max: 70.99, gradePoint: 7 },
      { grade: 'B',  min: 50, max: 60.99, gradePoint: 6 },
      { grade: 'RA', min: 0,  max: 49.99, gradePoint: 0 }
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
      { grade: 'O',  min: 90, max: 100, gradePoint: 10 },
      { grade: 'A+', min: 80, max: 89.99, gradePoint: 9 },
      { grade: 'A',  min: 70, max: 79.99, gradePoint: 8 },
      { grade: 'B+', min: 60, max: 69.99, gradePoint: 7 },
      { grade: 'B',  min: 55, max: 59.99, gradePoint: 6 },
      { grade: 'C',  min: 50, max: 54.99, gradePoint: 5 },
      { grade: 'P',  min: 40, max: 49.99, gradePoint: 4 },
      { grade: 'F',  min: 0,  max: 39.99, gradePoint: 0 }
    ]
  }
];

/* ── Built-in Relative Grading Systems ───────────────
   For mode = 'relative', min/max are bounds on the
   z-score: z = (studentMarks - classMean) / classStdDev */

const BUILT_IN_RELATIVE_SYSTEMS = [
  {
    id: 'relative-zscore-standard',
    name: 'Standard Relative Grading (8 bands)',
    university: 'Default relative / bell-curve grading',
    mode: 'relative',
    description: 'The original UniGrade relative grading curve, based on standard deviations from the class mean.',
    passingGradePoint: 4,
    isCustom: false,
    rules: [
      { grade: 'A+', min: 1.5,  max: Infinity, gradePoint: 10 },
      { grade: 'A',  min: 0.5,  max: 1.4999,  gradePoint: 9 },
      { grade: 'B+', min: -0.5, max: 0.4999,  gradePoint: 8 },
      { grade: 'B',  min: -1.5, max: -0.5001, gradePoint: 7 },
      { grade: 'C+', min: -2.5, max: -1.5001, gradePoint: 6 },
      { grade: 'C',  min: -3.5, max: -2.5001, gradePoint: 5 },
      { grade: 'D',  min: -4.5, max: -3.5001, gradePoint: 4 },
      { grade: 'F',  min: -Infinity, max: -4.5001, gradePoint: 0 }
    ]
  }
];

/* ── Storage Helpers ──────────────────────────────── */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getCustomSystems() {
  return readJSON(CUSTOM_SYSTEMS_KEY, []);
}

function saveCustomSystem(system) {
  const systems = getCustomSystems();
  const idx = systems.findIndex(s => s.id === system.id);
  if (idx >= 0) systems[idx] = system;
  else systems.push(system);
  localStorage.setItem(CUSTOM_SYSTEMS_KEY, JSON.stringify(systems));
  return system;
}

function deleteCustomSystem(id) {
  const systems = getCustomSystems().filter(s => s.id !== id);
  localStorage.setItem(CUSTOM_SYSTEMS_KEY, JSON.stringify(systems));
}

function duplicateSystem(id, newName) {
  const original = getSystem(id);
  if (!original) return null;
  const copy = {
    ...original,
    id: 'custom-' + Date.now(),
    name: newName || (original.name + ' (Copy)'),
    isCustom: true,
    rules: original.rules.map(r => ({ ...r }))
  };
  saveCustomSystem(copy);
  return copy;
}

/* ── Public Registry Functions ───────────────────── */

function getAllSystems() {
  return [...BUILT_IN_SYSTEMS, ...BUILT_IN_RELATIVE_SYSTEMS, ...getCustomSystems()];
}

function getAbsoluteSystems() {
  return getAllSystems().filter(s => s.mode === 'absolute');
}

function getRelativeSystems() {
  return getAllSystems().filter(s => s.mode === 'relative');
}

function getSystem(id) {
  return getAllSystems().find(s => s.id === id) || null;
}

function getActiveAbsoluteSystem() {
  const id = localStorage.getItem(ACTIVE_ABSOLUTE_KEY) || 'unigrade-default';
  return getSystem(id) || BUILT_IN_SYSTEMS[0];
}

function setActiveAbsoluteSystem(id) {
  localStorage.setItem(ACTIVE_ABSOLUTE_KEY, id);
}

function getActiveRelativeSystem() {
  const id = localStorage.getItem(ACTIVE_RELATIVE_KEY) || 'relative-zscore-standard';
  return getSystem(id) || BUILT_IN_RELATIVE_SYSTEMS[0];
}

function setActiveRelativeSystem(id) {
  localStorage.setItem(ACTIVE_RELATIVE_KEY, id);
}

/* ── Core Calculation (NEVER hardcode boundaries elsewhere) ── */

/**
 * Resolve a grade + grade point for a given value (marks % for
 * 'absolute' systems, z-score for 'relative' systems).
 * Falls back to the lowest rule (fail) if nothing matches.
 */
function resolveGrade(system, value) {
  if (!system || !Array.isArray(system.rules) || system.rules.length === 0) {
    return { grade: 'F', gradePoint: 0 };
  }
  const sorted = [...system.rules].sort((a, b) => b.min - a.min);
  for (const rule of sorted) {
    const max = rule.max === undefined || rule.max === null ? Infinity : rule.max;
    if (value >= rule.min && value <= max) {
      return { grade: rule.grade, gradePoint: rule.gradePoint };
    }
  }
  // Below every defined rule -> treat as the failing/lowest rule
  const lowest = sorted[sorted.length - 1];
  return { grade: lowest.grade, gradePoint: lowest.gradePoint };
}

function getGradePoint(system, value) {
  return resolveGrade(system, value).gradePoint;
}

function getGradeLabel(system, value) {
  return resolveGrade(system, value).grade;
}

/* ── Validation (used by the Custom Grading Builder) ── */

function validateSystem(system) {
  const errors = [];
  if (!system.name || !system.name.trim()) errors.push('Grading system name is required.');
  if (!Array.isArray(system.rules) || system.rules.length === 0) {
    errors.push('At least one grade rule is required.');
    return errors;
  }
  system.rules.forEach((r, i) => {
    if (!r.grade || !String(r.grade).trim()) errors.push(`Row ${i + 1}: grade name is required.`);
    if (r.min === '' || r.min === null || r.min === undefined || isNaN(Number(r.min))) errors.push(`Row ${i + 1}: minimum value is required.`);
    if (r.max !== '' && r.max !== null && r.max !== undefined && isNaN(Number(r.max))) errors.push(`Row ${i + 1}: maximum value must be numeric.`);
    if (r.gradePoint === '' || r.gradePoint === null || r.gradePoint === undefined || isNaN(Number(r.gradePoint))) errors.push(`Row ${i + 1}: grade point is required.`);
  });
  return errors;
}

function createEmptySystem(mode = 'absolute') {
  return {
    id: 'custom-' + Date.now(),
    name: '',
    university: '',
    mode,
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
  };
}

export {
  BUILT_IN_SYSTEMS,
  BUILT_IN_RELATIVE_SYSTEMS,
  getAllSystems,
  getAbsoluteSystems,
  getRelativeSystems,
  getSystem,
  getCustomSystems,
  saveCustomSystem,
  deleteCustomSystem,
  duplicateSystem,
  getActiveAbsoluteSystem,
  setActiveAbsoluteSystem,
  getActiveRelativeSystem,
  setActiveRelativeSystem,
  resolveGrade,
  getGradePoint,
  getGradeLabel,
  validateSystem,
  createEmptySystem
};
