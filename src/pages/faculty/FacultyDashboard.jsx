import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

function FacultyDashboard() {
  const { user, userProfile } = useAuth()
  const [stats, setStats] = useState({
    students: 0,
    subjects: 0,
    records: 0,
    pending: 0
  })
  const [recentUploads, setRecentUploads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return

      try {
        setLoading(true)
        const q = query(
          collection(db, 'records'),
          where('facultyId', '==', user.uid)
        )
        const snapshot = await getDocs(q)
        const allRecords = []
        snapshot.forEach((doc) => {
          allRecords.push(doc.data())
        })

        const uniqueStudents = [...new Set(allRecords.map(r => r.rollNo))]
        const uniqueSubjects = [...new Set(allRecords.map(r => r.subject))]

        setStats({
          students: uniqueStudents.length,
          subjects: uniqueSubjects.length,
          records: allRecords.length,
          pending: 0
        })

        // Upload history from localStorage
        const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]')
        setRecentUploads(history)
      } catch (err) {
        console.error('Error loading faculty dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const displayName = userProfile?.name || user?.email?.split('@')[0] || 'Faculty'

  return (
    <main className="dashboard-container">
      {/* Welcome Top */}
      <div className="dashboard-top fade-up">
        <span className="page-badge">FACULTY PORTAL</span>
        <h1 className="dashboard-title">Faculty Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back, {displayName}. Manage marks, subjects and student records.
        </p>
        <div className="hero-badge" style={{ marginTop: 14 }}>
          Academic ERP • Student Records • Excel Upload
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
          <p>Subjects Uploaded</p>
        </div>
        <div className="stat-card">
          <h2>{loading ? '...' : stats.records}</h2>
          <p>Mark Records</p>
        </div>
        <div className="stat-card">
          <h2>{stats.pending}</h2>
          <p>Pending Reviews</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="section-title">Quick Actions</h2>
      <div className="actions-grid fade-up">
        <div className="action-card">
          <h3>📊 Upload Subject Marks</h3>
          <p>Upload student marks using Excel sheets for any subject and batch.</p>
          <Link to="/upload-excel" className="btn-primary">
            Open Module →
          </Link>
        </div>

        <div className="action-card">
          <h3>👨‍🎓 Student Records</h3>
          <p>View, search, filter and manage all uploaded student mark records.</p>
          <Link to="/student-records" className="btn-primary">
            View Records →
          </Link>
        </div>

        <div className="action-card">
          <h3>📊 Relative Grading</h3>
          <p>Generate subject-wise relative grades using class performance statistics.</p>
          <Link to="/relative-grading" className="btn-primary">
            Generate Grades →
          </Link>
        </div>

        <div className="action-card">
          <h3>⚙️ My Profile</h3>
          <p>Manage faculty account information and change your password.</p>
          <Link to="/faculty-profile" className="btn-primary">
            Edit Profile →
          </Link>
        </div>

        <div className="action-card">
          <h3>🏛️ Grading Systems</h3>
          <p>Switch between university scales (SPPU, VTU, Anna, Mumbai...) or build custom rules.</p>
          <Link to="/grading-systems" className="btn-primary">
            Manage Systems →
          </Link>
        </div>

        <div className="action-card">
          <h3>📋 Evaluation Schemes</h3>
          <p>Configure custom assessment categories, weights, and component maximum marks.</p>
          <Link to="/evaluation-schemes" className="btn-primary">
            Build Scheme →
          </Link>
        </div>
      </div>

      {/* Recent Uploads */}
      <div style={{ marginTop: 45 }}>
        <h2 className="section-title">Recent Uploads</h2>
        {recentUploads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No uploads yet</h3>
            <p>Start by uploading subject marks using Excel or CSV.</p>
            <div style={{ marginTop: 16 }}>
              <Link to="/upload-excel" className="btn-primary" style={{ width: 'auto' }}>
                Upload Now →
              </Link>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Batch</th>
                  <th>Type</th>
                  <th>Records</th>
                  <th>Uploaded On</th>
                </tr>
              </thead>
              <tbody>
                {recentUploads.slice().reverse().map((u, i) => (
                  <tr key={i}>
                    <td><strong>{u.subject}</strong></td>
                    <td>{u.batch}</td>
                    <td><span className="badge badge-blue">{u.examType || 'Theory'}</span></td>
                    <td>{u.count}</td>
                    <td>{u.date}</td>
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

export default FacultyDashboard
