// scratch/test_evaluation_schemes.js
// Automated verification suite for the Customizable Evaluation Scheme Engine

import {
  BUILT_IN_EVALUATION_SCHEMES,
  calculateCategoryScore,
  calculateFinalSubjectMarks,
  validateEvaluationScheme,
  createEmptyEvaluationScheme
} from '../src/data/evaluationSchemes.js'

import {
  BUILT_IN_SYSTEMS,
  resolveGrade
} from '../src/data/gradingSystems.js'

console.log('=================================================================')
console.log('  UNIGRADE V2 EVALUATION SCHEME ENGINE VERIFICATION TEST')
console.log('=================================================================\n')

let totalTests = 0
let passedTests = 0

function assert(condition, testName, details = '') {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`[PASS] ${testName}`)
  } else {
    console.error(`[FAIL] ${testName} - ${details}`)
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Default & Built-in Schemes Structure
// ---------------------------------------------------------------------------
console.log('--- 1. BUILT-IN EVALUATION SCHEME TEMPLATES ---')
assert(BUILT_IN_EVALUATION_SCHEMES.length >= 5, 'At least 5 built-in evaluation templates available')

BUILT_IN_EVALUATION_SCHEMES.forEach((scheme, i) => {
  const errors = validateEvaluationScheme(scheme)
  assert(errors.length === 0, `Built-in Template #${i + 1} (${scheme.name}) passes validation`, errors.join(', '))
})
console.log('')

// ---------------------------------------------------------------------------
// TEST 2: Validation Rules
// ---------------------------------------------------------------------------
console.log('--- 2. VALIDATION ENGINE AUDIT ---')

// 2a. Weight not 100%
const invalidWeightScheme = {
  name: 'Invalid Weight Scheme',
  categories: [
    { id: 'c1', name: 'Theory', weight: 60, components: [{ id: 'comp1', name: 'CA', maxMarks: 50 }] },
    { id: 'c2', name: 'Practical', weight: 30, components: [{ id: 'comp2', name: 'Lab', maxMarks: 50 }] }
  ]
}
const weightErrors = validateEvaluationScheme(invalidWeightScheme)
assert(weightErrors.some(e => e.includes('Total category weight must equal exactly 100%')), 'Catches total weight != 100% (Current: 90%)')

// 2b. Zero / Negative component max marks
const invalidCompMarksScheme = {
  name: 'Invalid Comp Marks',
  categories: [
    { id: 'c1', name: 'Theory', weight: 100, components: [{ id: 'comp1', name: 'CA', maxMarks: 0 }] }
  ]
}
const compMarksErrors = validateEvaluationScheme(invalidCompMarksScheme)
assert(compMarksErrors.some(e => e.includes('maximum marks must be greater than 0')), 'Catches component maxMarks <= 0')

// 2c. Duplicate component names in same category
const duplicateCompScheme = {
  name: 'Duplicate Comp',
  categories: [
    {
      id: 'c1', name: 'Theory', weight: 100,
      components: [
        { id: 'comp1', name: 'Assignment', maxMarks: 20 },
        { id: 'comp2', name: 'Assignment', maxMarks: 30 }
      ]
    }
  ]
}
const dupErrors = validateEvaluationScheme(duplicateCompScheme)
assert(dupErrors.some(e => e.includes('duplicate component name')), 'Catches duplicate component names within same category')
console.log('')

// ---------------------------------------------------------------------------
// TEST 3: Mathematical Calculations with Diverse Scheme Structures
// ---------------------------------------------------------------------------
console.log('--- 3. MATHEMATICAL CALCULATION ACROSS SCHEMES ---')

// Case A: Internal 30% / External 70%
// Internal: Assignment (8/10), Midterm (16/20) -> 24/30 = 80.0% * 0.30 = 24.0 pts
// External: Endsem (75/100) -> 75.0% * 0.70 = 52.5 pts
// Final Marks = 24.0 + 52.5 = 76.5 / 100
const schemeA = BUILT_IN_EVALUATION_SCHEMES.find(s => s.id === 'internal-external-30-70')
const marksA = {
  'comp-assignment': 8,
  'comp-midterm-test': 16,
  'comp-univ-exam': 75
}
const resultA = calculateFinalSubjectMarks(schemeA, marksA)
assert(resultA.finalMarks === 76.5, `Scheme A Final Marks = 76.5 (Got: ${resultA.finalMarks})`)
assert(resultA.categoriesBreakdown[0].weightedContribution === 24, 'Scheme A Internal Contribution = 24.0')
assert(resultA.categoriesBreakdown[1].weightedContribution === 52.5, 'Scheme A External Contribution = 52.5')

// Case B: Theory 70% / Practical 30%
// Theory: Quiz (10/10), Midsem (25/30), Endsem (50/60) -> 85/100 = 85.0% * 0.70 = 59.5 pts
// Practical: Lab (40/50), Viva (45/50) -> 85/100 = 85.0% * 0.30 = 25.5 pts
// Final Marks = 59.5 + 25.5 = 85.0 / 100
const schemeB = BUILT_IN_EVALUATION_SCHEMES.find(s => s.id === 'theory-practical-70-30')
const marksB = {
  'comp-quiz': 10,
  'comp-midsem-30': 25,
  'comp-endsem-60': 50,
  'comp-lab-continuous': 40,
  'comp-viva-exam': 45
}
const resultB = calculateFinalSubjectMarks(schemeB, marksB)
assert(resultB.finalMarks === 85.0, `Scheme B Final Marks = 85.0 (Got: ${resultB.finalMarks})`)

// Case C: Custom 3-Category Scheme (Continuous 20%, Project 30%, End Exam 50%)
// Continuous: Quiz (15/20), Assignment (15/20) -> 30/40 = 75.0% * 0.20 = 15.0 pts
// Project: Report (25/30), Presentation (20/20) -> 45/50 = 90.0% * 0.30 = 27.0 pts
// End Exam: Final (80/100) -> 80.0% * 0.50 = 40.0 pts
// Final Marks = 15.0 + 27.0 + 40.0 = 82.0 / 100
const custom3CatScheme = {
  id: 'custom-3cat',
  name: '3-Category Modern CBCS',
  categories: [
    {
      id: 'cat-ca', name: 'Continuous Assessment', weight: 20,
      components: [
        { id: 'c-quiz', name: 'Quiz', maxMarks: 20 },
        { id: 'c-assign', name: 'Assignment', maxMarks: 20 }
      ]
    },
    {
      id: 'cat-proj', name: 'Project & Practical', weight: 30,
      components: [
        { id: 'c-report', name: 'Project Report', maxMarks: 30 },
        { id: 'c-pres', name: 'Project Presentation', maxMarks: 20 }
      ]
    },
    {
      id: 'cat-end', name: 'End Examination', weight: 50,
      components: [
        { id: 'c-end', name: 'Final Exam', maxMarks: 100 }
      ]
    }
  ]
}
const marksC = {
  'c-quiz': 15,
  'c-assign': 15,
  'c-report': 25,
  'c-pres': 20,
  'c-end': 80
}
const resultC = calculateFinalSubjectMarks(custom3CatScheme, marksC)
assert(resultC.finalMarks === 82.0, `Custom 3-Category Scheme Final Marks = 82.0 (Got: ${resultC.finalMarks})`)
assert(resultC.categoriesBreakdown.length === 3, 'Categories breakdown includes all 3 custom categories')
console.log('')

// ---------------------------------------------------------------------------
// TEST 4: Full Decoupled Pipeline (Evaluation Scheme -> Final Marks -> Grade -> SGPA)
// ---------------------------------------------------------------------------
console.log('--- 4. FULL DECOUPLED PIPELINE VERIFICATION ---')
// Student takes 2 subjects under Custom 3-Category Scheme:
// Subject 1 (4 credits): Final Marks = 82.0 -> UniGrade Default Grade A+ (GP 9) -> CreditPoints = 36.0
// Subject 2 (3 credits): Marks: Continuous (20/40=50%), Project (50/50=100%), End (90/100=90%)
//   S2 Final Marks = 50%*0.20 + 100%*0.30 + 90%*0.50 = 10.0 + 30.0 + 45.0 = 85.0 -> Grade A+ (GP 9) -> CreditPoints = 27.0
// Total Credits = 7; Total Points = 36 + 27 = 63; SGPA = 63 / 7 = 9.00
const marksS2 = {
  'c-quiz': 10,
  'c-assign': 10,
  'c-report': 30,
  'c-pres': 20,
  'c-end': 90
}
const s2Final = calculateFinalSubjectMarks(custom3CatScheme, marksS2).finalMarks
assert(s2Final === 85.0, `Subject 2 Final Marks = 85.0 (Got: ${s2Final})`)

const grade1 = resolveGrade(BUILT_IN_SYSTEMS[0], resultC.finalMarks)
const grade2 = resolveGrade(BUILT_IN_SYSTEMS[0], s2Final)

assert(grade1.grade === 'A+' && grade1.gradePoint === 9, 'Subject 1 resolves to A+ (GP 9)')
assert(grade2.grade === 'A+' && grade2.gradePoint === 9, 'Subject 2 resolves to A+ (GP 9)')

const totalCredits = 4 + 3
const totalCreditPoints = (4 * grade1.gradePoint) + (3 * grade2.gradePoint)
const sgpa = (totalCreditPoints / totalCredits).toFixed(2)
assert(sgpa === '9.00', `Pipeline Final SGPA = 9.00 (Got: ${sgpa})`)
console.log('')

// ---------------------------------------------------------------------------
// TEST 5: Boundary Gap Fix Verification
// ---------------------------------------------------------------------------
console.log('--- 5. BOUNDARY PRECISION FIX VERIFICATION ---')
const test89995 = resolveGrade(BUILT_IN_SYSTEMS[0], 89.995)
const test105 = resolveGrade(BUILT_IN_SYSTEMS[0], 105)
assert(test89995.grade === 'A+' && test89995.gradePoint === 9, `Mark 89.995 resolves to A+ (GP 9) [Got: ${test89995.grade}, GP ${test89995.gradePoint}]`)
assert(test105.grade === 'O' && test105.gradePoint === 10, `Mark 105.0 resolves to O (GP 10) [Got: ${test105.grade}, GP ${test105.gradePoint}]`)
console.log('')

console.log('=================================================================')
console.log(`  VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`)
console.log('=================================================================')
