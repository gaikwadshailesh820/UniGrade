import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore'

function UploadExcel() {
  const { user } = useAuth()

  // Form State
  const [subjectName, setSubjectName] = useState('')
  const [credits, setCredits] = useState('4')
  const [subjectCode, setSubjectCode] = useState('')
  const [batchName, setBatchName] = useState('')
  const [examType, setExamType] = useState('theory')
  const [semester, setSemester] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  const [parsedData, setParsedData] = useState([])
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAlert(null)
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(sheet)

        if (json.length === 0) {
          setAlert({ type: 'error', message: '⚠️ The selected file is empty.' })
          return
        }

        setParsedData(json)
        setAlert({
          type: 'success',
          message: `✅ File loaded! Found ${json.length} row(s). Review the preview below and click "Save Records".`
        })
      } catch (err) {
        console.error('Error parsing spreadsheet:', err)
        setAlert({ type: 'error', message: '⚠️ Could not parse the Excel/CSV file. Ensure valid format.' })
      }
    }

    reader.onerror = () => {
      setAlert({ type: 'error', message: '⚠️ Error reading file from your system.' })
    }

    reader.readAsArrayBuffer(file)
  }

  const clearPreview = () => {
    setParsedData([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    setAlert(null)
  }

  const handleSaveRecords = async () => {
    if (!user) return

    if (!subjectName.trim()) {
      setAlert({ type: 'error', message: '⚠️ Please enter a Subject Name.' })
      return
    }

    if (!batchName.trim()) {
      setAlert({ type: 'error', message: '⚠️ Please enter a Batch Name.' })
      return
    }

    if (parsedData.length === 0) {
      setAlert({ type: 'error', message: '⚠️ No parsed records to save. Please choose a spreadsheet file.' })
      return
    }

    try {
      setLoading(true)
      const facultyId = user.uid
      const facultyEmail = user.email
      const formattedDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      })

      // Helper to match column headers case-insensitively
      const getVal = (row, ...keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
            return row[k]
          }
          // Lowercase match
          const foundKey = Object.keys(row).find(
            rk => rk.toLowerCase().trim() === k.toLowerCase().trim()
          )
          if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
            return row[foundKey]
          }
        }
        return null
      }

      // Transform raw rows into UniGrade evaluation schema
      const enrichedRecords = parsedData.map(row => {
        const rollNo = String(getVal(row, 'rollNo', 'Roll No', 'ROLL NO', 'RollNo', 'roll_no', 'Roll_No') || '—')
        const name = String(getVal(row, 'name', 'Name', 'Student Name', 'STUDENT NAME', 'student_name') || '—')

        // Theory sub-components
        const ca = Number(getVal(row, 'ca', 'CA', 'Continuous Assessment', 'ContinuousAssessment') || 0)
        const midsem = Number(getVal(row, 'midsem', 'Midsem', 'midterm', 'Midterm', 'Mid Term', 'Mid_Term') || 0)
        const endsem = Number(getVal(row, 'endsem', 'Endsem', 'endterm', 'End Term', 'EndTerm', 'End_Term') || 0)
        const directMarks = Number(getVal(row, 'marks', 'Marks', 'MARKS', 'Total') || 0)
        const theoryTotal = (ca + midsem + endsem) || directMarks

        // Practical sub-components
        const labManual = Number(getVal(row, 'labManual', 'Lab Manual', 'LabManual') || 0)
        const labAssessment = Number(getVal(row, 'labAssessment', 'Lab Assessment', 'LabAssessment') || 0)
        const viva = Number(getVal(row, 'viva', 'Viva', 'Viva-voce', 'InternalViva') || 0)
        const endPractical = Number(getVal(row, 'endPractical', 'End Practical', 'EndPractical', 'EndSem Practical') || 0)
        const practicalTotal = labManual + labAssessment + viva + endPractical

        let finalMarks
        if (examType === 'theory') {
          finalMarks = theoryTotal
        } else if (examType === 'practical') {
          finalMarks = practicalTotal
        } else {
          finalMarks = (theoryTotal * 0.6) + (practicalTotal * 0.4)
        }

        return {
          rollNo,
          name,
          ca,
          midsem,
          endsem,
          theoryTotal,
          labManual,
          labAssessment,
          viva,
          endPractical,
          practicalTotal,
          marks: Math.round(finalMarks * 10) / 10,
          maxMarks: 100,
          examType,
          subject: subjectName.trim(),
          subjectCode: subjectCode.trim(),
          credits: Number(credits) || 4,
          batch: batchName.trim(),
          semester: semester.trim(),
          academicYear: academicYear.trim(),
          uploadedOn: formattedDate,
          facultyId,
          facultyEmail
        }
      })

      // Duplicate Replacement Query
      const oldQuery = query(
        collection(db, 'records'),
        where('facultyId', '==', facultyId),
        where('subject', '==', subjectName.trim()),
        where('batch', '==', batchName.trim()),
        where('semester', '==', semester.trim()),
        where('academicYear', '==', academicYear.trim())
      )

      const oldDocs = await getDocs(oldQuery)
      const isUpdate = !oldDocs.empty

      // Delete existing records
      for (const docSnap of oldDocs.docs) {
        await deleteDoc(docSnap.ref)
      }

      // Write enriched records
      for (const rec of enrichedRecords) {
        await addDoc(collection(db, 'records'), rec)
      }

      // Update upload history
      const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]')
      history.push({
        subject: subjectName.trim(),
        batch: batchName.trim(),
        examType,
        count: enrichedRecords.length,
        date: formattedDate
      })
      localStorage.setItem('uploadHistory', JSON.stringify(history))

      if (isUpdate) {
        setAlert({
          type: 'success',
          message: `♻️ Existing records found. ${enrichedRecords.length} records have been replaced successfully. Please regenerate Relative Grades.`
        })
      } else {
        setAlert({
          type: 'success',
          message: `✅ ${enrichedRecords.length} student records uploaded successfully!`
        })
      }

      clearPreview()
    } catch (err) {
      console.error('Error saving records:', err)
      setAlert({ type: 'error', message: `⚠️ ${err.message || 'Could not save records.'}` })
    } finally {
      setLoading(false)
    }
  }

  const previewKeys = parsedData.length > 0 ? Object.keys(parsedData[0]) : []

  return (
    <main className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: 32 }} className="fade-up">
        <span className="page-badge">FACULTY PORTAL</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: '8px 0 6px' }}>
          📊 Upload Subject Marks
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Upload an Excel (.xlsx, .xls) or CSV file with student marks using the evaluation scheme.
        </p>
      </div>

      {/* Accepted Columns Banner */}
      <div className="eval-scheme fade-up">
        <h4>📋 Accepted Column Headers</h4>
        <div className="two-col" style={{ gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
              📖 Theory Columns
            </p>
            <div className="eval-row">
              <span className="eval-pill">rollNo / Roll No</span>
              <span className="eval-pill">name / Name</span>
              <span className="eval-pill">ca / CA</span>
              <span className="eval-pill">midsem / Midsem</span>
              <span className="eval-pill">endsem / Endsem</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 8 }}>
              🔬 Practical Columns
            </p>
            <div className="eval-row">
              <span className="eval-pill practical">labManual</span>
              <span className="eval-pill practical">labAssessment</span>
              <span className="eval-pill practical">viva</span>
              <span className="eval-pill practical">endPractical</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, marginBottom: 0 }}>
          💡 Column names are case-insensitive. If your spreadsheet has only a "marks" or "total" column, it will be automatically mapped.
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Upload Form Card */}
      <div className="card fade-up">
        <h3 style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>
          Subject Details
        </h3>

        <div className="two-col">
          <div>
            <label htmlFor="uploadSubjName">Subject Name *</label>
            <input
              id="uploadSubjName"
              type="text"
              placeholder="e.g. Database Management System"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label htmlFor="uploadCredits">Credits</label>
            <input
              id="uploadCredits"
              type="number"
              min="1"
              max="10"
              placeholder="e.g. 4"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="two-col">
          <div>
            <label htmlFor="uploadSubjCode">Subject Code</label>
            <input
              id="uploadSubjCode"
              type="text"
              placeholder="e.g. BCA301"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="uploadBatch">Batch *</label>
            <input
              id="uploadBatch"
              type="text"
              placeholder="e.g. BCA Division A"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="two-col">
          <div>
            <label htmlFor="uploadExamType">Exam Type *</label>
            <select
              id="uploadExamType"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              disabled={loading}
            >
              <option value="theory">Theory (CA + Midsem + Endsem)</option>
              <option value="practical">Practical (Lab + Viva + End Practical)</option>
              <option value="both">Theory + Practical (Combined 60/40)</option>
            </select>
          </div>
          <div>
            <label htmlFor="uploadSem">Semester</label>
            <input
              id="uploadSem"
              type="text"
              placeholder="e.g. Semester 3"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="two-col">
          <div>
            <label htmlFor="uploadYear">Academic Year</label>
            <input
              id="uploadYear"
              type="text"
              placeholder="e.g. 2025-26"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="uploadFileInput">Upload Excel / CSV File *</label>
            <input
              ref={fileInputRef}
              id="uploadFileInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={loading}
              style={{ padding: '8px' }}
            />
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {parsedData.length > 0 && (
        <div className="card fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
                Preview Parsed Records
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
                {parsedData.length} record(s) ready to be saved to database.
              </p>
            </div>
          </div>

          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  {previewKeys.map((k, i) => (
                    <th key={i}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 50).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {previewKeys.map((k, cIdx) => (
                      <td key={cIdx}>{row[k] !== undefined ? String(row[k]) : ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parsedData.length > 50 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              ... and {parsedData.length - 50} more rows
            </p>
          )}

          <div className="button-group">
            <button
              type="button"
              onClick={handleSaveRecords}
              className="btn-primary"
              disabled={loading}
              style={{ width: 'auto', padding: '12px 28px' }}
            >
              {loading ? 'Saving Records...' : '💾 Save Records to Database'}
            </button>
            <button
              type="button"
              onClick={clearPreview}
              className="btn-secondary"
              disabled={loading}
              style={{ width: 'auto', padding: '12px 20px' }}
            >
              ✕ Clear Preview
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default UploadExcel
