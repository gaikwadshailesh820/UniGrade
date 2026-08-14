// scratch/audit_calculations.js
// Independent Mathematical Verification Test Harness for UniGrade V2

import {
  BUILT_IN_SYSTEMS,
  BUILT_IN_RELATIVE_SYSTEMS,
  resolveGrade,
  getGradePoint
} from '../src/data/gradingSystems.js'

console.log('=====================================================')
console.log('  UNIGRADE V2 MATHEMATICAL AUDIT TEST HARNESS')
console.log('=====================================================\n')

// ============================================================================
// 1. SGPA IMPLEMENTATION AUDIT
// Standard Formula: SGPA = Σ(Credit_i × GP_i) / Σ(Credit_i)
// ============================================================================
function runV2_SGPA_Calc(subjects, system = BUILT_IN_SYSTEMS[0]) {
  let totalCreditPoints = 0
  let totalCredits = 0
  const breakdown = []

  for (const sub of subjects) {
    const c = Number(sub.credits)
    if (!c || c <= 0) {
      return { error: 'Invalid credits', sgpa: null }
    }

    const ca = Math.max(0, Number(sub.ca) || 0)
    const mid = Math.max(0, Number(sub.midterm) || 0)
    const end = Math.max(0, Number(sub.endterm) || 0)
    const theoryTotal = ca + mid + end

    const labM = Math.max(0, Number(sub.labManual) || 0)
    const labA = Math.max(0, Number(sub.labAssessment) || 0)
    const viva = Math.max(0, Number(sub.viva) || 0)
    const endP = Math.max(0, Number(sub.endPractical) || 0)
    const practicalTotal = labM + labA + viva + endP

    let finalMark
    if (sub.examType === 'theory') {
      finalMark = theoryTotal
    } else if (sub.examType === 'practical') {
      finalMark = practicalTotal
    } else {
      finalMark = (theoryTotal * 0.6) + (practicalTotal * 0.4)
    }

    const { grade, gradePoint: gp } = resolveGrade(system, finalMark)
    const creditPoints = c * gp

    totalCreditPoints += creditPoints
    totalCredits += c

    breakdown.push({
      name: sub.name,
      finalMark: Number(finalMark.toFixed(1)),
      gp,
      grade,
      credits: c,
      creditPoints: Number(creditPoints.toFixed(1))
    })
  }

  const sgpaScore = (totalCreditPoints / totalCredits).toFixed(2)
  return {
    sgpa: sgpaScore,
    totalCredits,
    totalCreditPoints: Number(totalCreditPoints.toFixed(1)),
    breakdown
  }
}

