import { useState } from 'react'
import { useEvaluationSchemes } from '../hooks/useEvaluationSchemes'

function EvaluationSchemes() {
  const {
    activeScheme,
    customSchemes,
    builtInSchemes,
    selectActiveScheme,
    saveScheme,
    deleteScheme,
    validateEvaluationScheme,
    createEmptyEvaluationScheme
  } = useEvaluationSchemes()

  // Builder Form State
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formInstitution, setFormInstitution] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategories, setFormCategories] = useState([
    {
      id: 'cat-1',
      name: 'Theory',
      weight: 60,
      components: [
        { id: 'comp-1', name: 'Continuous Assessment', maxMarks: 25 },
        { id: 'comp-2', name: 'Mid-Semester Exam', maxMarks: 25 },
        { id: 'comp-3', name: 'End-Semester Exam', maxMarks: 50 }
      ]
    },
    {
      id: 'cat-2',
      name: 'Practical',
      weight: 40,
      components: [
        { id: 'comp-4', name: 'Lab Manual', maxMarks: 10 },
        { id: 'comp-5', name: 'Lab Assessment', maxMarks: 10 },
        { id: 'comp-6', name: 'Internal Viva', maxMarks: 30 },
        { id: 'comp-7', name: 'End Practical Exam', maxMarks: 50 }
      ]
    }
  ])

  const [alert, setAlert] = useState(null)

  // Calculate live total category weight
  const currentTotalWeight = formCategories.reduce(
    (sum, cat) => sum + (Number(cat.weight) || 0),
    0
  )
  const isWeightValid = Math.abs(currentTotalWeight - 100) < 0.01

  // Reset form
  const resetForm = () => {
    setEditingId(null)
    setFormName('')
    setFormInstitution('')
    setFormDescription('')
    const blank = createEmptyEvaluationScheme()
    setFormCategories(blank.categories)
    setAlert(null)
  }

  // Load scheme into form for editing or duplicating
  const loadSchemeIntoForm = (scheme, isDuplicate = false) => {
    setEditingId(isDuplicate ? null : (scheme.isCustom ? scheme.id : null))
    setFormName(isDuplicate ? `${scheme.name} (Copy)` : (scheme.isCustom ? scheme.name : `${scheme.name} (Custom)`))
    setFormInstitution(scheme.institution || '')
    setFormDescription(scheme.description || '')
    setFormCategories(
      scheme.categories.map(cat => ({
        ...cat,
        id: isDuplicate ? 'cat-' + Math.random().toString(36).substring(2, 9) : cat.id,
        components: cat.components.map(comp => ({
          ...comp,
          id: isDuplicate ? 'comp-' + Math.random().toString(36).substring(2, 9) : comp.id
        }))
      }))
    )
    setAlert({
      type: 'success',
      message: `Loaded "${scheme.name}" into builder. You can adjust weights and components below.`
    })
    window.scrollTo({ top: 380, behavior: 'smooth' })
  }

  // Category management
  const addCategory = () => {
    const remainingWeight = Math.max(0, 100 - currentTotalWeight)
    setFormCategories([
      ...formCategories,
      {
        id: 'cat-' + Date.now(),
        name: '',
        weight: remainingWeight || 20,
        components: [
          { id: 'comp-' + Date.now(), name: 'Assessment', maxMarks: 50 }
        ]
      }
    ])
  }

  const removeCategory = (catId) => {
    if (formCategories.length <= 1) {
      setAlert({ type: 'error', message: '⚠️ An evaluation scheme must have at least one category.' })
      return
    }
    setFormCategories(formCategories.filter(c => c.id !== catId))
  }

  const updateCategoryField = (catId, field, value) => {
    setFormCategories(formCategories.map(c => c.id === catId ? { ...c, [field]: value } : c))
  }

  // Component management inside a category
  const addComponent = (catId) => {
    setFormCategories(
      formCategories.map(cat => {
        if (cat.id !== catId) return cat
        return {
          ...cat,
          components: [
            ...cat.components,
            { id: 'comp-' + Date.now() + Math.random().toString(36).substring(2, 5), name: '', maxMarks: 50 }
          ]
        }
      })
    )
  }

  const removeComponent = (catId, compId) => {
    setFormCategories(
      formCategories.map(cat => {
        if (cat.id !== catId) return cat
        if (cat.components.length <= 1) {
          setAlert({ type: 'error', message: '⚠️ Each category must contain at least one component.' })
          return cat
        }
        return {
          ...cat,
          components: cat.components.filter(cp => cp.id !== compId)
        }
      })
    )
  }

  const updateComponentField = (catId, compId, field, value) => {
    setFormCategories(
      formCategories.map(cat => {
        if (cat.id !== catId) return cat
        return {
          ...cat,
          components: cat.components.map(comp => comp.id === compId ? { ...comp, [field]: value } : comp)
        }
      })
    )
  }

  // Save Scheme
  const handleSaveScheme = () => {
    setAlert(null)

    const cleanedScheme = {
      id: editingId || 'scheme-' + Date.now(),
      name: formName.trim(),
      institution: formInstitution.trim(),
      description: formDescription.trim(),
      isCustom: true,
      categories: formCategories.map(cat => ({
        id: cat.id,
        name: cat.name.trim(),
        weight: Number(cat.weight) || 0,
        components: cat.components.map(comp => ({
          id: comp.id,
          name: comp.name.trim(),
          maxMarks: Number(comp.maxMarks) || 0
        }))
      }))
    }

    const errors = validateEvaluationScheme(cleanedScheme)
    if (errors.length > 0) {
      setAlert({
        type: 'error',
        message: `⚠️ Validation Error: ${errors.join(' • ')}`
      })
      return
    }

    saveScheme(cleanedScheme)
    setEditingId(cleanedScheme.id)
    setAlert({
      type: 'success',
      message: `✅ Evaluation scheme "${cleanedScheme.name}" saved successfully!`
    })
  }

  // Render Scheme Library Card
  const renderSchemeCard = (scheme) => {
    const isActive = activeScheme?.id === scheme.id

    return (
      <div
        key={scheme.id}
        className="card"
        style={{
          margin: 0,
          border: isActive ? '2px solid var(--primary-mid)' : '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
          <div>
            <h3 style={{ color: 'var(--primary)', fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
              {scheme.name}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
              {scheme.institution || 'Institutional Scheme'}
            </p>
          </div>
          <span className={`badge ${scheme.isCustom ? 'badge-purple' : 'badge-blue'}`}>
            {scheme.isCustom ? 'Custom' : 'Standard'}
          </span>
        </div>

        {scheme.description && (
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.4 }}>
            {scheme.description}
          </p>
        )}

        {/* Categories breakdown pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {scheme.categories.map((cat, idx) => (
            <span
              key={idx}
              className={`eval-pill ${idx % 2 === 1 ? 'practical' : ''}`}
              style={{ fontSize: 11.5, padding: '4px 9px' }}
            >
              {cat.name} ({cat.weight}%) — {cat.components.length} components
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              selectActiveScheme(scheme.id)
              setAlert({ type: 'success', message: `✅ "${scheme.name}" is now the active Evaluation Scheme.` })
            }}
            style={{ width: 'auto', padding: '7px 14px', fontSize: 12.5 }}
          >
            {isActive ? '✅ Active' : 'Set Active'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadSchemeIntoForm(scheme, !scheme.isCustom)}
            style={{ width: 'auto', padding: '7px 14px', fontSize: 12.5 }}
          >
            ⧉ Customize / Edit
          </button>

          {scheme.isCustom && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                if (window.confirm(`Delete evaluation scheme "${scheme.name}"? This cannot be undone.`)) {
                  deleteScheme(scheme.id)
                  setAlert({ type: 'success', message: '🗑️ Evaluation scheme deleted.' })
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
      {/* Page Header */}
      <div style={{ marginBottom: 32 }} className="fade-up">
        <span className="page-badge">EVALUATION ARCHITECTURE</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: '8px 0 6px' }}>
          📋 Evaluation Scheme Builder
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Create and customize assessment categories (Theory, Practical, Internal, Project, etc.), allocate percentage weights, and define maximum marks per assessment component.
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Built-in Scheme Templates Library */}
      <div className="card fade-up">
        <h3 style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
          📚 Evaluation Scheme Templates
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {builtInSchemes.map(renderSchemeCard)}
        </div>
      </div>

      {/* Custom Evaluation Scheme Builder */}
      <div className="card fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, margin: 0 }}>
            {editingId ? `🛠️ Editing Scheme: ${formName}` : '🛠️ Custom Evaluation Scheme Builder'}
          </h3>
          {editingId && (
            <span className="badge badge-purple">Editing Custom ID: {editingId}</span>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '0 0 20px' }}>
          Define the weighted categories and assessment sub-components that convert raw marks into final subject scores.
        </p>

        {/* Basic Information */}
        <div className="two-col">
          <div>
            <label htmlFor="schemeNameInput">Scheme Name *</label>
            <input
              id="schemeNameInput"
              type="text"
              placeholder="e.g. Engineering 70/30 (Theory + Practical)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="schemeInstInput">Institution / Department</label>
            <input
              id="schemeInstInput"
              type="text"
              placeholder="e.g. Department of Computer Science"
              value={formInstitution}
              onChange={(e) => setFormInstitution(e.target.value)}
            />
          </div>
        </div>

        <label htmlFor="schemeDescInput">Description (Optional)</label>
        <input
          id="schemeDescInput"
          type="text"
          placeholder="e.g. Evaluation scheme for B.Tech CS subjects starting Academic Year 2026."
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
        />

        {/* Live Weight Tracker Indicator */}
        <div style={{ background: isWeightValid ? 'rgba(5,150,105,0.06)' : 'rgba(220,38,38,0.06)', border: `1px solid ${isWeightValid ? '#a7f3d0' : '#fecaca'}`, borderRadius: 'var(--radius-sm)', padding: '14px 18px', margin: '18px 0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: isWeightValid ? '#065f46' : '#991b1b' }}>
              Total Category Weight: {currentTotalWeight}%
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: isWeightValid ? '#059669' : '#dc2626' }}>
              {isWeightValid ? '✅ Valid (Exactly 100%)' : `⚠️ Must equal 100% (${100 - currentTotalWeight > 0 ? `+${100 - currentTotalWeight}% needed` : `${currentTotalWeight - 100}% over`})`}
            </span>
          </div>

          <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(currentTotalWeight, 100)}%`,
                height: '100%',
                background: isWeightValid ? 'linear-gradient(90deg, #059669, #10b981)' : '#dc2626',
                borderRadius: 4,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Category List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: 16, fontWeight: 700 }}>
            Evaluation Categories ({formCategories.length})
          </h4>
          <button
            type="button"
            onClick={addCategory}
            className="btn-secondary"
            style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
          >
            + Add Category
          </button>
        </div>

        {formCategories.map((cat, catIdx) => (
          <div
            key={cat.id}
            className="card"
            style={{
              background: 'rgba(248, 250, 252, 0.85)',
              border: '1.5px solid var(--border)',
              padding: 20,
              marginBottom: 18
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Category #{catIdx + 1}
              </span>
              {formCategories.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
                  className="btn-danger"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }}
                >
                  ✕ Remove Category
                </button>
              )}
            </div>

            <div className="two-col">
              <div>
                <label>Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Theory / Practical / Internal / Project"
                  value={cat.name}
                  onChange={(e) => updateCategoryField(cat.id, 'name', e.target.value)}
                />
              </div>
              <div>
                <label>Weight Percentage (%) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 60"
                  value={cat.weight}
                  onChange={(e) => updateCategoryField(cat.id, 'weight', e.target.value)}
                />
              </div>
            </div>

            {/* Assessment Components Table */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                  Assessment Components in {cat.name || `Category ${catIdx + 1}`}:
                </span>
                <button
                  type="button"
                  onClick={() => addComponent(cat.id)}
                  className="btn-secondary"
                  style={{ width: 'auto', padding: '4px 12px', fontSize: 11.5 }}
                >
                  + Add Component
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '55%' }}>Component Name</th>
                      <th style={{ width: '35%' }}>Maximum Marks</th>
                      <th style={{ width: '10%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.components.map((comp) => (
                      <tr key={comp.id}>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. Continuous Assessment (CA)"
                            value={comp.name}
                            onChange={(e) => updateComponentField(cat.id, comp.id, 'name', e.target.value)}
                            style={{ margin: 0, padding: '7px 10px', fontSize: 13 }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            placeholder="e.g. 25"
                            value={comp.maxMarks}
                            onChange={(e) => updateComponentField(cat.id, comp.id, 'maxMarks', e.target.value)}
                            style={{ margin: 0, padding: '7px 10px', fontSize: 13 }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {cat.components.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeComponent(cat.id, comp.id)}
                              className="btn-danger"
                              style={{ width: 'auto', padding: '4px 8px', fontSize: 11 }}
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {/* Builder Action Buttons */}
        <div className="button-group" style={{ marginTop: 20 }}>
          <button
            type="button"
            onClick={handleSaveScheme}
            className="btn-primary"
            style={{ width: 'auto', padding: '12px 28px' }}
          >
            💾 Save Evaluation Scheme
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="btn-secondary"
            style={{ width: 'auto', padding: '12px 20px' }}
          >
            ✕ New / Clear Form
          </button>
        </div>
      </div>

      {/* Saved Custom Schemes */}
      <div className="fade-up" style={{ marginTop: 32 }}>
        <h2 className="section-title">Your Custom Evaluation Schemes</h2>
        {customSchemes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧩</div>
            <h3>No custom schemes created yet</h3>
            <p>Use the builder above to create an evaluation scheme tailored to your university curriculum, or customize an existing template.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            {customSchemes.map(renderSchemeCard)}
          </div>
        )}
      </div>
    </main>
  )
}

export default EvaluationSchemes
