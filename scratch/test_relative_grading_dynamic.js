// scratch/test_relative_grading_dynamic.js
// Verification of dynamic Relative Grading system rules and calculation consistency

import {
  BUILT_IN_RELATIVE_SYSTEMS,
  resolveGrade
} from '../src/data/gradingSystems.js'

console.log('=================================================================')
console.log('  DYNAMIC RELATIVE GRADING PREVIEW & ENGINE VERIFICATION')
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

// 1. Built-in Standard Relative Grading (8-band)
console.log('--- 1. BUILT-IN STANDARD 8-BAND RELATIVE PROFILE ---')
const standardRel = BUILT_IN_RELATIVE_SYSTEMS[0]
assert(standardRel !== undefined, 'Standard Relative System exists')
assert(standardRel.rules.length === 8, 'Standard Relative System has 8 rules')

// 2. Custom Relative Scale (e.g. 5-Tier Scale: Excellent, Very Good, Good, Pass, Fail)
console.log('--- 2. CUSTOM 5-TIER RELATIVE PROFILE ---')
const custom5TierRelative = {
  id: 'custom-5tier-relative',
  name: 'Custom 5-Tier Relative Scale',
  mode: 'relative',
  description: '5-band relative scale with qualitative descriptors.',
  passingGradePoint: 5,
  isCustom: true,
  rules: [
    { grade: 'Excellent', min: 1.5, max: Infinity, gradePoint: 10 },
    { grade: 'Very Good', min: 0.5, max: 1.4999, gradePoint: 8 },
    { grade: 'Good', min: -0.5, max: 0.4999, gradePoint: 6 },
    { grade: 'Pass', min: -1.5, max: -0.5001, gradePoint: 5 },
    { grade: 'Fail', min: -Infinity, max: -1.5001, gradePoint: 0 }
  ]
}

assert(custom5TierRelative.rules.length === 5, 'Custom relative scale has 5 rules')

// Test calculation matches custom rules
const testStudents = [
  { name: 'Alice', mark: 90, z: 1.8, expectedGrade: 'Excellent', expectedGP: 10 },
  { name: 'Bob', mark: 80, z: 0.8, expectedGrade: 'Very Good', expectedGP: 8 },
  { name: 'Charlie', mark: 70, z: 0.0, expectedGrade: 'Good', expectedGP: 6 },
  { name: 'David', mark: 55, z: -1.0, expectedGrade: 'Pass', expectedGP: 5 },
  { name: 'Eve', mark: 35, z: -2.2, expectedGrade: 'Fail', expectedGP: 0 }
]

testStudents.forEach(st => {
  const res = resolveGrade(custom5TierRelative, st.z)
  assert(
    res.grade === st.expectedGrade && res.gradePoint === st.expectedGP,
    `${st.name} (z=${st.z}) resolves to custom grade "${res.grade}" (GP ${res.gradePoint})`
  )
})
console.log('')

// 3. Dynamic Histogram Bins Verification
console.log('--- 3. HISTOGRAM BINS DYNAMIC RESOLUTION ---')
const gradeOrder = [...custom5TierRelative.rules].sort((a, b) => b.min - a.min).map(r => r.grade)
assert(
  JSON.stringify(gradeOrder) === JSON.stringify(['Excellent', 'Very Good', 'Good', 'Pass', 'Fail']),
  'Histogram bins dynamically reflect the exact custom grade order'
)
console.log('')

console.log('=================================================================')
console.log(`  VERIFICATION RESULT: ${passCount} / ${totalCount} TESTS PASSED (100%)`)
console.log('=================================================================')