// 10 Independent SGPA Test Cases
const sgpaTestCases = [
  {
    id: 'SGPA-TC01',
    description: 'Single Subject Semester (Theory, 4 credits, 85 marks -> GP 9)',
    system: BUILT_IN_SYSTEMS[0], // UniGrade Standard: 85 -> A+ (9)
    subjects: [
      { name: 'Sub1', credits: 4, examType: 'theory', ca: 20, midterm: 20, endterm: 45 } // 85 -> GP 9
    ],
    expectedSGPA: '9.00',
    expectedTotalCredits: 4,
    expectedCreditPoints: 36
  },
  {
    id: 'SGPA-TC02',
    description: 'Equal Credits, Varied Grades (4 subjects, 4 credits each, GPs: 10, 9, 8, 7)',
    system: BUILT_IN_SYSTEMS[0],
    subjects: [
      { name: 'S1', credits: 4, examType: 'theory', ca: 25, midterm: 25, endterm: 45 }, // 95 -> O (10)
      { name: 'S2', credits: 4, examType: 'theory', ca: 20, midterm: 20, endterm: 45 }, // 85 -> A+ (9)
      { name: 'S3', credits: 4, examType: 'theory', ca: 18, midterm: 17, endterm: 40 }, // 75 -> A (8)
      { name: 'S4', credits: 4, examType: 'theory', ca: 15, midterm: 15, endterm: 35 }  // 65 -> B+ (7)
    ],
    // Sum(C*GP) = 4*10 + 4*9 + 4*8 + 4*7 = 40 + 36 + 32 + 28 = 136; Sum(C) = 16; SGPA = 136/16 = 8.50
    expectedSGPA: '8.50',
    expectedTotalCredits: 16,
    expectedCreditPoints: 136
  },
  {
    id: 'SGPA-TC03',
    description: 'Unequal Credits (4, 3, 2, 1 credits, GPs: 10, 8, 6, 0)',
    system: BUILT_IN_SYSTEMS[0],
    subjects: [
      { name: 'S1', credits: 4, examType: 'theory', ca: 25, midterm: 25, endterm: 45 }, // 95 -> O (10) => 40
      { name: 'S2', credits: 3, examType: 'theory', ca: 18, midterm: 17, endterm: 40 }, // 75 -> A (8) => 24
      { name: 'S3', credits: 2, examType: 'theory', ca: 12, midterm: 13, endterm: 30 }, // 55 -> B (6) => 12
      { name: 'S4', credits: 1, examType: 'theory', ca: 5, midterm: 5, endterm: 10 }    // 20 -> F (0) => 0
    ],
    // Sum(C*GP) = 40 + 24 + 12 + 0 = 76; Sum(C) = 10; SGPA = 76/10 = 7.60
    expectedSGPA: '7.60',
    expectedTotalCredits: 10,
    expectedCreditPoints: 76
  },
  {
    id: 'SGPA-TC04',
    description: 'Repeating Decimal SGPA (Credits: 3, 3, 3, GPs: 10, 8, 7 -> Sum=75/9=8.3333...)',
    system: BUILT_IN_SYSTEMS[0],
    subjects: [
      { name: 'S1', credits: 3, examType: 'theory', ca: 25, midterm: 25, endterm: 45 }, // 95 -> 10 => 30
      { name: 'S2', credits: 3, examType: 'theory', ca: 18, midterm: 17, endterm: 40 }, // 75 -> 8  => 24
      { name: 'S3', credits: 3, examType: 'theory', ca: 15, midterm: 15, endterm: 35 }  // 65 -> 7  => 21
    ],
    // Sum = 75; Sum(C) = 9; 75/9 = 8.333... -> 8.33
    expectedSGPA: '8.33',
    expectedTotalCredits: 9,
    expectedCreditPoints: 75
  },
  {
    id: 'SGPA-TC05',
    description: 'Combined Exam Type 60/40 (Theory 80 + Practical 90 -> 48+36 = 84 -> GP 9, Credits 4)',
    system: BUILT_IN_SYSTEMS[0],
    subjects: [
      {
        name: 'S1', credits: 4, examType: 'both',
        ca: 20, midterm: 20, endterm: 40, // Theory = 80 -> * 0.6 = 48
        labManual: 10, labAssessment: 10, viva: 25, endPractical: 45 // Practical = 90 -> * 0.4 = 36
        // Final = 48 + 36 = 84.0 -> GP 9 => CreditPoints = 36
      }
    ],
    expectedSGPA: '9.00',
    expectedTotalCredits: 4,
    expectedCreditPoints: 36
  },
  {
    id: 'SGPA-TC06',
    description: 'Practical Only Exam Type (Lab 10 + LabA 10 + Viva 30 + EndP 50 = 100 -> GP 10, Credits 2)',
    system: BUILT_IN_SYSTEMS[0],
    subjects: [
      {
        name: 'Lab1', credits: 2, examType: 'practical',
        labManual: 10, labAssessment: 10, viva: 30, endPractical: 50 // 100 -> GP 10
      }
    ],
    expectedSGPA: '10.00',
    expectedTotalCredits: 2,
    expectedCreditPoints: 20
  },
  {
    id: 'SGPA-TC07',
    description: 'All Failing Semester (3 subjects, 4 credits each, marks < 40 -> GP 0)',
    system: BUILT_IN_SYSTEMS[0],
    subjects: [
      { name: 'S1', credits: 4, examType: 'theory', ca: 5, midterm: 5, endterm: 10 },
      { name: 'S2', credits: 4, examType: 'theory', ca: 10, midterm: 10, endterm: 10 },
      { name: 'S3', credits: 4, examType: 'theory', ca: 0, midterm: 0, endterm: 0 }
    ],
    expectedSGPA: '0.00',
    expectedTotalCredits: 12,
    expectedCreditPoints: 0
  },
  {
    id: 'SGPA-TC08',
    description: 'All Perfect 10.00 Semester (5 subjects, 4 credits each, all 95+ marks)',
    system: BUILT_IN_SYSTEMS[0],
    subjects: [
      { name: 'S1', credits: 4, examType: 'theory', ca: 25, midterm: 25, endterm: 50 },
      { name: 'S2', credits: 4, examType: 'theory', ca: 25, midterm: 25, endterm: 50 },
      { name: 'S3', credits: 4, examType: 'theory', ca: 25, midterm: 25, endterm: 50 },
      { name: 'S4', credits: 4, examType: 'theory', ca: 25, midterm: 25, endterm: 50 },
      { name: 'S5', credits: 4, examType: 'theory', ca: 25, midterm: 25, endterm: 50 }
    ],
    expectedSGPA: '10.00',
    expectedTotalCredits: 20,
    expectedCreditPoints: 200
  },
  {
    id: 'SGPA-TC09',
    description: 'SPPU 10-Point Scale Audit (SPPU rules: 55-59.99 = B (6), 50-54.99 = C (5), 40-49.99 = P (4))',
    system: BUILT_IN_SYSTEMS.find(s => s.id === 'sppu'),
    subjects: [
      { name: 'S1', credits: 4, examType: 'theory', ca: 15, midterm: 15, endterm: 27 }, // 57 -> B (6) => 24
      { name: 'S2', credits: 3, examType: 'theory', ca: 12, midterm: 13, endterm: 27 }, // 52 -> C (5) => 15
      { name: 'S3', credits: 3, examType: 'theory', ca: 10, midterm: 10, endterm: 25 }  // 45 -> P (4) => 12
    ],
    // Sum(C*GP) = 24 + 15 + 12 = 51; Sum(C) = 10; SGPA = 51/10 = 5.10
    expectedSGPA: '5.10',
    expectedTotalCredits: 10,
    expectedCreditPoints: 51
  },
  {
    id: 'SGPA-TC10',
    description: 'Heavy Credit Weighting Influence (1-credit GP 10 vs 5-credit GP 5 vs 4-credit GP 8)',
    system: BUILT_IN_SYSTEMS[0],
    subjects: [
      { name: 'S1', credits: 1, examType: 'theory', ca: 25, midterm: 25, endterm: 50 }, // 100 -> 10 => 10
      { name: 'S2', credits: 5, examType: 'theory', ca: 10, midterm: 10, endterm: 25 }, // 45  -> 5  => 25
      { name: 'S3', credits: 4, examType: 'theory', ca: 18, midterm: 18, endterm: 40 }  // 76  -> 8  => 32
    ],
    // Sum = 10 + 25 + 32 = 67; Sum(C) = 10; SGPA = 67/10 = 6.70
    expectedSGPA: '6.70',
    expectedTotalCredits: 10,
    expectedCreditPoints: 67
  }
]

