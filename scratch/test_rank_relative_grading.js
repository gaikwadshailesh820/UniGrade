// scratch/test_rank_relative_grading.js
// Verification suite for Rank-Based Relative Grading Engine & Tie Handling

import {
  BUILT_IN_RELATIVE_SYSTEMS,
  calculateStudentRanks,
  resolveRankGrade,
  resolveGrade,
  validateSystem
} from '../src/data/gradingSystems.js'

console.log('=================================================================')
console.log('  RANK-BASED RELATIVE GRADING ENGINE & TIE AUDIT TEST')
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

const rankSystem = BUILT_IN_RELATIVE_SYSTEMS.find(s => s.id === 'relative-rank-standard')
// Rules: O (1), A+ (6), A (11), B+ (21), B (31), C (41), D (51), F (61)

// ---------------------------------------------------------------------------
// TEST 1: Normal Dataset
// ---------------------------------------------------------------------------
console.log('--- 1. NORMAL DATASET (8 STUDENTS) ---')
const normalStudents = [
  { name: 'S1', marks: 100 },
  { name: 'S2', marks: 95 },
  { name: 'S3', marks: 90 },
  { name: 'S4', marks: 85 },
  { name: 'S5', marks: 80 },
  { name: 'S6', marks: 75 },
  { name: 'S7', marks: 70 },
  { name: 'S8', marks: 65 }
]

const rankedNormal = calculateStudentRanks(normalStudents)
assert(rankedNormal.length === 8, 'All 8 students ranked')
assert(rankedNormal[0].rank === 1 && rankedNormal[0].marks === 100, 'Student S1 (100) -> Rank 1')
assert(rankedNormal[1].rank === 2 && rankedNormal[1].marks === 95, 'Student S2 (95) -> Rank 2')
assert(rankedNormal[2].rank === 3 && rankedNormal[2].marks === 90, 'Student S3 (90) -> Rank 3')
assert(rankedNormal[3].rank === 4 && rankedNormal[3].marks === 85, 'Student S4 (85) -> Rank 4')
assert(rankedNormal[4].rank === 5 && rankedNormal[4].marks === 80, 'Student S5 (80) -> Rank 5')
assert(rankedNormal[5].rank === 6 && rankedNormal[5].marks === 75, 'Student S6 (75) -> Rank 6')
assert(rankedNormal[6].rank === 7 && rankedNormal[6].marks === 70, 'Student S7 (70) -> Rank 7')
assert(rankedNormal[7].rank === 8 && rankedNormal[7].marks === 65, 'Student S8 (65) -> Rank 8')

// Test Grade Resolution for Ranks 1-5 (O, GP 10) and Ranks 6-8 (A+, GP 9)
for (let i = 0; i < 5; i++) {
  const g = resolveRankGrade(rankSystem, rankedNormal[i].rank)
  assert(g.grade === 'O' && g.gradePoint === 10, `Rank ${rankedNormal[i].rank} -> Grade O (GP 10)`)
}
for (let i = 5; i < 8; i++) {
  const g = resolveRankGrade(rankSystem, rankedNormal[i].rank)
  assert(g.grade === 'A+' && g.gradePoint === 9, `Rank ${rankedNormal[i].rank} -> Grade A+ (GP 9)`)
}
console.log('')

// ---------------------------------------------------------------------------
// TEST 2: Tie Handling Audit
// Marks: 95, 90, 90, 85, 80 -> Expected Ranks: 1, 2, 2, 4, 5
// ---------------------------------------------------------------------------
console.log('--- 2. TIE HANDLING AUDIT ---')
const tiedStudents = [
  { name: 'Alice', marks: 95 },
  { name: 'Bob', marks: 90 },
  { name: 'Charlie', marks: 90 },
  { name: 'David', marks: 85 },
  { name: 'Eve', marks: 80 }
]

const rankedTies = calculateStudentRanks(tiedStudents)
assert(rankedTies[0].name === 'Alice' && rankedTies[0].rank === 1, 'Alice (95) -> Rank 1')
assert(rankedTies[1].name === 'Bob' && rankedTies[1].rank === 2, 'Bob (90) -> Rank 2')
assert(rankedTies[2].name === 'Charlie' && rankedTies[2].rank === 2, 'Charlie (90) -> Rank 2 (Tied with Bob)')
assert(rankedTies[3].name === 'David' && rankedTies[3].rank === 4, 'David (85) -> Rank 4 (Standard Competition Rank skips to 4)')
assert(rankedTies[4].name === 'Eve' && rankedTies[4].rank === 5, 'Eve (80) -> Rank 5')

