import { useState } from 'react'
import { useGradingSystems } from '../hooks/useGradingSystems'

function GradingSystems() {
  const {
    activeAbsolute,
    activeRelative,
    customSystems,
    absoluteSystems,
    relativeSystems,
    selectActiveAbsolute,
    selectActiveRelative,
    saveSystem,
    deleteSystem,
    validateSystem,
    createEmptySystem
  } = useGradingSystems()

  // Builder Form State
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formUniversity, setFormUniversity] = useState('')
  const [formMode, setFormMode] = useState('relative-rank') // 'absolute' | 'relative-rank' | 'relative-zscore'
  const [formPassingGP, setFormPassingGP] = useState(4)
  const [formDescription, setFormDescription] = useState('')
  const [formRules, setFormRules] = useState([
    { grade: 'O', startRank: 1, min: 1, gradePoint: 10 },
    { grade: 'A+', startRank: 6, min: 6, gradePoint: 9 },
    { grade: 'A', startRank: 11, min: 11, gradePoint: 8 },
    { grade: 'B+', startRank: 21, min: 21, gradePoint: 7 },
    { grade: 'B', startRank: 31, min: 31, gradePoint: 6 },
    { grade: 'C', startRank: 41, min: 41, gradePoint: 5 },
    { grade: 'D', startRank: 51, min: 51, gradePoint: 4 },
    { grade: 'F', startRank: 61, min: 61, gradePoint: 0 }
  ])

  const [alert, setAlert] = useState(null)

  const isRankBased = formMode === 'relative-rank'
  const isZScore = formMode === 'relative-zscore'
  const isAbsolute = formMode === 'absolute'

  // Reset form
  const resetForm = () => {
    setEditingId(null)
    setFormName('')
    setFormUniversity('')
    setFormMode('relative-rank')
    setFormPassingGP(4)
    setFormDescription('')
    const blank = createEmptySystem('relative', 'rank')
    setFormRules(blank.rules)
    setAlert(null)
  }

  // Load system into form for editing / duplicating
  const loadSystemIntoForm = (system, isDuplicate = false) => {
    setEditingId(isDuplicate ? null : (system.isCustom ? system.id : null))
    setFormName(isDuplicate ? `${system.name} (Copy)` : (system.isCustom ? system.name : `${system.name} (Custom)`))
    setFormUniversity(system.university || '')
    
    let modeKey = 'absolute'
    if (system.mode === 'relative') {
      modeKey = system.method === 'z-score' ? 'relative-zscore' : 'relative-rank'
    }
    setFormMode(modeKey)
    setFormPassingGP(system.passingGradePoint ?? 4)
    setFormDescription(system.description || '')
    setFormRules(system.rules.map(r => ({ ...r })))
    setAlert({
      type: 'success',
      message: `Loaded "${system.name}" into the builder. Customize rules below and click Save.`
    })
    window.scrollTo({ top: 350, behavior: 'smooth' })
  }

  // Rule management
  const addRule = () => {
    if (isRankBased) {
      const highestStart = Math.max(...formRules.map(r => Number(r.startRank || r.min) || 0), 0)
      setFormRules([
        ...formRules,
        { grade: '', startRank: highestStart + 10, min: highestStart + 10, gradePoint: '' }
      ])
    } else {
      setFormRules([
        ...formRules,
        { grade: '', min: '', max: '', gradePoint: '' }
      ])
    }
  }

  const removeRule = (idx) => {
    if (formRules.length <= 1) return
    setFormRules(formRules.filter((_, i) => i !== idx))
  }

  const updateRule = (idx, field, value) => {
    setFormRules(formRules.map((r, i) => {
      if (i !== idx) return r
      if (field === 'startRank') {
        return { ...r, startRank: value, min: value }
      }
      return { ...r, [field]: value }
    }))
  }

  // Save System
  const handleSave = () => {
    setAlert(null)

    const actualMode = isAbsolute ? 'absolute' : 'relative'
    const actualMethod = isRankBased ? 'rank' : (isZScore ? 'z-score' : undefined)

    let cleanedRules
    if (isRankBased) {
      cleanedRules = formRules.map(r => {
        const sRank = Number(r.startRank !== undefined ? r.startRank : r.min) || 1
        return {
          grade: String(r.grade || '').trim(),
          startRank: sRank,
          min: sRank,
          gradePoint: Number(r.gradePoint)
        }
      })
      // Sort ascending by startRank for storage
      cleanedRules.sort((a, b) => a.startRank - b.startRank)
    } else {
      cleanedRules = formRules.map(r => ({
        grade: String(r.grade || '').trim(),
        min: r.min === '' || r.min === -Infinity ? -Infinity : Number(r.min),
        max: r.max === '' || r.max === Infinity ? Infinity : Number(r.max),
        gradePoint: Number(r.gradePoint)
      }))
    }

    const systemData = {
      id: editingId || `custom-${Date.now()}`,
      name: formName.trim(),
      university: formUniversity.trim(),
      mode: actualMode,
      method: actualMethod,
      description: formDescription.trim(),
      passingGradePoint: Number(formPassingGP) || 0,
      isCustom: true,
      rules: cleanedRules
    }

    const errors = validateSystem(systemData)
    if (errors.length > 0) {
      setAlert({
        type: 'error',
        message: `⚠️ ${errors.join(' • ')}`
      })
      return
    }

    saveSystem(systemData)
    setEditingId(systemData.id)
    setAlert({
      type: 'success',
      message: `✅ "${systemData.name}" saved! You can now activate it from the list below.`
    })
  }

  // Card component for library items
  const renderSystemCard = (sys) => {
    const isActive = (sys.mode === 'relative' && activeRelative?.id === sys.id) ||
                     (sys.mode === 'absolute' && activeAbsolute?.id === sys.id)

    return (
      <div
        key={sys.id}
        className="card"
        style={{
          margin: 0,
          border: isActive ? '2px solid var(--primary-mid)' : '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
          <div>
            <h3 style={{ color: 'var(--primary)', fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
              {sys.name}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
              {sys.university || '—'}
            </p>
          </div>
          <span className={`badge ${sys.mode === 'relative' ? 'badge-purple' : 'badge-blue'}`}>
            {sys.mode === 'relative' ? (sys.method === 'z-score' ? 'Relative (Z-Score)' : 'Relative (Rank)') : 'Absolute'}
          </span>
        </div>

        {sys.description && (
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.4 }}>
            {sys.description}
          </p>
        )}

        {/* Rule preview pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {sys.rules.slice(0, 4).map((r, i) => (
            <span key={i} className={`eval-pill ${sys.mode === 'relative' ? 'practical' : ''}`} style={{ fontSize: 11, padding: '4px 8px' }}>
              {r.grade} {r.startRank !== undefined ? `(Rank ${r.startRank}+)` : ''} → GP {r.gradePoint}
            </span>
          ))}
          {sys.rules.length > 4 && (
            <span className="eval-pill" style={{ fontSize: 11, padding: '4px 8px' }}>
              +{sys.rules.length - 4} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (sys.mode === 'relative') selectActiveRelative(sys.id)
              else selectActiveAbsolute(sys.id)
              setAlert({ type: 'success', message: `✅ "${sys.name}" is now the active ${sys.mode} grading system.` })
            }}
            style={{ width: 'auto', padding: '7px 14px', fontSize: 12.5 }}
          >
            {isActive ? '✅ Active' : 'Set Active'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadSystemIntoForm(sys, !sys.isCustom)}
            style={{ width: 'auto', padding: '7px 14px', fontSize: 12.5 }}
          >
            ⧉ Duplicate / Edit
          </button>

          {sys.isCustom && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                if (window.confirm(`Delete "${sys.name}"? This cannot be undone.`)) {
                  deleteSystem(sys.id)
                  setAlert({ type: 'success', message: '🗑️ Custom grading system deleted.' })
                }
              }}
              style={{ width: 'auto', padding: '7px 14px', fontSize: 12.5 }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <main className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: 32 }} className="fade-up">
        <span className="page-badge">UNIVERSAL GRADING</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: '8px 0 6px' }}>
          ⚙️ Grading Systems
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Browse built-in university grading scales, or build your own custom system — <strong>Rank-Based Relative</strong>, <strong>Absolute (Fixed %)</strong>, or <strong>Statistical (Z-Score)</strong>.
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Library Grid */}
      <div className="card fade-up">
        <h3 style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
          📚 Built-in Grading Scales
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {[...absoluteSystems.filter(s => !s.isCustom), ...relativeSystems.filter(s => !s.isCustom)].map(renderSystemCard)}
        </div>
      </div>

      {/* Custom Grading Builder Form */}
      <div className="card fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, margin: 0 }}>
            {editingId ? `🛠️ Editing: ${formName}` : '🛠️ Custom Grading Builder'}
          </h3>
          {editingId && (
            <span className="badge badge-purple">Editing Custom ID: {editingId}</span>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '0 0 20px' }}>
          Define grade names, cutoffs, and grade points for your institution.
        </p>

        <div className="two-col">
          <div>
            <label htmlFor="sysNameInput">System Name *</label>
            <input
              id="sysNameInput"
              type="text"
              placeholder="e.g. My College Rank-Based 10-Point Scale"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="sysUnivInput">University / College</label>
            <input
              id="sysUnivInput"
              type="text"
              placeholder="e.g. ABC Engineering College"
              value={formUniversity}
              onChange={(e) => setFormUniversity(e.target.value)}
            />
          </div>
        </div>

        <div className="two-col">
          <div>
            <label htmlFor="sysModeSelect">Grading Methodology</label>
            <select
              id="sysModeSelect"
              value={formMode}
              onChange={(e) => {
                const mode = e.target.value
                setFormMode(mode)
                let blank
                if (mode === 'relative-rank') blank = createEmptySystem('relative', 'rank')
                else if (mode === 'relative-zscore') blank = createEmptySystem('relative', 'z-score')
                else blank = createEmptySystem('absolute')
                setFormRules(blank.rules)
              }}
            >
              <option value="relative-rank">Rank-Based Relative (Cohort starting rank thresholds)</option>
              <option value="absolute">Absolute (Fixed % marks ranges)</option>
              <option value="relative-zscore">Statistical Relative (Z-Score / bell-curve ranges)</option>
            </select>
          </div>
          <div>
            <label htmlFor="sysPassGPInput">Passing Grade Point</label>
            <input
              id="sysPassGPInput"
              type="number"
              min="0"
              max="10"
              placeholder="e.g. 4"
              value={formPassingGP}
              onChange={(e) => setFormPassingGP(e.target.value)}
            />
          </div>
        </div>

        <label htmlFor="sysDescInput">Description (Optional)</label>
        <input
          id="sysDescInput"
          type="text"
          placeholder="Short note about this grading system circular or guidelines"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
        />

        {/* Grade Rules Table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 10px', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <label style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
              {isRankBased ? 'Rank Threshold Rules (Starting Rank Model)' : 'Grade Threshold Rules'}
            </label>
            {isRankBased && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Each grade begins at its specified Starting Rank and automatically extends until the next grade threshold.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={addRule}
            className="btn-secondary"
            style={{ width: 'auto', padding: '8px 16px', fontSize: 12.5 }}
          >
            + Add Grade Row
          </button>
        </div>

        <div className="table-wrap" style={{ marginBottom: 20 }}>
          <table>
            <thead>
              {isRankBased ? (
                <tr>
                  <th style={{ width: '35%' }}>Grade Name</th>
                  <th style={{ width: '35%' }}>Starting Rank (Integer ≥ 1)</th>
                  <th style={{ width: '20%' }}>Grade Point</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: '25%' }}>Grade Name</th>
                  <th style={{ width: '25%' }}>{isZScore ? 'Min Z-Score' : 'Min Marks (%)'}</th>
                  <th style={{ width: '25%' }}>{isZScore ? 'Max Z-Score' : 'Max Marks (%)'}</th>
                  <th style={{ width: '15%' }}>Grade Point</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              )}
            </thead>
            <tbody>
              {formRules.map((rule, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      placeholder="e.g. O or A+"
                      value={rule.grade}
                      onChange={(e) => updateRule(idx, 'grade', e.target.value)}
                      style={{ margin: 0, padding: '8px 10px', fontSize: 13 }}
                    />
                  </td>
                  {isRankBased ? (
                    <td>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 1, 6, 11, 21"
                        value={rule.startRank !== undefined ? rule.startRank : rule.min}
                        onChange={(e) => updateRule(idx, 'startRank', e.target.value)}
                        style={{ margin: 0, padding: '8px 10px', fontSize: 13 }}
                      />
                    </td>
                  ) : (
                    <>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="min"
                          value={rule.min === -Infinity ? '' : rule.min}
                          onChange={(e) => updateRule(idx, 'min', e.target.value)}
                          style={{ margin: 0, padding: '8px 10px', fontSize: 13 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="max (blank = ∞)"
                          value={rule.max === Infinity ? '' : rule.max}
                          onChange={(e) => updateRule(idx, 'max', e.target.value)}
                          style={{ margin: 0, padding: '8px 10px', fontSize: 13 }}
                        />
                      </td>
                    </>
                  )}
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0–10"
                      value={rule.gradePoint}
                      onChange={(e) => updateRule(idx, 'gradePoint', e.target.value)}
                      style={{ margin: 0, padding: '8px 10px', fontSize: 13 }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      className="btn-danger"
                      style={{ width: 'auto', padding: '6px 10px', fontSize: 11 }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="button-group">
          <button type="button" onClick={handleSave} className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
            💾 Save Grading System
          </button>
          <button type="button" onClick={resetForm} className="btn-secondary" style={{ width: 'auto', padding: '12px 20px' }}>
            ✕ New / Clear Form
          </button>
        </div>
      </div>

      {/* Saved Custom Systems */}
      <div className="fade-up" style={{ marginTop: 32 }}>
        <h2 className="section-title">Your Custom Grading Systems</h2>
        {customSystems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧩</div>
            <h3>No custom grading systems yet</h3>
            <p>Use the builder above to create one, or duplicate a system from the library to start editing.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {customSystems.map(renderSystemCard)}
          </div>
        )}
      </div>
    </main>
  )
}

export default GradingSystems