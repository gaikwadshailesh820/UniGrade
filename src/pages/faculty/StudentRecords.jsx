import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { useGradingSystems } from '../../hooks/useGradingSystems'

function StudentRecords() {
  const { user } = useAuth()
  const { activeAbsolute, resolveGrade } = useGradingSystems()

  const [allRecords, setAllRecords] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

  // Fetch records
  const loadRecords = useCallback(async () => {
    if (!user) return

    try {
      const q = query(
        collection(db, 'records'),
        where('facultyId', '==', user.uid)
      )
      const snapshot = await getDocs(q)
      const recordsData = []
      snapshot.forEach(d => {
        recordsData.push({ id: d.id, ...d.data() })
      })
      setAllRecords(recordsData)
      setSelectedIds([])
    } catch (err) {
      console.error('Error loading records:', err)
      setAlert({ type: 'error', message: `⚠️ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    let ignore = false
    async function fetchData() {
      if (!user) return
      try {
        const q = query(
          collection(db, 'records'),
          where('facultyId', '==', user.uid)
        )
        const snapshot = await getDocs(q)
        if (!ignore) {
          const recordsData = []
          snapshot.forEach(d => {
            recordsData.push({ id: d.id, ...d.data() })
          })
          setAllRecords(recordsData)
          setSelectedIds([])
        }
      } catch (err) {
        if (!ignore) {
          console.error('Error loading records:', err)
          setAlert({ type: 'error', message: `⚠️ ${err.message}` })
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchData()
    return () => { ignore = true }
  }, [user])

  // Unique filter options
  const uniqueSubjects = useMemo(() => {
    return [...new Set(allRecords.map(r => r.subject).filter(Boolean))]
  }, [allRecords])

  const uniqueBatches = useMemo(() => {
    return [...new Set(allRecords.map(r => r.batch).filter(Boolean))]
  }, [allRecords])

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    const sTerm = search.toLowerCase().trim()
    return allRecords.filter(r => {
      const matchSearch = !sTerm ||
        (r.name && r.name.toLowerCase().includes(sTerm)) ||
        (r.rollNo && r.rollNo.toLowerCase().includes(sTerm))
      const matchSubj = !subjectFilter || r.subject === subjectFilter
      const matchBatch = !batchFilter || r.batch === batchFilter
      return matchSearch && matchSubj && matchBatch
    })
  }, [allRecords, search, subjectFilter, batchFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    const students = new Set(allRecords.map(r => r.rollNo)).size
    const subjects = uniqueSubjects.length
    const totalRecs = allRecords.length
    const avg = totalRecs > 0
      ? (allRecords.reduce((sum, r) => sum + (Number(r.marks) || 0), 0) / totalRecs).toFixed(1)
      : '—'
    return { students, subjects, totalRecs, avg }
  }, [allRecords, uniqueSubjects])

  // Checkbox management
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredRecords.map(r => r.id))
    } else {
      setSelectedIds([])
    }
  }

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Bulk Delete
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one record.')
      return
    }

    const confirmDelete = window.confirm(`Are you sure you want to permanently delete these ${selectedIds.length} records?`)
    if (!confirmDelete) return

    try {
      setLoading(true)
      for (const id of selectedIds) {
        await deleteDoc(doc(db, 'records', id))
      }
      setAlert({ type: 'success', message: `🗑️ ${selectedIds.length} records deleted successfully.` })
      await loadRecords()
    } catch (err) {
      console.error('Error deleting records:', err)
      setAlert({ type: 'error', message: `⚠️ ${err.message}` })
      setLoading(false)
    }
  }

  // CSV Export
  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No records to export.')
      return
    }

    const headers = [
      'Roll No', 'Name', 'Subject', 'Subject Code', 'Batch', 'Semester', 'Academic Year',
      'Exam Type', 'CA', 'Midsem', 'Endsem', 'Theory Total', 'Lab Manual', 'Lab Assessment',
      'Viva', 'End Practical', 'Practical Total', 'Final Marks', 'Grade', 'Credits', 'Uploaded On'
    ]

    const rows = filteredRecords.map(r => {
      const grade = resolveGrade(activeAbsolute, r.marks).grade
      return [
        r.rollNo, r.name, r.subject, r.subjectCode || '', r.batch, r.semester || '', r.academicYear || '',
        r.examType, r.ca ?? '', r.midsem ?? '', r.endsem ?? '', r.theoryTotal ?? '',
        r.labManual ?? '', r.labAssessment ?? '', r.viva ?? '', r.endPractical ?? '',
        r.practicalTotal ?? '', r.marks, grade, r.credits, r.uploadedOn
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `UniGrade_StudentRecords_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="page-wrapper">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }} className="fade-up">
        <div>
          <span className="page-badge">FACULTY PORTAL</span>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: '8px 0 6px' }}>
            👨‍🎓 Student Records
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
            All uploaded mark records across subjects.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={exportCSV} className="btn-secondary" style={{ width: 'auto', padding: '11px 20px', fontSize: 13.5 }}>
            ⬇️ Export CSV
          </button>
          <Link to="/upload-excel" className="btn-primary" style={{ width: 'auto', padding: '11px 22px', fontSize: 13.5 }}>
            + Upload Marks
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid fade-up" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 28 }}>
        <div className="stat-card">
          <h2>{loading ? '...' : stats.students}</h2>
          <p>Total Students</p>
        </div>
        <div className="stat-card">
          <h2>{loading ? '...' : stats.subjects}</h2>
          <p>Subjects</p>
        </div>
        <div className="stat-card">
          <h2>{loading ? '...' : stats.totalRecs}</h2>
          <p>Mark Records</p>
        </div>
        <div className="stat-card">
          <h2>{loading ? '...' : stats.avg}</h2>
          <p>Class Average</p>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Search & Filters */}
      <div className="card fade-up" style={{ padding: '18px 22px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ margin: 0, flex: 2, minWidth: 220 }}
          />

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{ margin: 0, flex: 1, minWidth: 160 }}
          >
            <option value="">All Subjects</option>
            {uniqueSubjects.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            style={{ margin: 0, flex: 1, minWidth: 160 }}
          >
            <option value="">All Batches</option>
            {uniqueBatches.map((b, i) => (
              <option key={i} value={b}>{b}</option>
            ))}
          </select>

          {(search || subjectFilter || batchFilter) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSubjectFilter(''); setBatchFilter(''); }}
              className="btn-secondary"
              style={{ width: 'auto', padding: '11px 18px', fontSize: 13 }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="fade-up">
        {filteredRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>{allRecords.length === 0 ? 'No records uploaded yet' : 'No matching records found'}</h3>
            <p>{allRecords.length === 0 ? 'Upload student marks using Excel to manage them here.' : 'Try adjusting your search criteria or clear active filters.'}</p>
            {allRecords.length === 0 && (
              <div style={{ marginTop: 18 }}>
                <Link to="/upload-excel" className="btn-primary" style={{ width: 'auto' }}>
                  Upload Now →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
                {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
              </p>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="btn-danger"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: 12.5 }}
                >
                  🗑️ Delete Selected ({selectedIds.length})
                </button>
              )}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredRecords.length && filteredRecords.length > 0}
                        onChange={handleSelectAll}
                        style={{ margin: 0, cursor: 'pointer' }}
                      />
                    </th>
                    <th>#</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Subject</th>
                    <th>Batch</th>
                    <th>Type</th>
                    <th>Theory (CA+Mid+End)</th>
                    <th>Practical (Lab+Viva+End)</th>
                    <th>Final Marks</th>
                    <th>Grade</th>
                    <th>Uploaded On</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r, i) => {
                    const grade = resolveGrade(activeAbsolute, r.marks).grade
                    const theoryDetail = r.theoryTotal != null
                      ? `${r.theoryTotal} (${r.ca || 0}+${r.midsem || 0}+${r.endsem || 0})`
                      : '—'
                    const practicalDetail = r.practicalTotal != null && r.practicalTotal > 0
                      ? `${r.practicalTotal} (${r.labManual || 0}+${r.viva || 0}+${r.endPractical || 0})`
                      : '—'

                    return (
                      <tr key={r.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            style={{ margin: 0, cursor: 'pointer' }}
                          />
                        </td>
                        <td>{i + 1}</td>
                        <td><strong>{r.rollNo}</strong></td>
                        <td>{r.name}</td>
                        <td><span className="badge badge-blue">{r.subject}</span></td>
                        <td>{r.batch || '—'}</td>
                        <td>
                          <span className={`badge ${r.examType === 'both' ? 'badge-purple' : r.examType === 'practical' ? 'badge-green' : 'badge-blue'}`}>
                            {r.examType || 'theory'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12.5, color: '#334155' }}>{theoryDetail}</td>
                        <td style={{ fontSize: 12.5, color: '#334155' }}>{practicalDetail}</td>
                        <td><strong>{r.marks} / {r.maxMarks || 100}</strong></td>
                        <td><span className={`grade-${grade}`} style={{ fontSize: 14 }}>{grade}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.uploadedOn || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default StudentRecords