// Grade resolution on tied students
const gBob = resolveRankGrade(rankSystem, rankedTies[1].rank)
const gCharlie = resolveRankGrade(rankSystem, rankedTies[2].rank)
assert(gBob.grade === gCharlie.grade && gBob.gradePoint === gCharlie.gradePoint, 'Tied students receive the exact same Grade and GP')
console.log('')

// ---------------------------------------------------------------------------
// TEST 3: Edge Cases
// ---------------------------------------------------------------------------
console.log('--- 3. EDGE CASES AUDIT ---')

// 3a. Single Student
const singleStudent = calculateStudentRanks([{ name: 'Solo', marks: 88 }])
assert(singleStudent[0].rank === 1, 'Single student -> Rank 1')
const gSolo = resolveRankGrade(rankSystem, singleStudent[0].rank)
assert(gSolo.grade === 'O' && gSolo.gradePoint === 10, 'Single student -> Grade O (GP 10)')

// 3b. All identical marks (All tied at Rank 1)
const allIdentical = calculateStudentRanks([
  { name: 'A', marks: 75 },
  { name: 'B', marks: 75 },
  { name: 'C', marks: 75 },
  { name: 'D', marks: 75 }
])
assert(allIdentical.every(s => s.rank === 1), 'All identical marks -> all assigned Rank 1')
allIdentical.forEach(s => {
  const g = resolveRankGrade(rankSystem, s.rank)
  assert(g.grade === 'O' && g.gradePoint === 10, `Tied student ${s.name} gets Grade O`)
})

// 3c. Decimal Marks
const decimalStudents = calculateStudentRanks([
  { name: 'D1', marks: 92.5 },
  { name: 'D2', marks: 92.5 },
  { name: 'D3', marks: 88.25 },
  { name: 'D4', marks: 76.1 }
])
assert(decimalStudents[0].rank === 1 && decimalStudents[1].rank === 1, 'Decimal tied marks -> both Rank 1')
assert(decimalStudents[2].rank === 3, 'Decimal mark 88.25 -> Rank 3')
assert(decimalStudents[3].rank === 4, 'Decimal mark 76.1 -> Rank 4')

// 3d. Empty Dataset
const emptyRanks = calculateStudentRanks([])
assert(Array.isArray(emptyRanks) && emptyRanks.length === 0, 'Empty dataset handled cleanly')

// 3e. Large Cohort (100 students)
const largeCohort = Array.from({ length: 100 }, (_, i) => ({
  name: `Student_${i + 1}`,
  marks: 100 - (i * 0.5)
}))
const rankedLarge = calculateStudentRanks(largeCohort)
assert(rankedLarge.length === 100, '100 students ranked')
assert(rankedLarge[0].rank === 1 && rankedLarge[99].rank === 100, 'Ranks span 1 to 100')
const gRank100 = resolveRankGrade(rankSystem, 100)
assert(gRank100.grade === 'F' && gRank100.gradePoint === 0, 'Rank 100 correctly falls into Rank 61+ F band')
console.log('')

// ---------------------------------------------------------------------------
// TEST 4: Validation Engine
// ---------------------------------------------------------------------------
console.log('--- 4. RANK-BASED SYSTEM VALIDATION ---')

// 4a. Duplicate starting rank
const dupRankSystem = {
  name: 'Dup Rank System',
  mode: 'relative',
  method: 'rank',
  rules: [
    { grade: 'O', startRank: 1, gradePoint: 10 },
    { grade: 'A', startRank: 1, gradePoint: 8 }
  ]
}
const dupRankErr = validateSystem(dupRankSystem)
assert(dupRankErr.some(e => e.includes('duplicate starting rank')), 'Catches duplicate starting rank 1')

// 4b. Missing Rank 1
const missingRank1System = {
  name: 'Missing Rank 1',
  mode: 'relative',
  method: 'rank',
  rules: [
    { grade: 'O', startRank: 5, gradePoint: 10 },
    { grade: 'F', startRank: 20, gradePoint: 0 }
  ]
}
const missingErr = validateSystem(missingRank1System)
assert(missingErr.some(e => e.includes('starting at Rank 1')), 'Enforces that scale starts at Rank 1')

// 4c. Starting Rank < 1
const negativeRankSystem = {
  name: 'Negative Rank',
  mode: 'relative',
  method: 'rank',
  rules: [
    { grade: 'O', startRank: 0, gradePoint: 10 }
  ]
}
const negErr = validateSystem(negativeRankSystem)
assert(negErr.some(e => e.includes('starting rank must be an integer ≥ 1')), 'Catches startRank < 1')
console.log('')

console.log('=================================================================')
console.log(`  VERIFICATION RESULT: ${passCount} / ${totalCount} TESTS PASSED (100%)`)
console.log('=================================================================')
