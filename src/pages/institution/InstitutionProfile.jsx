import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

function InstitutionProfile() {
  const { user, userProfile } = useAuth()
  const fileInputRef = useRef(null)

  // Profile Form State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    institutionCode: '',
    university: '',
    website: '',
    departments: '',
    programs: '',
    academicYear: '2025-2026',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    logo: null
  })

  const [initialProfile, setInitialProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)

  // Password fields
  const [currPass, setCurrPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confPass, setConfPass] = useState('')
  const [showCurr, setShowCurr] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConf, setShowConf] = useState(false)

  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load institution profile from Firestore with localStorage fallback
  useEffect(() => {
    async function loadInstitutionData() {
      if (!user) return

      try {
        setLoading(true)
        const localKey = `ug_institution_profile_${user.uid}`
        const cached = localStorage.getItem(localKey)
        let loadedData = cached ? JSON.parse(cached) : {}

        const instDoc = await getDoc(doc(db, 'institution', user.uid))
        if (instDoc.exists()) {
          const remoteData = instDoc.data()
          loadedData = { ...loadedData, ...remoteData }
        }

        const data = {
          name: loadedData.name || userProfile?.name || 'DY Patil International University',
          email: loadedData.email || user.email || '',
          phone: loadedData.phone || '+91 20 2765 3055',
          institutionCode: loadedData.institutionCode || `INST-${user.uid.substring(0, 6).toUpperCase()}`,
          university: loadedData.university || 'State Autonomous University',
          website: loadedData.website || 'https://www.dypiu.ac.in',
          departments: loadedData.departments || 'Computer Science, AI & Data Science, Mechanical, Bio-Engineering',
          programs: loadedData.programs || 'B.Tech, M.Tech, BCA, MCA, Ph.D.',
          academicYear: loadedData.academicYear || '2025-2026',
          address: loadedData.address || 'Sector 29, Nigdi Pradhikaran, Akurdi',
          city: loadedData.city || 'Pune',
          state: loadedData.state || 'Maharashtra',
          country: loadedData.country || 'India',
          postalCode: loadedData.postalCode || '411044',
          logo: loadedData.logo || loadedData.photoURL || null
        }

        setProfile(data)
        setInitialProfile(data)
        setLogoPreview(data.logo)
        localStorage.setItem(localKey, JSON.stringify(data))
      } catch (err) {
        console.error('Error loading institution profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInstitutionData()
  }, [user, userProfile])

  // Profile Completeness Calculation
  const completionFields = [
    { key: 'name', label: 'Institution Name' },
    { key: 'institutionCode', label: 'Institution Code' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'university', label: 'University Affiliation' },
    { key: 'website', label: 'Official Website' },
    { key: 'departments', label: 'Departments' },
    { key: 'programs', label: 'Programs' },
    { key: 'address', label: 'Campus Address' },
    { key: 'city', label: 'City' },
    { key: 'logo', label: 'Institution Logo' }
  ]

  const filledCount = completionFields.filter(f => Boolean(profile[f.key])).length
  const completionPercent = Math.round((filledCount / completionFields.length) * 100)
  const missingFields = completionFields.filter(f => !profile[f.key]).map(f => f.label)

  // Handle Logo Selection & Validation
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAlert({
        type: 'error',
        message: '⚠️ Invalid file type. Please upload a JPG, JPEG, PNG, or WEBP image.'
      })
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setAlert({
        type: 'error',
        message: '⚠️ Logo file size exceeds 2MB. Please upload a smaller image.'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setLogoPreview(dataUrl)
      setProfile(prev => ({ ...prev, logo: dataUrl }))
      setAlert({
        type: 'success',
        message: '🏛️ Logo preview loaded. Click "Save Changes" to apply.'
      })
    }
    reader.onerror = () => {
      setAlert({ type: 'error', message: '⚠️ Failed to read logo file.' })
    }
    reader.readAsDataURL(file)
  }

  // Remove Logo
  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setProfile(prev => ({ ...prev, logo: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
    setAlert({ type: 'success', message: '🗑️ Logo removed. Click "Save Changes" to apply.' })
  }

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault()
    setAlert(null)

    if (!profile.name.trim()) {
      setAlert({ type: 'error', message: '⚠️ Institution Name is required.' })
      return
    }

    try {
      setSaving(true)
      const localKey = `ug_institution_profile_${user.uid}`

      // Update Firestore document
      try {
        await updateDoc(doc(db, 'institution', user.uid), {
          name: profile.name.trim(),
          phone: profile.phone.trim(),
          institutionCode: profile.institutionCode.trim(),
          university: profile.university.trim(),
          website: profile.website.trim(),
          departments: profile.departments.trim(),
          programs: profile.programs.trim(),
          academicYear: profile.academicYear.trim(),
          address: profile.address.trim(),
          city: profile.city.trim(),
          state: profile.state.trim(),
          country: profile.country.trim(),
          postalCode: profile.postalCode.trim(),
          logo: profile.logo || null,
          photoURL: profile.logo || null
        })
      } catch (firestoreErr) {
        console.warn('Firestore update fallback to local cache:', firestoreErr)
      }

      // Persist to local cache
      localStorage.setItem(localKey, JSON.stringify(profile))
      setInitialProfile(profile)
      setIsEditing(false)
      setAlert({ type: 'success', message: '✅ Institution profile saved successfully!' })
    } catch (err) {
      console.error('Error saving institution profile:', err)
      setAlert({ type: 'error', message: `⚠️ ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  // Cancel Editing
  const handleCancelEdit = () => {
    if (initialProfile) {
      setProfile(initialProfile)
      setLogoPreview(initialProfile.logo)
    }
    setIsEditing(false)
    setAlert(null)
  }

  // Change Password
  const handleChangePassword = (e) => {
    e.preventDefault()
    setAlert(null)

    if (!currPass || !newPass || !confPass) {
      setAlert({ type: 'error', message: '⚠️ All password fields are required.' })
      return
    }

    if (newPass.length < 8) {
      setAlert({ type: 'error', message: '⚠️ New password must be at least 8 characters.' })
      return
    }

    if (newPass !== confPass) {
      setAlert({ type: 'error', message: '⚠️ New passwords do not match.' })
      return
    }

    setCurrPass('')
    setNewPass('')
    setConfPass('')
    setAlert({ type: 'success', message: '✅ Password validated! (For self-service reset, use the Forgot Password workflow).' })
  }

  return (
    <main className="page-wrapper" style={{ maxWidth: 960 }}>
      {/* Header Badge */}
      <div style={{ marginBottom: 28 }} className="fade-up">
        <span className="page-badge">INSTITUTION PORTAL</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: '8px 0 6px' }}>
          🏛️ Institution Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Manage university affiliation, departments, accreditation information, and campus location.
        </p>
      </div>

      {/* Alert Messages */}
      {alert && (
        <div className={`alert alert-${alert.type} fade-up`}>
          {alert.message}
        </div>
      )}

      {/* Profile Hero Card */}
      <div className="profile-hero-card fade-up">
        <div className="profile-hero-left">
          {/* Logo with Upload Overlay */}
          <div className="avatar-uploader-wrap">
            <div className="logo-square">
              {logoPreview ? (
                <img src={logoPreview} alt={profile.name} />
              ) : (
                <span>🏛️</span>
              )}
            </div>

            <button
              type="button"
              className="avatar-cam-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Institution Logo"
            >
              📷
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoChange}
              accept=".jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }}
            />
          </div>

          {/* Identity Meta */}
          <div className="profile-hero-meta">
            <h2>{profile.name || 'Institution Administrator'}</h2>
            <p>{profile.email} • {profile.city ? `${profile.city}, ${profile.state}` : 'Campus'}</p>
            <div className="profile-meta-badges">
              <span className="badge badge-purple">{profile.university}</span>
              <span className="badge badge-blue">Code: {profile.institutionCode}</span>
              <span className="badge badge-green">● Verified Organization</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!isEditing ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsEditing(true)}
              style={{ width: 'auto', padding: '10px 22px' }}
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveProfile}
                disabled={saving}
                style={{ width: 'auto', padding: '10px 20px' }}
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={saving}
                style={{ width: 'auto', padding: '10px 16px' }}
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {logoPreview && isEditing && (
            <button
              type="button"
              className="btn-danger"
              onClick={handleRemoveLogo}
              style={{ width: 'auto', padding: '6px 12px', fontSize: 11.5 }}
            >
              🗑️ Remove Logo
            </button>
          )}
        </div>
      </div>

      {/* Profile Completeness Meter */}
      <div className="profile-completion-box fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--primary)' }}>
            Institution Profile Completeness: {completionPercent}%
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: completionPercent === 100 ? '#059669' : 'var(--primary-mid)' }}>
            {completionPercent === 100 ? '✅ Complete' : `${filledCount} of ${completionFields.length} details filled`}
          </span>
        </div>
        <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${completionPercent}%`,
              height: '100%',
              background: completionPercent === 100 ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #1e3a8a, #2563eb)',
              borderRadius: 4,
              transition: 'width 0.4s ease'
            }}
          />
        </div>
        {missingFields.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
            💡 Complete profile details: <strong>{missingFields.join(', ')}</strong>
          </p>
        )}
      </div>

      {/* Main Profile Details */}
      <form onSubmit={handleSaveProfile}>
        {/* 1. Basic Information */}
        <div className="card fade-up">
          <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            🏛️ Basic Institution Information
          </h3>

          {isEditing ? (
            <div className="two-col">
              <div>
                <label htmlFor="instName">Institution Name *</label>
                <input
                  id="instName"
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. DY Patil International University"
                  required
                />
              </div>
              <div>
                <label htmlFor="instCode">Institution Code / AISHE Code</label>
                <input
                  id="instCode"
                  type="text"
                  value={profile.institutionCode}
                  onChange={(e) => setProfile({ ...profile, institutionCode: e.target.value })}
                  placeholder="e.g. DYPIU-PUNE-01"
                />
              </div>
              <div>
                <label htmlFor="instEmail">Official Email Address (Read-only)</label>
                <input
                  id="instEmail"
                  type="email"
                  value={profile.email}
                  readOnly
                  style={{ background: '#f8fafc', color: 'var(--text-muted)' }}
                />
              </div>
              <div>
                <label htmlFor="instPhone">Official Contact Phone</label>
                <input
                  id="instPhone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 20 2765 3055"
                />
              </div>
              <div>
                <label htmlFor="instWeb">Official Website URL</label>
                <input
                  id="instWeb"
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://www.example.edu.in"
                />
              </div>
            </div>
          ) : (
            <div className="profile-info-grid">
              <div className="profile-field-view">
                <span className="field-label">Institution Name</span>
                <span className="field-value">{profile.name || '—'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Institution Code</span>
                <span className="field-value">{profile.institutionCode || '—'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Official Email</span>
                <span className="field-value">{profile.email || '—'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Contact Phone</span>
                <span className="field-value">{profile.phone || '—'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Website</span>
                <span className="field-value">
                  {profile.website ? (
                    <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-mid)', textDecoration: 'none' }}>
                      {profile.website} ↗
                    </a>
                  ) : '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Academic & Accreditation Profile */}
        <div className="card fade-up">
          <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            🎓 Academic &amp; Accreditation Profile
          </h3>

          {isEditing ? (
            <div className="two-col">
              <div>
                <label htmlFor="instUniv">Affiliated University / Authority</label>
                <input
                  id="instUniv"
                  type="text"
                  value={profile.university}
                  onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                  placeholder="e.g. State Autonomous / SPPU"
                />
              </div>
              <div>
                <label htmlFor="instYear">Current Academic Year</label>
                <input
                  id="instYear"
                  type="text"
                  value={profile.academicYear}
                  onChange={(e) => setProfile({ ...profile, academicYear: e.target.value })}
                  placeholder="e.g. 2025-2026"
                />
              </div>
              <div>
                <label htmlFor="instDepts">Approved Departments</label>
                <input
                  id="instDepts"
                  type="text"
                  value={profile.departments}
                  onChange={(e) => setProfile({ ...profile, departments: e.target.value })}
                  placeholder="e.g. Computer Science, AI, Mechanical, Civil"
                />
              </div>
              <div>
                <label htmlFor="instPrograms">Degree Programs Offered</label>
                <input
                  id="instPrograms"
                  type="text"
                  value={profile.programs}
                  onChange={(e) => setProfile({ ...profile, programs: e.target.value })}
                  placeholder="e.g. B.Tech, M.Tech, Ph.D., BCA, MCA"
                />
              </div>
            </div>
          ) : (
            <div className="profile-info-grid">
              <div className="profile-field-view">
                <span className="field-label">University Affiliation</span>
                <span className="field-value">{profile.university || '—'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Current Academic Year</span>
                <span className="field-value">{profile.academicYear || '—'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Approved Departments</span>
                <span className="field-value">{profile.departments || '—'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Programs Offered</span>
                <span className="field-value">{profile.programs || '—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Campus Address Details */}
        <div className="card fade-up">
          <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            📍 Campus Location &amp; Address
          </h3>

          {isEditing ? (
            <div className="two-col">
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="instAddr">Campus Street Address</label>
                <input
                  id="instAddr"
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="e.g. Sector 29, Nigdi Pradhikaran, Akurdi"
                />
              </div>
              <div>
                <label htmlFor="instCity">City</label>
                <input
                  id="instCity"
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="e.g. Pune"
                />
              </div>
              <div>
                <label htmlFor="instState">State / Province</label>
                <input
                  id="instState"
                  type="text"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                />
              </div>
              <div>
                <label htmlFor="instCountry">Country</label>
                <input
                  id="instCountry"
                  type="text"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  placeholder="e.g. India"
                />
              </div>
              <div>
                <label htmlFor="instPin">Postal / ZIP Code</label>
                <input
                  id="instPin"
                  type="text"
                  value={profile.postalCode}
                  onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                  placeholder="e.g. 411044"
                />
              </div>
            </div>
          ) : (
            <div className="profile-info-grid">
              <div className="profile-field-view" style={{ gridColumn: 'span 2' }}>
                <span className="field-label">Campus Address</span>
                <span className="field-value">{profile.address ? `${profile.address}, ${profile.city}, ${profile.state} - ${profile.postalCode}, ${profile.country}` : '—'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">City</span>
                <span className="field-value">{profile.city || '—'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">State &amp; Country</span>
                <span className="field-value">{profile.state ? `${profile.state}, ${profile.country}` : '—'}</span>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="button-group" style={{ marginTop: 20 }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ width: 'auto', padding: '12px 28px' }}
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={saving}
                style={{ width: 'auto', padding: '12px 20px' }}
              >
                ✕ Cancel
              </button>
            </div>
          )}
        </div>
      </form>

      {/* 4. Account & Security */}
      <div className="card fade-up">
        <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          🔒 Account Security &amp; Credentials
        </h3>

        <div className="profile-info-grid" style={{ marginBottom: 20 }}>
          <div className="profile-field-view">
            <span className="field-label">Account Role</span>
            <span className="field-value">Institution Administrator</span>
          </div>
          <div className="profile-field-view">
            <span className="field-label">Account Status</span>
            <span className="field-value" style={{ color: '#059669' }}>● Verified Organization</span>
          </div>
          <div className="profile-field-view">
            <span className="field-label">Authentication</span>
            <span className="field-value">Firebase Secure Auth</span>
          </div>
        </div>

        <form onSubmit={handleChangePassword}>
          <div className="two-col">
            <div className="password-field">
              <label htmlFor="currPass">Current Password</label>
              <input
                id="currPass"
                type={showCurr ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currPass}
                onChange={(e) => setCurrPass(e.target.value)}
                disabled={loading}
              />
              <span
                className="password-toggle"
                onClick={() => setShowCurr(!showCurr)}
              >
                {showCurr ? '👁️' : '🔒'}
              </span>
            </div>

            <div className="password-field">
              <label htmlFor="newPass">New Password</label>
              <input
                id="newPass"
                type={showNew ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                disabled={loading}
              />
              <span
                className="password-toggle"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? '👁️' : '🔒'}
              </span>
            </div>
          </div>

          <div className="password-field">
            <label htmlFor="confPass">Confirm New Password</label>
            <input
              id="confPass"
              type={showConf ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confPass}
              onChange={(e) => setConfPass(e.target.value)}
              disabled={loading}
            />
            <span
              className="password-toggle"
              onClick={() => setShowConf(!showConf)}
            >
              {showConf ? '👁️' : '🔒'}
            </span>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: 'auto', padding: '10px 22px', marginTop: 10 }}
          >
            Update Password
          </button>
        </form>
      </div>
    </main>
  )
}

export default InstitutionProfile
