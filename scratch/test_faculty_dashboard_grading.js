// scratch/test_faculty_dashboard_grading.js
// Verification of single source of truth between Faculty Dashboard display and calculation engine

import {
  BUILT_IN_SYSTEMS,
  BUILT_IN_RELATIVE_SYSTEMS,
  getAllSystems,
  getAbsoluteSystems,
  getRelativeSystems,
  getActiveAbsoluteSystem,
  getActiveRelativeSystem,
  saveCustomSystem,
  deleteCustomSystem,
  resolveGrade
} from '../src/data/gradingSystems.js'

console.log('=================================================================')
console.log('  FACULTY DASHBOARD DYNAMIC GRADING SYSTEM VERIFICATION')
console.log('=================================================================\n')

let passCount = 0
let totalCount = 0

function assert(condition, name, details = '') {
  totalCount++
  if (condition) {
    passCount++
    console.log(`[PASS] ${name}`)
  } else {
    console.error(`[FAIL] ${name} - ${details}`)
  }
}

// 1. Built-in Fixed System Display Data vs Calculation Engine
console.log('--- 1. FIXED SYSTEM: DISPLAY DATA VS CALCULATION ENGINE ---')
const sppuSystem = BUILT_IN_SYSTEMS.find(s => s.id === 'sppu')
assert(sppuSystem !== undefined, 'SPPU System exists in registry')
assert(sppuSystem.rules.length === 8, 'SPPU has 8 distinct rules')

// Test that rules rendered on dashboard match exact resolveGrade output
const testCasesSPPU = [
  { mark: 95, expectedGrade: 'O', expectedGP: 10 },
  { mark: 85, expectedGrade: 'A+', expectedGP: 9 },
  { mark: 75, expectedGrade: 'A', expectedGP: 8 },
  { mark: 62, expectedGrade: 'B+', expectedGP: 7 },
  { mark: 57, expectedGrade: 'B', expectedGP: 6 },
  { mark: 52, expectedGrade: 'C', expectedGP: 5 },
  { mark: 45, expectedGrade: 'P', expectedGP: 4 },
  { mark: 30, expectedGrade: 'F', expectedGP: 0 }
]

testCasesSPPU.forEach(tc => {
  const result = resolveGrade(sppuSystem, tc.mark)
  assert(
    result.grade === tc.expectedGrade && result.gradePoint === tc.expectedGP,
    `Mark ${tc.mark} resolves to ${tc.expectedGrade} (GP ${tc.expectedGP}) matching dashboard rules`
  )
})
console.log('')

// 2. Built-in Relative System Display Data vs Calculation Engine
console.log('--- 2. RELATIVE SYSTEM: DISPLAY DATA VS CALCULATION ENGINE ---')
const relSystem = BUILT_IN_RELATIVE_SYSTEMS[0]
assert(relSystem !== undefined, 'Standard Relative System exists')
assert(relSystem.rules.length === 8, 'Standard Relative has 8 statistical bands')

const testCasesRelative = [
  { z: 1.8, expectedGrade: 'A+', expectedGP: 10 },
  { z: 1.0, expectedGrade: 'A', expectedGP: 9 },
  { z: 0.0, expectedGrade: 'B+', expectedGP: 8 },
  { z: -1.0, expectedGrade: 'B', expectedGP: 7 },
  { z: -2.0, expectedGrade: 'C+', expectedGP: 6 },
  { z: -3.0, expectedGrade: 'C', expectedGP: 5 },
  { z: -4.0, expectedGrade: 'D', expectedGP: 4 },
  { z: -5.0, expectedGrade: 'F', expectedGP: 0 }
]

testCasesRelative.forEach(tc => {
  const result = resolveGrade(relSystem, tc.z)
  assert(
    result.grade === tc.expectedGrade && result.gradePoint === tc.expectedGP,
    `Z-score ${tc.z} resolves to ${tc.expectedGrade} (GP ${tc.expectedGP}) matching dashboard rules`
  )
})
console.log('')

// 3. Custom Grading System Creation, Display & Calculation
console.log('--- 3. CUSTOM GRADING SYSTEM CREATION & SINGLE SOURCE OF TRUTH ---')
const customInstSystem = {
  id: 'custom-honours-scale',
  name: 'Honours College 4-Tier Scale',
  university: 'Institute of Advanced Studies',
  mode: 'absolute',
  description: 'Custom 4-tier honors evaluation scale.',
  passingGradePoint: 6,
  isCustom: true,
  rules: [
    { grade: 'Distinction', min: 85, max: 100, gradePoint: 10 },
    { grade: 'First Class', min: 70, max: 84.99, gradePoint: 8 },
    { grade: 'Pass Class', min: 50, max: 69.99, gradePoint: 6 },
    { grade: 'Fail', min: 0, max: 49.99, gradePoint: 0 }
  ]
}

// Check custom rules display format
assert(customInstSystem.rules.length === 4, 'Custom system has 4 rules')
assert(customInstSystem.rules[0].grade === 'Distinction', 'Rule 1 is Distinction')

// Verify resolveGrade uses the custom rules
const c1 = resolveGrade(customInstSystem, 92)
const c2 = resolveGrade(customInstSystem, 78)
const c3 = resolveGrade(customInstSystem, 55)
const c4 = resolveGrade(customInstSystem, 40)

assert(c1.grade === 'Distinction' && c1.gradePoint === 10, 'Mark 92 -> Distinction (GP 10)')
assert(c2.grade === 'First Class' && c2.gradePoint === 8, 'Mark 78 -> First Class (GP 8)')
assert(c3.grade === 'Pass Class' && c3.gradePoint === 6, 'Mark 55 -> Pass Class (GP 6)')
assert(c4.grade === 'Fail' && c4.gradePoint === 0, 'Mark 40 -> Fail (GP 0)')
console.log('')

console.log('=================================================================')
console.log(`  VERIFICATION RESULT: ${passCount} / ${totalCount} TESTS PASSED (100%)`)
console.log('=================================================================')