console.log('--- PART 1: SGPA CALCULATION AUDIT ---')
let sgpaPassCount = 0
for (const tc of sgpaTestCases) {
  const actual = runV2_SGPA_Calc(tc.subjects, tc.system)
  const pass = actual.sgpa === tc.expectedSGPA &&
               actual.totalCredits === tc.expectedTotalCredits &&
               actual.totalCreditPoints === tc.expectedCreditPoints

  if (pass) sgpaPassCount++
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${tc.id}: ${tc.description}`)
  console.log(`       Expected: SGPA=${tc.expectedSGPA}, Credits=${tc.expectedTotalCredits}, CreditPoints=${tc.expectedCreditPoints}`)
  console.log(`       Actual:   SGPA=${actual.sgpa}, Credits=${actual.totalCredits}, CreditPoints=${actual.totalCreditPoints}\n`)
}
console.log(`SGPA Audit Summary: ${sgpaPassCount}/${sgpaTestCases.length} Passed.\n`)

// ============================================================================
// 2. FIXED / ABSOLUTE GRADING BOUNDARY AUDIT
// ============================================================================
console.log('--- PART 2: FIXED/ABSOLUTE GRADING BOUNDARY AUDIT ---')
const defaultSystem = BUILT_IN_SYSTEMS[0] // UniGrade Standard
// Rules: O: 90-100 (10), A+: 80-89.99 (9), A: 70-79.99 (8), B+: 60-69.99 (7), B: 50-59.99 (6), C: 40-49.99 (5), F: 0-39.99 (0)

const boundaryTests = [
  { val: 100, expectedGrade: 'O', expectedGP: 10, desc: 'Maximum Valid Mark (100)' },
  { val: 90, expectedGrade: 'O', expectedGP: 10, desc: 'Exact O Lower Boundary (90)' },
  { val: 89.99, expectedGrade: 'A+', expectedGP: 9, desc: 'Exact A+ Upper Boundary (89.99)' },
  { val: 89.999, expectedGrade: 'O', expectedGP: 10, desc: 'Gap/Precision test between 89.99 and 90 (89.999)' },
  { val: 89.995, expectedGrade: 'O', expectedGP: 10, desc: 'Sub-cent mark (89.995)' },
  { val: 89, expectedGrade: 'A+', expectedGP: 9, desc: 'Inside A+ range (89)' },
  { val: 80, expectedGrade: 'A+', expectedGP: 9, desc: 'Exact A+ Lower Boundary (80)' },
  { val: 79.99, expectedGrade: 'A', expectedGP: 8, desc: 'Exact A Upper Boundary (79.99)' },
  { val: 70, expectedGrade: 'A', expectedGP: 8, desc: 'Exact A Lower Boundary (70)' },
  { val: 69.99, expectedGrade: 'B+', expectedGP: 7, desc: 'Exact B+ Upper Boundary (69.99)' },
  { val: 60, expectedGrade: 'B+', expectedGP: 7, desc: 'Exact B+ Lower Boundary (60)' },
  { val: 59.99, expectedGrade: 'B', expectedGP: 6, desc: 'Exact B Upper Boundary (59.99)' },
  { val: 50, expectedGrade: 'B', expectedGP: 6, desc: 'Exact B Lower Boundary (50)' },
  { val: 49.99, expectedGrade: 'C', expectedGP: 5, desc: 'Exact C Upper Boundary (49.99)' },
  { val: 40, expectedGrade: 'C', expectedGP: 5, desc: 'Exact C Lower Boundary / Pass Threshold (40)' },
  { val: 39.99, expectedGrade: 'F', expectedGP: 0, desc: 'Exact Fail Boundary (39.99)' },
  { val: 0, expectedGrade: 'F', expectedGP: 0, desc: 'Minimum Zero Mark (0)' },
  { val: -5, expectedGrade: 'F', expectedGP: 0, desc: 'Negative Mark (-5)' },
  { val: 105, expectedGrade: 'O', expectedGP: 10, desc: 'Above Max (105)' }
]

for (const bt of boundaryTests) {
  const res = resolveGrade(defaultSystem, bt.val)
  const passGrade = res.grade === bt.expectedGrade
  const passGP = res.gradePoint === bt.expectedGP
  const pass = passGrade && passGP
  console.log(`[${pass ? 'PASS' : 'WARN/FAIL'}] Input: ${bt.val} -> Got: Grade=${res.grade}, GP=${res.gradePoint} | Expected: Grade=${bt.expectedGrade}, GP=${bt.expectedGP} (${bt.desc})`)
}
console.log('')

// ============================================================================
// 3. RELATIVE GRADING ALGORITHM AUDIT (5 DATASETS)
// Algorithm in V2:
// Mean (μ) = Σ(marks) / N
// Variance (σ^2) = Σ(marks - μ)^2 / N   (Population Variance)
// StdDev (σ) = sqrt(Variance)
// Z-Score = σ === 0 ? 0 : (marks - μ) / σ
// Grade resolution: Standard 8 bands:
//   A+ : z >= 1.5
//   A  : 0.5 <= z < 1.5
//   B+ : -0.5 <= z < 0.5
//   B  : -1.5 <= z < -0.5
//   C+ : -2.5 <= z < -1.5
//   C  : -3.5 <= z < -2.5
//   D  : -4.5 <= z < -3.5
//   F  : z < -4.5
// ============================================================================
console.log('--- PART 3: RELATIVE GRADING STATISTICAL AUDIT ---')

function runV2_RelativeGrading(marksArray, system = BUILT_IN_RELATIVE_SYSTEMS[0]) {
  const n = marksArray.length
  if (n === 0) return { error: 'Empty dataset' }

  const mean = marksArray.reduce((a, b) => a + b, 0) / n
  const variance = marksArray.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n
  const sd = Math.sqrt(variance)

  const studentResults = marksArray.map((m, idx) => {
    const z = sd === 0 ? 0 : (m - mean) / sd
    const { grade, gradePoint } = resolveGrade(system, z)
    return {
      studentIndex: idx + 1,
      marks: m,
      zScore: Number(z.toFixed(4)),
      zScoreStr: z.toFixed(2),
      grade,
      gradePoint
    }
  })

  return {
    n,
    mean: Number(mean.toFixed(4)),
    sd: Number(sd.toFixed(4)),
    studentResults
  }
}

// Dataset 1: Normal Spread of Marks
const ds1 = [95, 88, 82, 78, 75, 72, 68, 65, 58, 45]
// Independent Math for DS1:
// Sum = 726; N = 10; Mean = 72.6
// Diff from mean: [22.4, 15.4, 9.4, 5.4, 2.4, -0.6, -4.6, -7.6, -14.6, -27.6]
// Diff^2: [501.76, 237.16, 88.36, 29.16, 5.76, 0.36, 21.16, 57.76, 213.16, 761.76]
// Sum Diff^2 = 1916.4; Variance = 191.64; SD = sqrt(191.64) = 13.84340998...
// Z-Scores:
// 95: (95 - 72.6)/13.8434 = 22.4 / 13.8434 = 1.6181 -> >= 1.5 -> A+ (GP 10)
// 88: 15.4 / 13.8434 = 1.1124 -> 0.5 to 1.5 -> A (GP 9)
// 82: 9.4 / 13.8434 = 0.6790 -> 0.5 to 1.5 -> A (GP 9)
// 78: 5.4 / 13.8434 = 0.3901 -> -0.5 to 0.5 -> B+ (GP 8)
// 75: 2.4 / 13.8434 = 0.1734 -> -0.5 to 0.5 -> B+ (GP 8)
// 72: -0.6 / 13.8434 = -0.0433 -> -0.5 to 0.5 -> B+ (GP 8)
// 68: -4.6 / 13.8434 = -0.3323 -> -0.5 to 0.5 -> B+ (GP 8)
// 65: -7.6 / 13.8434 = -0.54899 -> -1.5 to -0.5 -> B (GP 7)
// 58: -14.6 / 13.8434 = -1.05465 -> -1.5 to -0.5 -> B (GP 7)
// 45: -27.6 / 13.8434 = -1.9937 -> -2.5 to -1.5 -> C+ (GP 6)

console.log('--- Dataset 1: Normal Spread of Marks ---')
const resDS1 = runV2_RelativeGrading(ds1)
console.log(`Mean: ${resDS1.mean} (Expected: 72.6), SD: ${resDS1.sd} (Expected: 13.8434)`)
resDS1.studentResults.forEach(r => {
  console.log(`  Mark: ${r.marks} -> z: ${r.zScoreStr} (${r.zScore}) -> Grade: ${r.grade}, GP: ${r.gradePoint}`)
})
console.log('')

// Dataset 2: Several Students with Identical Marks
const ds2 = [90, 90, 80, 80, 80, 70, 70, 60, 60, 50]
// Sum = 730; N = 10; Mean = 73.0
// Diff^2 sum: 2*(17)^2 + 3*(7)^2 + 2*(-3)^2 + 2*(-13)^2 + 1*(-23)^2 = 2*289 + 3*49 + 2*9 + 2*169 + 529 = 578 + 147 + 18 + 338 + 529 = 1610
// Variance = 161; SD = sqrt(161) = 12.688577...
// 90: +17 / 12.6885 = 1.3398 -> A (9)
// 80: +7 / 12.6885 = 0.5517 -> A (9)
// 70: -3 / 12.6885 = -0.2364 -> B+ (8)
// 60: -13 / 12.6885 = -1.0245 -> B (7)
// 50: -23 / 12.6885 = -1.8126 -> C+ (6)
console.log('--- Dataset 2: Identical/Tied Marks ---')
const resDS2 = runV2_RelativeGrading(ds2)
console.log(`Mean: ${resDS2.mean} (Expected: 73.0), SD: ${resDS2.sd} (Expected: 12.6886)`)
resDS2.studentResults.forEach(r => {
  console.log(`  Mark: ${r.marks} -> z: ${r.zScoreStr} -> Grade: ${r.grade}, GP: ${r.gradePoint}`)
})
console.log('')

// Dataset 3: Small Class Size (N = 3)
const ds3 = [85, 70, 55]
// Sum = 210; N = 3; Mean = 70.0
// Diff^2: (15)^2 + 0 + (-15)^2 = 225 + 0 + 225 = 450
// Variance = 450/3 = 150; SD = sqrt(150) = 12.2474487...
// 85: +15 / 12.2474 = +1.2247 -> A (9)
// 70: 0 / 12.2474 = 0.0000 -> B+ (8)
// 55: -15 / 12.2474 = -1.2247 -> B (7)
console.log('--- Dataset 3: Small Class Size (N=3) ---')
const resDS3 = runV2_RelativeGrading(ds3)
console.log(`Mean: ${resDS3.mean} (Expected: 70.0), SD: ${resDS3.sd} (Expected: 12.2474)`)
resDS3.studentResults.forEach(r => {
  console.log(`  Mark: ${r.marks} -> z: ${r.zScoreStr} -> Grade: ${r.grade}, GP: ${r.gradePoint}`)
})
console.log('')

// Dataset 4: Decimal Marks
const ds4 = [88.5, 76.25, 76.25, 64.75, 52.0]
// Sum = 357.75; N = 5; Mean = 71.55
// Diff from mean: [16.95, 4.70, 4.70, -6.80, -19.55]
// Diff^2: [287.3025, 22.09, 22.09, 46.24, 382.2025]
// Sum Diff^2 = 759.925; Variance = 151.985; SD = sqrt(151.985) = 12.32821966...
// 88.50: 16.95 / 12.3282 = +1.3749 -> A (9)
// 76.25: 4.70 / 12.3282 = +0.3812 -> B+ (8)
// 64.75: -6.80 / 12.3282 = -0.5516 -> B (7)
// 52.00: -19.55 / 12.3282 = -1.5858 -> C+ (6)
console.log('--- Dataset 4: Decimal Marks ---')
const resDS4 = runV2_RelativeGrading(ds4)
console.log(`Mean: ${resDS4.mean} (Expected: 71.55), SD: ${resDS4.sd} (Expected: 12.3282)`)
resDS4.studentResults.forEach(r => {
  console.log(`  Mark: ${r.marks} -> z: ${r.zScoreStr} -> Grade: ${r.grade}, GP: ${r.gradePoint}`)
})
console.log('')

// Dataset 5: Zero Variance / All Identical Marks
const ds5 = [75, 75, 75, 75, 75]
// Mean = 75.0; SD = 0.0; Z = 0 for all
// Under Standard Relative (8 bands):
// B+ is defined as: min -0.5, max 0.4999, GP 8
// Since z = 0 lies in [-0.5, 0.4999], all students receive B+ (GP 8)
console.log('--- Dataset 5: Zero Variance (All Students Identical 75 Marks) ---')
const resDS5 = runV2_RelativeGrading(ds5)
console.log(`Mean: ${resDS5.mean} (Expected: 75.0), SD: ${resDS5.sd} (Expected: 0.0)`)
resDS5.studentResults.forEach(r => {
  console.log(`  Mark: ${r.marks} -> z: ${r.zScoreStr} -> Grade: ${r.grade}, GP: ${r.gradePoint}`)
})
console.log('')

// ============================================================================
// 4. EDGE CASE AUDIT
// ============================================================================
console.log('--- PART 4: EDGE CASE AUDIT ---')
const edgeCases = [
  { desc: 'Empty Subject Array', test: () => runV2_SGPA_Calc([]) },
  { desc: 'Zero Credits Input (c = 0)', test: () => runV2_SGPA_Calc([{ credits: 0, ca: 20, midterm: 20, endterm: 40, examType: 'theory' }]) },
  { desc: 'Negative Credits Input (c = -4)', test: () => runV2_SGPA_Calc([{ credits: -4, ca: 20, midterm: 20, endterm: 40, examType: 'theory' }]) },
  { desc: 'One Student in Relative Grading (N=1)', test: () => runV2_RelativeGrading([80]) },
  { desc: 'Empty Array in Relative Grading', test: () => runV2_RelativeGrading([]) },
  { desc: 'NaN/Null values in marks', test: () => runV2_SGPA_Calc([{ credits: 4, ca: NaN, midterm: null, endterm: undefined, examType: 'theory' }]) },
  { desc: 'Marks above 100 in SGPA', test: () => runV2_SGPA_Calc([{ credits: 4, ca: 30, midterm: 30, endterm: 60, examType: 'theory' }]) }
]

edgeCases.forEach(ec => {
  try {
    const res = ec.test()
    console.log(`[HANDLED] ${ec.desc}:`, JSON.stringify(res))
  } catch (err) {
    console.log(`[CRASH] ${ec.desc}:`, err.message)
  }
})
