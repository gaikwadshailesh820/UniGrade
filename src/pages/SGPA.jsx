import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGradingSystems } from '../hooks/useGradingSystems'
import { useEvaluationSchemes } from '../hooks/useEvaluationSchemes'

function createDefaultSubject(id, scheme) {
  const initialMarks = {}
  if (scheme && Array.isArray(scheme.categories)) {
    scheme.categories.forEach(cat => {
      cat.components?.forEach(comp => {
        initialMarks[comp.id] = ''
      })
    })
  }
  return {
    id,
    name: '',
    credits: 4,
    componentMarks: initialMarks
  }
}

function SGPA() {
  const {
    activeAbsolute,
    absoluteSystems,
    selectActiveAbsolute,
    resolveGrade
  } = useGradingSystems()

  const {
    activeScheme,
    allSchemes,
    selectActiveScheme,
    calculateFinalSubjectMarks
  } = useEvaluationSchemes()

  const [studentName, setStudentName] = useState('')
  const [subjects, setSubjects] = useState(() => [createDefaultSubject(1, activeScheme)])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Subject management
  const addSubject = () => {
    const nextId = subjects.length > 0 ? Math.max(...subjects.map(s => s.id)) + 1 : 1
    setSubjects([...subjects, createDefaultSubject(nextId, activeScheme)])
  }

  const removeSubject = (id) => {
    if (subjects.length <= 1) return
    setSubjects(subjects.filter(s => s.id !== id))
  }

  const updateSubjectField = (id, field, value) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const updateSubjectComponentMark = (subjectId, compId, value) => {
    setSubjects(
      subjects.map(s => {
        if (s.id !== subjectId) return s
        return {
          ...s,
          componentMarks: {
            ...s.componentMarks,
            [compId]: value
          }
        }
      })
    )
  }

  // Calculate SGPA using decoupled Evaluation Scheme & Grading System
  const calculateSGPA = () => {
    setError(null)
    setResult(null)

    if (subjects.length === 0) {
      setError('⚠️ Please add at least one subject.')
      return
    }

    let totalCreditPoints = 0
    let totalCredits = 0
    const breakdown = []

    for (const sub of subjects) {
      const c = Number(sub.credits)
      if (!c || c <= 0) {
        setError('⚠️ Please enter valid credits (greater than 0) for all subjects to calculate SGPA.')
        return
      }

      // Stage 1: Convert raw component marks to final subject marks using Evaluation Scheme
      const evalResult = calculateFinalSubjectMarks(activeScheme, sub.componentMarks || {})
      const finalMark = evalResult.finalMarks

      // Stage 2: Convert final subject marks to letter grade and grade point using Grading System
      const { grade, gradePoint: gp } = resolveGrade(activeAbsolute, finalMark)
      const creditPoints = c * gp

      totalCreditPoints += creditPoints
      totalCredits += c

      breakdown.push({
        name: sub.name.trim() || `Subject ${sub.id}`,
        categoriesBreakdown: evalResult.categoriesBreakdown,
        finalMark: Number(finalMark.toFixed(1)),
        gp,
        grade,
        credits: c,
        creditPoints: Number(creditPoints.toFixed(1))
      })
    }

    const sgpaScore = (totalCreditPoints / totalCredits).toFixed(2)
    const numericSgpa = parseFloat(sgpaScore)

    let perfLabel = '⚠️ Below Average'
    if (numericSgpa >= 9) perfLabel = '🏆 Outstanding'
    else if (numericSgpa >= 8) perfLabel = '⭐ Excellent'
    else if (numericSgpa >= 7) perfLabel = '✅ Good'
    else if (numericSgpa >= 6) perfLabel = '🔵 Average'

    setResult({
      sgpa: sgpaScore,
      perfLabel,
      totalCredits,
      totalCreditPoints: Number(totalCreditPoints.toFixed(1)),
      breakdown
    })
  }

  // Sorted rules for grade reference pills
  const sortedRules = [...(activeAbsolute?.rules || [])].sort((a, b) => b.min - a.min)

  const getBadgeClass = (gp) => {
    if (gp >= 9) return 'badge-purple'
    if (gp >= 7) return 'badge-green'
    if (gp >= 5) return 'badge-blue'
    return 'badge-red'
  }

  return (
    <main className="page-wrapper" style={{ maxWidth: 1000 }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }} className="fade-up">
        <span className="page-badge">TOOLS</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: '8px 0 6px' }}>
          🎓 SGPA Calculator
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Calculate Semester GPA dynamically using your institution's custom Evaluation Scheme and Grading Scale.
        </p>
      </div>

      {/* Selectors: Evaluation Scheme + Grading System */}
      <div className="two-col fade-up" style={{ marginBottom: 20 }}>
        {/* Evaluation Scheme Selector */}
        <div className="card" style={{ margin: 0, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label htmlFor="evalSchemeSelect" style={{ margin: 0 }}>📋 Evaluation Scheme</label>
            <Link to="/evaluation-schemes" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--primary-mid)', textDecoration: 'none' }}>
              ⚙️ Customize Scheme →
            </Link>
          </div>
          <select
            id="evalSchemeSelect"
            value={activeScheme?.id || 'unigrade-default-60-40'}
            onChange={(e) => selectActiveScheme(e.target.value)}
            style={{ marginBottom: 6 }}
          >
            {allSchemes.map(sch => (
              <option key={sch.id} value={sch.id}>
                {sch.name}{sch.isCustom ? ' (Custom)' : ''}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
            Determines how raw assessment marks convert to final percentage marks.
          </p>
        </div>

        {/* Grading System Selector */}
        <div className="card" style={{ margin: 0, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label htmlFor="gradingSystemSelect" style={{ margin: 0 }}>🏛️ Grading Scale</label>
            <Link to="/grading-systems" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--primary-mid)', textDecoration: 'none' }}>
              ⚙️ Manage Scales →
            </Link>
          </div>
          <select
            id="gradingSystemSelect"
            value={activeAbsolute?.id || 'unigrade-default'}
            onChange={(e) => selectActiveAbsolute(e.target.value)}
            style={{ marginBottom: 6 }}
          >
            {absoluteSystems.map(sys => (
              <option key={sys.id} value={sys.id}>
                {sys.name}{sys.isCustom ? ' (Custom)' : ''}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
            Determines how final marks convert to Letter Grades &amp; Grade Points.
          </p>
        </div>
      </div>

      {/* Active Evaluation Scheme Architecture Reference */}
      {activeScheme && (
        <div className="eval-scheme fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h4 style={{ margin: 0 }}>📋 Active Evaluation Architecture: {activeScheme.name}</h4>
            <span className="badge badge-purple">Total: 100% Weight</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {activeScheme.categories.map((cat, catIdx) => (
              <div
                key={cat.id || catIdx}
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 12,
                  border: '1px solid rgba(203, 213, 225, 0.6)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: catIdx % 2 === 1 ? '#059669' : 'var(--primary)' }}>
                    {cat.name} ({cat.weight}%)
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Max: {cat.components.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0)} pts
                  </span>
                </div>

                <div className="eval-row">
                  {cat.components.map((comp, compIdx) => (
                    <span
                      key={comp.id || compIdx}
                      className={`eval-pill ${catIdx % 2 === 1 ? 'practical' : ''}`}
                      style={{ fontSize: 11.5, padding: '4px 8px' }}
                    >
                      {comp.name} — {comp.maxMarks}m
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Name */}
      <div className="card fade-up" style={{ padding: '18px 24px', marginBottom: 20 }}>
        <label htmlFor="studentNameInput">Student Name (Optional)</label>
        <input
          id="studentNameInput"
          type="text"
          placeholder="e.g. Alex Johnson"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Subject Cards */}
      <div style={{ marginBottom: 24 }}>
        {subjects.map((sub, index) => (
          <div key={sub.id} className="subject-card fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                Subject #{index + 1}
              </span>
              {subjects.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSubject(sub.id)}
                  className="btn-danger"
                  style={{ width: 'auto', padding: '5px 12px', fontSize: 12 }}
                >
                  ✕ Remove Subject
                </button>
              )}
            </div>

            <div className="two-col" style={{ marginBottom: 14 }}>
              <div>
                <label>Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures"
                  value={sub.name}
                  onChange={(e) => updateSubjectField(sub.id, 'name', e.target.value)}
                />
              </div>
              <div>
                <label>Credits</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="e.g. 4"
                  value={sub.credits}
                  onChange={(e) => updateSubjectField(sub.id, 'credits', e.target.value)}
                />
              </div>
            </div>

            {/* Dynamic Categories & Components */}
            {activeScheme?.categories?.map((cat, catIdx) => (
              <div
                key={cat.id || catIdx}
                style={{
                  marginTop: 10,
                  padding: 14,
                  background: catIdx % 2 === 1 ? 'rgba(5,150,105,0.04)' : 'rgba(37,99,235,0.04)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${catIdx % 2 === 1 ? 'rgba(5,150,105,0.15)' : 'rgba(37,99,235,0.15)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: catIdx % 2 === 1 ? '#059669' : 'var(--primary-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                    {cat.name} ({cat.weight}% weight)
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Sum Max: {cat.components.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0)} marks
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                  {cat.components?.map((comp) => (
                    <div key={comp.id}>
                      <label style={{ fontSize: 12 }}>
                        {comp.name} <span style={{ color: '#94a3b8', fontSize: 11 }}>(max {comp.maxMarks})</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={comp.maxMarks}
                        placeholder={`0–${comp.maxMarks}`}
                        value={sub.componentMarks?.[comp.id] ?? ''}
                        onChange={(e) => updateSubjectComponentMark(sub.id, comp.id, e.target.value)}
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Calculator Buttons */}
      <div className="button-group" style={{ marginBottom: 28 }}>
        <button type="button" onClick={addSubject} className="btn-secondary" style={{ padding: '12px 22px' }}>
          + Add Subject
        </button>
        <button type="button" onClick={calculateSGPA} className="btn-primary" style={{ padding: '12px 28px' }}>
          📊 Calculate SGPA
        </button>
      </div>

      {/* Grade Reference */}
      <div className="card fade-up">
        <h3 style={{ color: 'var(--primary)', fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>
          Grade Point Reference <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: 12 }}>— {activeAbsolute?.name}</span>
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sortedRules.map((rule, idx) => (
            <span key={idx} className={`badge ${getBadgeClass(rule.gradePoint)}`}>
              {rule.min === -Infinity ? 'Below' : `≥ ${rule.min}`} → {rule.gradePoint} ({rule.grade})
            </span>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="fade-up">
          <div className="result-box">
            <h2>{studentName ? `${studentName}'s SGPA` : 'Final Semester SGPA'}</h2>
            <span className="score">{result.sgpa}</span>
            <p className="label">{result.perfLabel}</p>
            <div style={{ marginTop: 14, fontSize: 13, opacity: 0.9 }}>
              Total Credits: <strong>{result.totalCredits}</strong> • Credit Points: <strong>{result.totalCreditPoints}</strong> • Scheme: <strong>{activeScheme?.name}</strong>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ color: 'var(--primary)', fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>
              Subject Evaluation Breakdown
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Category Contributions</th>
                    <th>Final Weighted Mark</th>
                    <th>Grade</th>
                    <th>Grade Point</th>
                    <th>Credits</th>
                    <th>Credit Points</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((row, idx) => (
                    <tr key={idx}>
                      <td><strong>{row.name}</strong></td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {row.categoriesBreakdown?.map((cb, cbi) => (
                            <span key={cbi} className="badge badge-blue" style={{ fontSize: 11 }}>
                              {cb.categoryName}: {cb.obtainedTotal}/{cb.maxTotal} ({cb.categoryPercentage}%) → +{cb.weightedContribution.toFixed(1)}pts
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><strong>{row.finalMark}</strong> / 100</td>
                      <td><span className={`grade-${row.grade}`}>{row.grade}</span></td>
                      <td><strong>{row.gp}</strong></td>
                      <td>{row.credits}</td>
                      <td><strong>{row.creditPoints}</strong></td>
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

export default SGPA