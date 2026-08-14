import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, getDocs } from 'firebase/firestore'

function InstitutionDashboard() {
  const { user, userProfile } = useAuth()

  const [stats, setStats] = useState({
    students: 0,
    subjects: 0,
    records: 0,
    batches: 0
  })

  const [subjectSummaries, setSubjectSummaries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInstitutionData() {
      try {
        setLoading(true)
        const snapshot = await getDocs(collection(db, 'records'))
        const allRecords = []
        snapshot.forEach(d => {
          allRecords.push(d.data())
        })

        const uniqueStudents = [...new Set(allRecords.map(r => r.rollNo).filter(Boolean))]
        const uniqueSubjects = [...new Set(allRecords.map(r => r.subject).filter(Boolean))]
        const uniqueBatches = [...new Set(allRecords.map(r => r.batch).filter(Boolean))]

        setStats({
          students: uniqueStudents.length,
          subjects: uniqueSubjects.length,
          records: allRecords.length,
          batches: uniqueBatches.length
        })

        // Compute Subject Summaries
        const subjectMap = {}
        allRecords.forEach(r => {
          if (!r.subject) return
          if (!subjectMap[r.subject]) {
            subjectMap[r.subject] = {
              students: new Set(),
              batches: new Set(),
              marks: []
            }
          }
          if (r.rollNo) subjectMap[r.subject].students.add(r.rollNo)
          if (r.batch) subjectMap[r.subject].batches.add(r.batch)
          const markVal = Number(r.marks) || Number(r.theoryTotal) || 0
          subjectMap[r.subject].marks.push(markVal)
        })

        const summaryList = Object.entries(subjectMap).map(([subject, data]) => {
          const avg = data.marks.length > 0
            ? (data.marks.reduce((a, b) => a + b, 0) / data.marks.length).toFixed(1)
            : '0.0'
          const highest = data.marks.length > 0 ? Math.max(...data.marks) : 0
          const lowest = data.marks.length > 0 ? Math.min(...data.marks) : 0

          return {
            subject,
            studentCount: data.students.size,
            batches: [...data.batches].join(', ') || '—',
            avg,
            highest,
            lowest
          }
        })

        setSubjectSummaries(summaryList)
      } catch (err) {
        console.error('Error loading institution dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInstitutionData()
  }, [])

  const instName = userProfile?.name || user?.email?.split('@')[0] || 'Institution Administrator'

  return (
    <main className="dashboard-container">
      {/* Top Header */}
      <div className="dashboard-top fade-up">
        <span className="page-badge">INSTITUTION PORTAL</span>
        <h1 className="dashboard-title">Institution Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome, {instName}. Manage faculty uploads, generate final grades and track batch analytics.
        </p>
        <div className="hero-badge" style={{ marginTop: 14 }}>
          Faculty Uploads → Relative Grading → Export Results
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid fade-up">
        <div className="stat-card">
          <h2>{loading ? '...' : stats.students}</h2>
          <p>Total Students</p>
        </div>
        <div className="stat-card">
          <h2>{loading ? '...' : stats.subjects}</h2>
          <p>Subjects</p>
        </div>
        <div className="stat-card">
          <h2>{loading ? '...' : stats.records}</h2>
          <p>Mark Records</p>
        </div>
        <div className="stat-card">
          <h2>{loading ? '...' : stats.batches}</h2>
          <p>Active Batches</p>
        </div>
      </div>

      {/* Academic Results Hub */}
      <h2 className="section-title">Academic Results Hub</h2>
      <div className="actions-grid fade-up" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="action-card" style={{ borderLeft: '4px solid var(--primary-mid)' }}>
          <h3>🎓 Generate Semester Results</h3>
          <p>
            Generate credit-weighted SGPA and CGPA results for an entire batch using faculty-uploaded graded records.
          </p>
          <Link to="/institution-sgpa" className="btn-primary">
            Generate SGPA →
          </Link>
        </div>

        <div className="action-card" style={{ borderLeft: '4px solid #059669' }}>
          <h3>📂 Archived Semester Results</h3>
          <p>
            View previously generated SGPA results, batch averages, and semester performance reports across all academic years.
          </p>
          <Link to="/view-sgpa" className="btn-primary" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
            View Results →
          </Link>
        </div>
      </div>

      {/* Institution Modules */}
      <h2 className="section-title" style={{ marginTop: 45 }}>Institution Modules</h2>
      <div className="actions-grid fade-up">
        <div className="action-card">
          <h3>📋 Faculty Upload Records</h3>
          <p>View all student marks uploaded by faculty members across all departments and subjects.</p>
          <Link to="/institution-records" className="btn-primary">
            View Records →
          </Link>
        </div>

        <div className="action-card">
          <h3>🏛️ Institution Profile</h3>
          <p>View and update institution details, university affiliation, contact information, and security settings.</p>
          <Link to="/institution-profile" className="btn-primary">
            View Profile →
          </Link>
        </div>

        <div className="action-card">
          <h3>🏛️ Grading Systems</h3>
          <p>Choose the university grading scale used across batches, or build a custom institutional scale.</p>
          <Link to="/grading-systems" className="btn-primary">
            Manage Systems →
          </Link>
        </div>

        <div className="action-card">
          <h3>📋 Evaluation Schemes</h3>
          <p>Configure custom institutional assessment categories, weights, and component maximum marks.</p>
          <Link to="/evaluation-schemes" className="btn-primary">
            Build Scheme →
          </Link>
        </div>
      </div>

      {/* Subject Summary Table */}
      <div style={{ marginTop: 45 }}>
        <h2 className="section-title">Subject Summary</h2>
        {subjectSummaries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No subject records uploaded yet</h3>
            <p>Faculty must upload subject marks before summaries appear here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Students Evaluated</th>
                  <th>Batches</th>
                  <th>Average Marks</th>
                  <th>Highest</th>
                  <th>Lowest</th>
                </tr>
              </thead>
              <tbody>
                {subjectSummaries.map((s, i) => (
                  <tr key={i}>
                    <td><strong>{s.subject}</strong></td>
                    <td>{s.studentCount}</td>
                    <td><span className="badge badge-blue">{s.batches}</span></td>
                    <td><strong>{s.avg}</strong></td>
                    <td>{s.highest}</td>
                    <td>{s.lowest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

export default InstitutionDashboard
