import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore'
import { useGradingSystems } from '../../hooks/useGradingSystems'
import { calculateStudentRanks, resolveRankGrade } from '../../data/gradingSystems'

function RelativeGrading() {
  const { user } = useAuth()
  const {
    activeRelative,
    relativeSystems,
    selectActiveRelative,
    resolveGrade
  } = useGradingSystems()

  const [records, setRecords] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [gradedResults, setGradedResults] = useState([])
  const [stats, setStats] = useState(null)
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load faculty records for subject/batch dropdowns
  useEffect(() => {
    async function fetchFacultyRecords() {
      if (!user) return

      try {
        setLoading(true)
        const q = query(
          collection(db, 'records'),
          where('facultyId', '==', user.uid)
        )
        const snapshot = await getDocs(q)
        const recs = []
        snapshot.forEach(d => {
          recs.push({ id: d.id, ...d.data() })
        })
        setRecords(recs)
      } catch (err) {
        console.error('Error loading records for grading:', err)
        setAlert({ type: 'error', message: `⚠️ ${err.message}` })
      } finally {
        setLoading(false)
      }
    }

    fetchFacultyRecords()
  }, [user])

  const uniqueSubjects = useMemo(() => {
    return [...new Set(records.map(r => r.subject).filter(Boolean))]
  }, [records])

  const uniqueBatches = useMemo(() => {
    return [...new Set(records.map(r => r.batch).filter(Boolean))]
  }, [records])

  const currentMethod = activeRelative?.method || 'rank'

  // Relative Grading Calculation Engine (Rank-Based or Z-Score)
  const handleGenerateGrades = () => {
    setAlert(null)

    if (!selectedSubject) {
      setAlert({ type: 'error', message: '⚠️ Please select a Subject.' })
      return
    }

    if (!selectedBatch) {
      setAlert({ type: 'error', message: '⚠️ Please select a Batch.' })
      return
    }

    const filtered = records.filter(
      r => r.subject === selectedSubject && r.batch === selectedBatch
    )

    if (filtered.length === 0) {
      setAlert({ type: 'error', message: '⚠️ No student records found for the selected Subject and Batch.' })
      return
    }

    const markValues = filtered.map(r => Number(r.marks) || 0)
    const n = markValues.length
    const mean = markValues.reduce((a, b) => a + b, 0) / n
    const highest = Math.max(...markValues).toFixed(1)
    const lowest = Math.min(...markValues).toFixed(1)

    let results

    if (currentMethod === 'rank') {
      // ── METHOD 1: RANK-BASED RELATIVE GRADING ─────────────
      // 1. Calculate Standard Competition Ranks with exact tie handling (1224 ranking)
      const rankedStudents = calculateStudentRanks(filtered)

      // 2. Map ranks to configured starting-rank grade rules
      results = rankedStudents.map(r => {
        const mark = Number(r.marks) || 0
        const { grade, gradePoint } = resolveRankGrade(activeRelative, r.rank)
        const creds = Number(r.credits) || 4
        const creditPoints = gradePoint * creds

        return {
          ...r,
          marks: mark,
          rank: r.rank,
          credits: creds,
          creditPoints,
          grade,
          gradePoint
        }
      })
    } else {
      // ── METHOD 2: STATISTICAL Z-SCORE RELATIVE GRADING ──
      const variance = markValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n
      const sd = Math.sqrt(variance)

      const rankedStudents = calculateStudentRanks(filtered)

      results = rankedStudents.map(r => {
        const mark = Number(r.marks) || 0
        const z = sd === 0 ? 0 : (mark - mean) / sd
        const { grade, gradePoint } = resolveGrade(activeRelative, z)
        const creds = Number(r.credits) || 4
        const creditPoints = gradePoint * creds

        return {
          ...r,
          marks: mark,
          rank: r.rank,
          credits: creds,
          creditPoints,
          grade,
          gradePoint,
          zScore: z.toFixed(2)
        }
      })
    }

    // Sort descending by marks / rank
    results.sort((a, b) => a.rank - b.rank)
    setGradedResults(results)

    // Grade frequencies according to active system's configured rules order
    const gradeOrder = [...(activeRelative?.rules || [])]
      .sort((a, b) => {
        const startA = Number(a.startRank !== undefined ? a.startRank : a.min) || 0
        const startB = Number(b.startRank !== undefined ? b.startRank : b.min) || 0
        return currentMethod === 'rank' ? startA - startB : startB - startA
      })
      .map(r => r.grade)

    const gradeCounts = {}
    gradeOrder.forEach(g => { gradeCounts[g] = 0 })
    results.forEach(r => {
      gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1
    })

    setStats({
      mean: mean.toFixed(1),
      sd: currentMethod === 'z-score' ? (Math.sqrt(markValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n)).toFixed(1) : null,
      highest,
      lowest,
      gradeCounts,
      totalStudents: results.length
    })

    setAlert({
      type: 'success',
      message: `✅ Generated ${currentMethod === 'rank' ? 'Rank-Based' : 'Z-Score'} relative grades for ${results.length} students across ${gradeOrder.length} grade bands!`
    })
  }

  // Save to Firestore gradedRecords
  const handleSaveGrades = async () => {
    if (gradedResults.length === 0 || !user) return

    try {
      setSaving(true)
      const first = gradedResults[0]
      const formattedDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      })

      // Delete previous gradedRecords for this batch
      const oldQuery = query(
        collection(db, 'gradedRecords'),
        where('facultyId', '==', user.uid),
        where('subject', '==', first.subject),
        where('batch', '==', first.batch)
      )

      const oldDocs = await getDocs(oldQuery)
      for (const d of oldDocs.docs) {
        await deleteDoc(d.ref)
      }

      // Add new graded records with calculated ranks
      for (const r of gradedResults) {
        await addDoc(collection(db, 'gradedRecords'), {
          rollNo: r.rollNo,
          name: r.name,
          subject: r.subject,
          subjectCode: r.subjectCode || '',
          batch: r.batch,
          semester: r.semester || '',
          academicYear: r.academicYear || '',
          examType: r.examType || 'theory',
          marks: r.marks,
          rank: r.rank,
          grade: r.grade,
          gradePoint: r.gradePoint,
          credits: r.credits,
          creditPoints: r.creditPoints,
          zScore: r.zScore || null,
          method: currentMethod,
          facultyId: user.uid,
          facultyEmail: user.email,
          gradedOn: formattedDate
        })
      }

      setAlert({
        type: 'success',
        message: '💾 Relative grades saved to database! Institution can now generate final batch SGPA.'
      })
    } catch (err) {
      console.error('Error saving relative grades:', err)
      setAlert({ type: 'error', message: `⚠️ ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (gradedResults.length === 0) return

    const headers = currentMethod === 'rank'
      ? ['Rank', 'Roll No', 'Student Name', 'Batch', 'Subject', 'Marks', 'Grade', 'Grade Point', 'Credits', 'Credit Points']
      : ['Rank', 'Roll No', 'Student Name', 'Batch', 'Subject', 'Marks', 'Grade', 'Grade Point', 'Credits', 'Credit Points', 'Z-Score']

    const rows = gradedResults.map(r => {
      const base = [r.rank, r.rollNo, r.name, r.batch, r.subject, r.marks, r.grade, r.gradePoint, r.credits, r.creditPoints]
      if (currentMethod === 'z-score') base.push(r.zScore || '—')
      return base
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `UniGrade_RelativeGrades_${selectedSubject}_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const palette = ['#7c3aed', '#059669', '#2563eb', '#0891b2', '#0ea5e9', '#d97706', '#f97316', '#dc2626']

  // Helper to format rank range display from sorted start ranks
  const getRankRangeText = (rules, currentRuleIndex) => {
    const sorted = [...rules].sort((a, b) => {
      const startA = Number(a.startRank !== undefined ? a.startRank : a.min) || 1
      const startB = Number(b.startRank !== undefined ? b.startRank : b.min) || 1
      return startA - startB
    })

    const rule = sorted[currentRuleIndex]
    const start = Number(rule.startRank !== undefined ? rule.startRank : rule.min) || 1
    const nextRule = sorted[currentRuleIndex + 1]

    if (nextRule) {
      const nextStart = Number(nextRule.startRank !== undefined ? nextRule.startRank : nextRule.min) || 1
      const end = nextStart - 1
      return end >= start ? `Rank ${start}–${end}` : `Rank ${start}`
    }
    return `Rank ${start}+ (Remaining)`
  }

  return (
    <main className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: 32 }} className="fade-up">
        <span className="page-badge">FACULTY PORTAL</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: '8px 0 6px' }}>
          📐 Relative Grading Engine
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Evaluate cohort performance using configurable <strong>Rank-Based</strong> grade bands or statistical distribution models.
        </p>
      </div>

      {/* Dynamic Relative Grading System Preview */}
      {!activeRelative || !Array.isArray(activeRelative.rules) || activeRelative.rules.length === 0 ? (
        <div className="card fade-up empty-state" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="empty-icon">📐</div>
          <h3>No grading system selected</h3>
          <p>Select or create a relative grading system to view its rules and rank thresholds.</p>
          <div style={{ marginTop: 14 }}>
            <Link to="/grading-systems" className="btn-primary" style={{ width: 'auto' }}>
              Select Grading System →
            </Link>
          </div>
        </div>
      ) : (
        <div className="card fade-up" style={{ borderLeft: '4px solid var(--primary-mid)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: 0 }}>
                  📐 Current Grading System: {activeRelative.name}
                </h3>
                <span className={`badge ${activeRelative.isCustom ? 'badge-purple' : 'badge-blue'}`}>
                  {activeRelative.isCustom ? 'Custom' : 'Standard'}
                </span>
                <span className="badge badge-green">
                  Method: {currentMethod === 'rank' ? 'Rank-Based' : 'Z-Score'}
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                {activeRelative.description || (currentMethod === 'rank'
                  ? 'Grades are assigned based on student class rank standing. Tied marks receive the exact same rank.'
                  : 'Grades are assigned based on standard deviations (Z-Scores) from the class mean.')}
              </p>
            </div>
            <Link to="/grading-systems" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-mid)', textDecoration: 'none' }}>
              ⚙️ Manage Profiles →
            </Link>
          </div>

          {/* Dynamic Rule Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 14 }}>
            {currentMethod === 'rank'
              ? (
                // Rank-Based Rule Display (Sorted ascending by start rank)
                [...activeRelative.rules]
                  .sort((a, b) => {
                    const startA = Number(a.startRank !== undefined ? a.startRank : a.min) || 1
                    const startB = Number(b.startRank !== undefined ? b.startRank : b.min) || 1
                    return startA - startB
                  })
                  .map((rule, idx, arr) => {
                    const color = palette[idx % palette.length]
                    const rangeText = getRankRangeText(arr, idx)
                    const isPassing = (rule.gradePoint ?? 0) >= (activeRelative.passingGradePoint ?? 4)

                    return (
                      <div
                        key={idx}
                        style={{
                          background: `${color}10`,
                          border: `1px solid ${color}30`,
                          borderRadius: 12,
                          padding: '12px 10px',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: 20, fontWeight: 800, color }}>
                          {rule.grade}
                        </div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', margin: '3px 0' }}>
                          <code>{rangeText}</code>
                        </div>
                        <div style={{ fontSize: 11, color, fontWeight: 600 }}>
                          GP: {rule.gradePoint}
                        </div>
                        <div style={{ fontSize: 10, color: isPassing ? '#059669' : '#dc2626', fontWeight: 600, marginTop: 2 }}>
                          {isPassing ? 'Pass' : 'Fail'}
                        </div>
                      </div>
                    )
                  })
              )
              : (
                // Z-Score Rule Display
                [...activeRelative.rules]
                  .sort((a, b) => b.min - a.min)
                  .map((rule, idx) => {
                    const color = palette[idx % palette.length]
                    let zRange
                    if (rule.min === -Infinity) zRange = `z < ${rule.max ?? '-4.5'}`
                    else if (rule.max === Infinity || rule.max === undefined || rule.max === null) zRange = `z ≥ ${rule.min}`
                    else zRange = `${rule.min} ≤ z < ${rule.max}`

                    const isPassing = (rule.gradePoint ?? 0) >= (activeRelative.passingGradePoint ?? 4)

                    return (
                      <div
                        key={idx}
                        style={{
                          background: `${color}10`,
                          border: `1px solid ${color}30`,
                          borderRadius: 12,
                          padding: '12px 10px',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: 19, fontWeight: 800, color }}>
                          {rule.grade}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', margin: '3px 0' }}>
                          <code>{zRange}</code>
                        </div>
                        <div style={{ fontSize: 11, color, fontWeight: 600 }}>
                          GP: {rule.gradePoint}
                        </div>
                        <div style={{ fontSize: 10, color: isPassing ? '#059669' : '#dc2626', fontWeight: 600, marginTop: 2 }}>
                          {isPassing ? 'Pass' : 'Fail'}
                        </div>
                      </div>
                    )
                  })
              )}
          </div>
        </div>
      )}

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Controls Card */}
      <div className="card fade-up">
        <h3 style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, margin: '0 0 18px' }}>
          ⚙️ Grading Settings
        </h3>

        <div className="two-col">
          <div>
            <label htmlFor="relSubject">Subject Filter *</label>
            <select
              id="relSubject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Select Subject</option>
              {uniqueSubjects.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="relBatch">Batch Filter *</label>
            <select
              id="relBatch"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="">Select Batch</option>
              {uniqueBatches.map((b, i) => (
                <option key={i} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label htmlFor="relProfile" style={{ margin: 0 }}>Active Relative Grading Profile</label>
            <Link to="/grading-systems" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-mid)', textDecoration: 'none' }}>
              + Manage / Build Custom Profile →
            </Link>
          </div>
          <select
            id="relProfile"
            value={activeRelative?.id || 'relative-rank-standard'}
            onChange={(e) => selectActiveRelative(e.target.value)}
          >
            {relativeSystems.map(sys => (
              <option key={sys.id} value={sys.id}>
                {sys.name} [{sys.method === 'rank' ? 'Rank-Based' : 'Z-Score'}]{sys.isCustom ? ' (Custom)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="button-group" style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={handleGenerateGrades}
            className="btn-primary"
            disabled={loading}
            style={{ width: 'auto', padding: '12px 26px' }}
          >
            {loading ? 'Loading...' : `📐 Generate ${currentMethod === 'rank' ? 'Rank-Based' : 'Relative'} Grades`}
          </button>

          {gradedResults.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleSaveGrades}
                className="btn-primary"
                disabled={saving}
                style={{ width: 'auto', padding: '12px 24px', background: 'linear-gradient(135deg, #059669, #10b981)' }}
              >
                {saving ? 'Saving...' : '💾 Save Grades to Database'}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="btn-secondary"
                style={{ width: 'auto', padding: '12px 20px' }}
              >
                ⬇️ Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Class Statistics & Distribution Chart */}
      {stats && (
        <div className="fade-up">
          <h2 className="section-title">Cohort Performance Analytics</h2>
          <div className="stats-grid" style={{ marginBottom: 28 }}>
            <div className="stat-card">
              <h2>{stats.totalStudents}</h2>
              <p>Total Students</p>
            </div>
            <div className="stat-card">
              <h2>{stats.mean}</h2>
              <p>Cohort Average</p>
            </div>
            <div className="stat-card">
              <h2>{stats.highest}</h2>
              <p>Highest Mark (Rank #1)</p>
            </div>
            <div className="stat-card">
              <h2>{stats.lowest}</h2>
              <p>Lowest Mark</p>
            </div>
          </div>

          {/* Grade Distribution Bar Chart */}
          <div className="card">
            <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>
              Grade Distribution Histogram ({currentMethod === 'rank' ? 'Rank Bands' : 'Statistical Distribution'})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end', minHeight: 180, padding: '10px 0' }}>
              {Object.entries(stats.gradeCounts).map(([g, count], idx) => {
                const maxCount = Math.max(...Object.values(stats.gradeCounts), 1)
                const pct = ((count / maxCount) * 100).toFixed(0)
                const pctOfClass = ((count / stats.totalStudents) * 100).toFixed(0)
                const color = palette[idx % palette.length]

                return (
                  <div key={g} style={{ flex: 1, minWidth: 65, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6 }}>
                      {count} ({pctOfClass}%)
                    </div>
                    <div style={{ background: `${color}18`, borderRadius: 8, height: 120, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                      <div style={{ background: color, width: '100%', height: `${Math.max(Number(pct), 4)}%`, borderRadius: 6, transition: 'height 0.6s ease' }} />
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color, marginTop: 8 }}>
                      {g}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Graded Results Table */}
          <div className="card" style={{ marginTop: 24, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: 0 }}>
                Graded Student Standings ({gradedResults.length})
              </h3>
              <span className="badge badge-purple">
                Method: {currentMethod === 'rank' ? 'Rank-Based Evaluation' : 'Z-Score Evaluation'}
              </span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '8%' }}>Rank</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Batch</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Grade Point</th>
                    <th>Credits</th>
                    <th>Credit Points</th>
                    {currentMethod === 'z-score' && <th>Z-Score</th>}
                  </tr>
                </thead>
                <tbody>
                  {gradedResults.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: 12, fontWeight: 800 }}>
                          #{r.rank}
                        </span>
                      </td>
                      <td>{r.rollNo}</td>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.batch}</td>
                      <td><strong>{Number(r.marks).toFixed(1)}</strong></td>
                      <td><span className={`grade-${r.grade}`} style={{ fontSize: 14 }}>{r.grade}</span></td>
                      <td><strong>{r.gradePoint}</strong></td>
                      <td>{r.credits}</td>
                      <td><strong>{r.creditPoints}</strong></td>
                      {currentMethod === 'z-score' && <td style={{ color: 'var(--text-muted)' }}>{r.zScore}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default RelativeGrading
