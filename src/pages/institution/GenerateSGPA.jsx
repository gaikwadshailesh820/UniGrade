import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore'

function GenerateSGPA() {
  const { user } = useAuth()

  // Dropdown options loaded from existing records
  const [academicYears, setAcademicYears] = useState([])
  const [semesters, setSemesters] = useState([])
  const [batches, setBatches] = useState([])

  // Selected filters
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSem, setSelectedSem] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')

  // Data states
  const [gradedRecords, setGradedRecords] = useState([])
  const [sgpaResults, setSgpaResults] = useState([])
  const [avgSGPA, setAvgSGPA] = useState('0.00')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)

  // Populate dropdown options from Firestore `records` or `gradedRecords`
  useEffect(() => {
    async function loadBatchOptions() {
      try {
        const snapshot = await getDocs(collection(db, 'records'))
        const ySet = new Set()
        const sSet = new Set()
        const bSet = new Set()

        snapshot.forEach(d => {
          const data = d.data()
          if (data.academicYear) ySet.add(data.academicYear)
          if (data.semester) sSet.add(data.semester)
          if (data.batch) bSet.add(data.batch)
        })

        setAcademicYears([...ySet])
        setSemesters([...sSet])
        setBatches([...bSet])
      } catch (err) {
        console.error('Error loading batch options:', err)
      }
    }

    loadBatchOptions()
  }, [])

  // Load Graded Records
  const handleLoadRecords = async () => {
    setAlert(null)
    setSgpaResults([])

    if (!selectedYear || !selectedSem || !selectedBatch) {
      setAlert({ type: 'error', message: '⚠️ Please select Academic Year, Semester, and Batch.' })
      return
    }

    try {
      setLoading(true)
      const q = query(
        collection(db, 'gradedRecords'),
        where('batch', '==', selectedBatch),
        where('semester', '==', selectedSem),
        where('academicYear', '==', selectedYear)
      )

      const snapshot = await getDocs(q)
      const recs = []
      snapshot.forEach(d => {
        recs.push({ id: d.id, ...d.data() })
      })

      if (recs.length === 0) {
        setGradedRecords([])
        setAlert({
          type: 'error',
          message: '📭 No graded records found for the selected criteria. Ensure faculty have uploaded marks and generated relative grades.'
        })
        return
      }

      setGradedRecords(recs)
      setAlert({
        type: 'success',
        message: `✅ Found ${recs.length} graded record(s) across subjects. Click "Generate SGPA" below.`
      })
    } catch (err) {
      console.error('Error loading graded records:', err)
      setAlert({ type: 'error', message: `⚠️ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  // Calculate Credit-Weighted SGPA for each student
  const handleGenerateSGPA = () => {
    if (gradedRecords.length === 0) return

    const studentMap = {}

    gradedRecords.forEach(r => {
      if (!studentMap[r.rollNo]) {
        studentMap[r.rollNo] = {
          rollNo: r.rollNo,
          name: r.name,
          totalCreditPoints: 0,
          totalCredits: 0,
          subjects: []
        }
      }

      const gp = Number(r.gradePoint) || 0
      const creds = Number(r.credits) || 4

      studentMap[r.rollNo].totalCreditPoints += (gp * creds)
      studentMap[r.rollNo].totalCredits += creds
      studentMap[r.rollNo].subjects.push({
        subject: r.subject,
        grade: r.grade,
        gp,
        credits: creds
      })
    })

    const results = Object.values(studentMap).map(s => {
      const sgpa = s.totalCredits > 0
        ? (s.totalCreditPoints / s.totalCredits).toFixed(2)
        : '0.00'

      return {
        ...s,
        sgpa
      }
    })

    // Sort descending by SGPA
    results.sort((a, b) => parseFloat(b.sgpa) - parseFloat(a.sgpa))
    setSgpaResults(results)

    const avg = (results.reduce((sum, s) => sum + parseFloat(s.sgpa), 0) / results.length).toFixed(2)
    setAvgSGPA(avg)

    setAlert({
      type: 'success',
      message: `🎓 Successfully calculated semester SGPA for ${results.length} students! Average batch SGPA: ${avg}`
    })
  }

  // Save SGPA Results using Firestore writeBatch (Atomic commit)
  const handleSaveSGPA = async () => {
    if (sgpaResults.length === 0 || !user) return

    try {
      setSaving(true)
      const batchOp = writeBatch(db)
      const formattedDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      })

      // Query and delete old sgpaResults
      const oldQuery = query(
        collection(db, 'sgpaResults'),
        where('batch', '==', selectedBatch),
        where('semester', '==', selectedSem),
        where('academicYear', '==', selectedYear)
      )

      const oldDocs = await getDocs(oldQuery)
      oldDocs.docs.forEach(d => {
        batchOp.delete(d.ref)
      })

      // Queue new documents
      sgpaResults.forEach(res => {
        const newDocRef = doc(collection(db, 'sgpaResults'))
        batchOp.set(newDocRef, {
          rollNo: res.rollNo,
          name: res.name,
          batch: selectedBatch,
          semester: selectedSem,
          academicYear: selectedYear,
          sgpa: res.sgpa,
          totalCredits: res.totalCredits,
          totalCreditPoints: res.totalCreditPoints,
          generatedOn: formattedDate,
          generatedBy: user.email
        })
      })

      // Commit transaction
      await batchOp.commit()

      setAlert({
        type: 'success',
        message: `💾 Final SGPA results for ${selectedBatch} (${selectedSem}) saved to database and archived successfully!`
      })
    } catch (err) {
      console.error('Error saving SGPA results:', err)
      setAlert({ type: 'error', message: `⚠️ ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const uniqueStudents = [...new Set(gradedRecords.map(r => r.rollNo))]
  const uniqueSubjects = [...new Set(gradedRecords.map(r => r.subject))]

  return (
    <main className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: 32 }} className="fade-up">
        <span className="page-badge">INSTITUTION PORTAL</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: '8px 0 6px' }}>
          🎓 Generate SGPA
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Generate Semester Grade Point Average for an entire batch using faculty-uploaded graded records.
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Batch Details Selection Card */}
      <div className="card fade-up">
        <h3 style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, margin: '0 0 18px' }}>
          📂 Batch Selection
        </h3>

        <div className="grid-4">
          <div>
            <label htmlFor="sgpaYear">Academic Year *</label>
            <select
              id="sgpaYear"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((y, i) => (
                <option key={i} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sgpaSem">Semester *</label>
            <select
              id="sgpaSem"
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
            >
              <option value="">Select Semester</option>
              {semesters.length > 0 ? (
                semesters.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))
              ) : (
                <>
                  <option value="Sem-1">Sem-1</option>
                  <option value="Sem-2">Sem-2</option>
                  <option value="Sem-3">Sem-3</option>
                  <option value="Sem-4">Sem-4</option>
                  <option value="Sem-5">Sem-5</option>
                  <option value="Sem-6">Sem-6</option>
                  <option value="Sem-7">Sem-7</option>
                  <option value="Sem-8">Sem-8</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="sgpaBatch">Batch *</label>
            <select
              id="sgpaBatch"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="">Select Batch</option>
              {batches.map((b, i) => (
                <option key={i} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sgpaSystem">Grading Model</label>
            <input
              id="sgpaSystem"
              type="text"
              value="Relative / Multi-Scale"
              readOnly
              style={{ background: '#f8fafc', color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={handleLoadRecords}
            className="btn-primary"
            disabled={loading}
            style={{ width: 'auto', padding: '12px 26px' }}
          >
            {loading ? 'Loading Records...' : '🔍 Load Graded Records'}
          </button>
        </div>
      </div>

      {/* Graded Records & Summary Section */}
      {gradedRecords.length > 0 && (
        <div className="fade-up">
          {/* Stats Bar */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <h2>{uniqueStudents.length}</h2>
              <p>Total Students</p>
            </div>
            <div className="stat-card">
              <h2>{uniqueSubjects.length}</h2>
              <p>Subjects Evaluated</p>
            </div>
            <div className="stat-card">
              <h2>{gradedRecords.length}</h2>
              <p>Subject Records</p>
            </div>
            <div className="stat-card">
              <h2>{avgSGPA}</h2>
              <p>Batch Average SGPA</p>
            </div>
          </div>

          {/* Graded Records Table Preview */}
          <div className="card" style={{ marginBottom: 24, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: 0 }}>
                📋 Loaded Graded Subject Records ({gradedRecords.length})
              </h3>
              <button
                type="button"
                onClick={handleGenerateSGPA}
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 22px', fontSize: 13.5 }}
              >
                🎓 Generate SGPA
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Grade Point</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {gradedRecords.slice(0, 30).map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.rollNo}</strong></td>
                      <td>{r.name}</td>
                      <td><span className="badge badge-blue">{r.subject}</span></td>
                      <td>{r.marks}</td>
                      <td><span className={`grade-${r.grade}`} style={{ fontSize: 14 }}>{r.grade}</span></td>
                      <td>{r.gradePoint}</td>
                      <td>{r.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {gradedRecords.length > 30 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 12, marginBottom: 0 }}>
                ... and {gradedRecords.length - 30} more records loaded
              </p>
            )}
          </div>

          {/* SGPA Preview Table */}
          {sgpaResults.length > 0 && (
            <div className="card fade-up" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: 0 }}>
                  📊 SGPA Results Preview ({sgpaResults.length} Students)
                </h3>

                <button
                  type="button"
                  onClick={handleSaveSGPA}
                  className="btn-primary"
                  disabled={saving}
                  style={{ width: 'auto', padding: '11px 24px', background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  {saving ? 'Saving...' : '💾 Save Final SGPA Results'}
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Subjects Evaluated</th>
                      <th>Total Credits</th>
                      <th>Final SGPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sgpaResults.map((s, i) => (
                      <tr key={i}>
                        <td><strong>#{i + 1}</strong></td>
                        <td>{s.rollNo}</td>
                        <td><strong>{s.name}</strong></td>
                        <td><span className="badge badge-blue">{s.subjects.length} Subjects</span></td>
                        <td>{s.totalCredits}</td>
                        <td><strong style={{ color: 'var(--primary)', fontSize: 16 }}>{s.sgpa}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default GenerateSGPA
