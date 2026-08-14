import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db, storage } from '../../firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

function FacultyProfile() {
  const { user, userProfile } = useAuth()
  const fileInputRef = useRef(null)

  // Profile Form State
  const [profile, setProfile] = useState({
    uid: '',
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    facultyId: '',
    department: '',
    designation: '',
    qualification: '',
    specialization: '',
    joiningDate: '',
    assignedSubjects: '',
    assignedBatches: '',
    academicYear: '',
    avatarURL: null,
    institutionId: '',
    role: 'faculty',
    createdAt: '',
    updatedAt: ''
  })

  const [initialProfile, setInitialProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [selectedImageFile, setSelectedImageFile] = useState(null)

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

  // Load profile data from Firestore using user.uid
  useEffect(() => {
    async function loadFacultyProfile() {
      if (!user) return

      try {
        setLoading(true)
        const localKey = `ug_faculty_profile_${user.uid}`
        const cached = localStorage.getItem(localKey)
        let loadedData = cached ? JSON.parse(cached) : {}

        const facultyDoc = await getDoc(doc(db, 'faculty', user.uid))
        if (facultyDoc.exists()) {
          const remoteData = facultyDoc.data()
          loadedData = { ...loadedData, ...remoteData }
        }

        const resolvedAvatarURL = loadedData.avatarURL || loadedData.avatar || loadedData.photoURL || null

        const data = {
          uid: user.uid,
          name: loadedData.name || userProfile?.name || '',
          email: loadedData.email || user.email || '',
          phone: loadedData.phone || '',
          dateOfBirth: loadedData.dateOfBirth || '',
          gender: loadedData.gender || '',
          facultyId: loadedData.facultyId || '',
          department: loadedData.department || '',
          designation: loadedData.designation || '',
          qualification: loadedData.qualification || '',
          specialization: loadedData.specialization || '',
          joiningDate: loadedData.joiningDate || '',
          assignedSubjects: loadedData.assignedSubjects || '',
          assignedBatches: loadedData.assignedBatches || '',
          academicYear: loadedData.academicYear || '',
          avatarURL: resolvedAvatarURL,
          institutionId: loadedData.institutionId || '',
          role: loadedData.role || 'faculty',
          createdAt: loadedData.createdAt || '',
          updatedAt: loadedData.updatedAt || ''
        }

        setProfile(data)
        setInitialProfile(data)
        setAvatarPreview(resolvedAvatarURL)
        localStorage.setItem(localKey, JSON.stringify(data))
      } catch (err) {
        console.error('Error loading faculty profile from Firestore:', err)
        setAlert({ type: 'error', message: `⚠️ Could not load profile: ${err.message}` })
      } finally {
        setLoading(false)
      }
    }

    loadFacultyProfile()
  }, [user, userProfile])

  // Profile Completeness Calculation
  const completionFields = [
    { key: 'name', label: 'Full Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'assignedSubjects', label: 'Assigned Subjects' },
    { key: 'avatarURL', label: 'Profile Picture' }
  ]

  const filledCount = completionFields.filter(f => Boolean(profile[f.key])).length
  const completionPercent = Math.round((filledCount / completionFields.length) * 100)
  const missingFields = completionFields.filter(f => !profile[f.key]).map(f => f.label)

  // Handle Avatar Selection & Preview
  const handleAvatarChange = (e) => {
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
        message: '⚠️ File size exceeds 2MB. Please upload a smaller image.'
      })
      return
    }

    setSelectedImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setAvatarPreview(dataUrl)
      setProfile(prev => ({ ...prev, avatarURL: dataUrl }))
      setAlert({
        type: 'success',
        message: '📷 Image preview loaded. Click "Save Changes" to upload and save.'
      })
    }
    reader.onerror = () => {
      setAlert({ type: 'error', message: '⚠️ Failed to read image file.' })
    }
    reader.readAsDataURL(file)
  }

  // Remove Avatar
  const handleRemoveAvatar = () => {
    setSelectedImageFile(null)
    setAvatarPreview(null)
    setProfile(prev => ({ ...prev, avatarURL: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
    setAlert({ type: 'success', message: '🗑️ Profile picture removed. Click "Save Changes" to apply.' })
  }

  // Save Profile Changes to Firestore
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault()
    setAlert(null)

    if (!profile.name.trim()) {
      setAlert({ type: 'error', message: '⚠️ Full Name is required.' })
      return
    }

    try {
      setSaving(true)
      const now = new Date().toISOString()
      let finalAvatarURL = profile.avatarURL

      // Upload to Firebase Storage if a new file was chosen
      if (selectedImageFile) {
        try {
          const sanitizedName = selectedImageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const storagePath = `avatars/faculty/${user.uid}_${Date.now()}_${sanitizedName}`
          const storageRef = ref(storage, storagePath)
          await uploadBytes(storageRef, selectedImageFile)
          finalAvatarURL = await getDownloadURL(storageRef)
        } catch (storageErr) {
          console.warn('Firebase Storage upload fallback:', storageErr)
          // Keep base64 preview as fallback
        }
      }

      const updatedData = {
        uid: user.uid,
        name: profile.name.trim(),
        email: profile.email || user.email || '',
        phone: profile.phone.trim(),
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        facultyId: profile.facultyId.trim(),
        department: profile.department.trim(),
        designation: profile.designation.trim(),
        qualification: profile.qualification.trim(),
        specialization: profile.specialization.trim(),
        joiningDate: profile.joiningDate,
        assignedSubjects: profile.assignedSubjects.trim(),
        assignedBatches: profile.assignedBatches.trim(),
        academicYear: profile.academicYear.trim(),
        avatarURL: finalAvatarURL || null,
        institutionId: profile.institutionId || '',
        role: 'faculty',
        updatedAt: now
      }

      // 1. Update Firestore Document (faculty/{uid})
      const facultyRef = doc(db, 'faculty', user.uid)
      await updateDoc(facultyRef, updatedData)

      // 2. Persist to local cache for instant reload
      const localKey = `ug_faculty_profile_${user.uid}`
      localStorage.setItem(localKey, JSON.stringify(updatedData))

      setProfile(updatedData)
      setInitialProfile(updatedData)
      setAvatarPreview(finalAvatarURL)
      setSelectedImageFile(null)
      setIsEditing(false)
      setAlert({ type: 'success', message: '✅ Faculty profile saved successfully to Firestore!' })
    } catch (err) {
      console.error('Error saving faculty profile to Firestore:', err)
      setAlert({ type: 'error', message: `⚠️ Failed to save profile: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  // Cancel Editing
  const handleCancelEdit = () => {
    if (initialProfile) {
      setProfile(initialProfile)
      setAvatarPreview(initialProfile.avatarURL)
      setSelectedImageFile(null)
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

  const isProfileUnconfigured = !profile.name && !loading

  return (
    <main className="page-wrapper" style={{ maxWidth: 960 }}>
      {/* Header Badge */}
      <div style={{ marginBottom: 28 }} className="fade-up">
        <span className="page-badge">FACULTY PORTAL</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px', margin: '8px 0 6px' }}>
          👨‍🏫 Faculty Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Manage your personal details, academic assignments, and institutional credentials.
        </p>
      </div>

      {/* Unconfigured Setup Prompt */}
      {isProfileUnconfigured && !isEditing && (
        <div className="card fade-up" style={{ borderLeft: '4px solid #2563eb', background: '#eff6ff', marginBottom: 24 }}>
          <h3 style={{ color: 'var(--primary)', fontSize: 16, margin: '0 0 6px' }}>
            ℹ️ Welcome to UniGrade V2! Complete Your Faculty Profile
          </h3>
          <p style={{ color: '#334155', fontSize: 13.5, margin: '0 0 12px' }}>
            Your faculty profile is currently incomplete. Click the button below to add your department, designation, qualifications, and assigned courses.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsEditing(true)}
            style={{ width: 'auto', padding: '8px 18px', fontSize: 13 }}
          >
            ✏️ Set Up Faculty Profile Now
          </button>
        </div>
      )}

      {/* Alert Messages */}
      {alert && (
        <div className={`alert alert-${alert.type} fade-up`}>
          {alert.message}
        </div>
      )}

      {/* Profile Hero Card */}
      <div className="profile-hero-card fade-up">
        <div className="profile-hero-left">
          {/* Avatar with Camera Overlay */}
          <div className="avatar-uploader-wrap">
            <div className="avatar-circle">
              {avatarPreview ? (
                <img src={avatarPreview} alt={profile.name || 'Faculty Avatar'} />
              ) : (
                <span>👨‍🏫</span>
              )}
            </div>

            <button
              type="button"
              className="avatar-cam-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Profile Picture"
            >
              📷
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept=".jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }}
            />
          </div>

          {/* Identity Meta */}
          <div className="profile-hero-meta">
            <h2>{profile.name || 'Faculty Member'}</h2>
            <p>{profile.email || user?.email}</p>
            <div className="profile-meta-badges">
              {profile.designation && <span className="badge badge-purple">{profile.designation}</span>}
              {profile.department && <span className="badge badge-blue">{profile.department}</span>}
              {profile.facultyId && <span className="badge badge-green">ID: {profile.facultyId}</span>}
              <span className="badge badge-green">● Active &amp; Verified</span>
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

          {avatarPreview && isEditing && (
            <button
              type="button"
              className="btn-danger"
              onClick={handleRemoveAvatar}
              style={{ width: 'auto', padding: '6px 12px', fontSize: 11.5 }}
            >
              🗑️ Remove Photo
            </button>
          )}
        </div>
      </div>

      {/* Profile Completeness Meter */}
      <div className="profile-completion-box fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--primary)' }}>
            Profile Completeness: {completionPercent}%
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
              background: completionPercent === 100 ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #2563eb, #3b82f6)',
              borderRadius: 4,
              transition: 'width 0.4s ease'
            }}
          />
        </div>
        {missingFields.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
            💡 Complete your profile by adding: <strong>{missingFields.join(', ')}</strong>
          </p>
        )}
      </div>

      {/* Main Profile Details */}
      <form onSubmit={handleSaveProfile}>
        {/* 1. Personal Information */}
        <div className="card fade-up">
          <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            👤 Personal Information
          </h3>

          {isEditing ? (
            <div className="two-col">
              <div>
                <label htmlFor="pName">Full Name *</label>
                <input
                  id="pName"
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Enter Full Name"
                  required
                />
              </div>
              <div>
                <label htmlFor="pEmail">Official Email Address (Read-only)</label>
                <input
                  id="pEmail"
                  type="email"
                  value={profile.email}
                  readOnly
                  style={{ background: '#f8fafc', color: 'var(--text-muted)' }}
                />
              </div>
              <div>
                <label htmlFor="pPhone">Phone Number</label>
                <input
                  id="pPhone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
              <div>
                <label htmlFor="pDob">Date of Birth</label>
                <input
                  id="pDob"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="pGender">Gender</label>
                <select
                  id="pGender"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="profile-info-grid">
              <div className="profile-field-view">
                <span className="field-label">Full Name</span>
                <span className="field-value">{profile.name || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Email Address</span>
                <span className="field-value">{profile.email || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Phone Number</span>
                <span className="field-value">{profile.phone || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Date of Birth</span>
                <span className="field-value">{profile.dateOfBirth || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Gender</span>
                <span className="field-value">{profile.gender || 'Not provided'}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Professional Information */}
        <div className="card fade-up">
          <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            💼 Professional Details
          </h3>

          {isEditing ? (
            <div className="two-col">
              <div>
                <label htmlFor="pFacultyId">Faculty ID / Employee Code</label>
                <input
                  id="pFacultyId"
                  type="text"
                  value={profile.facultyId}
                  onChange={(e) => setProfile({ ...profile, facultyId: e.target.value })}
                  placeholder="e.g. FAC-2026-042"
                />
              </div>
              <div>
                <label htmlFor="pDept">Department</label>
                <input
                  id="pDept"
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>
              <div>
                <label htmlFor="pDesig">Designation</label>
                <input
                  id="pDesig"
                  type="text"
                  value={profile.designation}
                  onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                  placeholder="e.g. Associate Professor / Assistant Professor"
                />
              </div>
              <div>
                <label htmlFor="pQual">Highest Qualification</label>
                <input
                  id="pQual"
                  type="text"
                  value={profile.qualification}
                  onChange={(e) => setProfile({ ...profile, qualification: e.target.value })}
                  placeholder="e.g. Ph.D. in Computer Engineering"
                />
              </div>
              <div>
                <label htmlFor="pSpec">Specialization / Research Area</label>
                <input
                  id="pSpec"
                  type="text"
                  value={profile.specialization}
                  onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                  placeholder="e.g. Machine Learning, Cloud Systems"
                />
              </div>
              <div>
                <label htmlFor="pJoin">Joining Date</label>
                <input
                  id="pJoin"
                  type="date"
                  value={profile.joiningDate}
                  onChange={(e) => setProfile({ ...profile, joiningDate: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="profile-info-grid">
              <div className="profile-field-view">
                <span className="field-label">Faculty ID</span>
                <span className="field-value">{profile.facultyId || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Department</span>
                <span className="field-value">{profile.department || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Designation</span>
                <span className="field-value">{profile.designation || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Qualification</span>
                <span className="field-value">{profile.qualification || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Specialization</span>
                <span className="field-value">{profile.specialization || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Joining Date</span>
                <span className="field-value">{profile.joiningDate || 'Not provided'}</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Academic Responsibilities */}
        <div className="card fade-up">
          <h3 style={{ color: 'var(--primary)', fontSize: 17, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            📚 Academic Responsibilities
          </h3>

          {isEditing ? (
            <div className="two-col">
              <div>
                <label htmlFor="pSubjects">Assigned Subjects</label>
                <input
                  id="pSubjects"
                  type="text"
                  value={profile.assignedSubjects}
                  onChange={(e) => setProfile({ ...profile, assignedSubjects: e.target.value })}
                  placeholder="e.g. Data Structures, Web Development"
                />
              </div>
              <div>
                <label htmlFor="pBatches">Assigned Batches / Cohorts</label>
                <input
                  id="pBatches"
                  type="text"
                  value={profile.assignedBatches}
                  onChange={(e) => setProfile({ ...profile, assignedBatches: e.target.value })}
                  placeholder="e.g. 2023-27 CS-A, 2024-28 IT-B"
                />
              </div>
              <div>
                <label htmlFor="pYear">Academic Year</label>
                <input
                  id="pYear"
                  type="text"
                  value={profile.academicYear}
                  onChange={(e) => setProfile({ ...profile, academicYear: e.target.value })}
                  placeholder="e.g. 2025-2026"
                />
              </div>
            </div>
          ) : (
            <div className="profile-info-grid">
              <div className="profile-field-view">
                <span className="field-label">Assigned Subjects</span>
                <span className="field-value">{profile.assignedSubjects || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Assigned Batches</span>
                <span className="field-value">{profile.assignedBatches || 'Not provided'}</span>
              </div>
              <div className="profile-field-view">
                <span className="field-label">Academic Year</span>
                <span className="field-value">{profile.academicYear || 'Not provided'}</span>
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
          🔒 Account Security &amp; Password
        </h3>

        <div className="profile-info-grid" style={{ marginBottom: 20 }}>
          <div className="profile-field-view">
            <span className="field-label">Account Role</span>
            <span className="field-value">Faculty Member</span>
          </div>
          <div className="profile-field-view">
            <span className="field-label">Account Status</span>
            <span className="field-value" style={{ color: '#059669' }}>● Active &amp; Verified</span>
          </div>
          <div className="profile-field-view">
            <span className="field-label">Authentication</span>
            <span className="field-value">Firebase Secure Auth (UniGradeV2)</span>
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

export default FacultyProfile
