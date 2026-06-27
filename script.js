/* =====================================================
   UniGrade — script.js  (v2 — Full Featured + SGPA Module)
   • Account creation (unique email/password)
   • Forgot password (OTP simulation)
   • New evaluation scheme: CA(25) + Midsem(25) + Endsem(50) = Theory(100)
   •                        LabManual(10) + LabAssessment(10) + Viva(30) + EndPractical(50) = Practical(100)
   • Standalone SGPA Calculator Fixes
   • Institution SGPA Generator Engine
   ===================================================== */

import { auth, db } from "./firebase.js";

import {
  getAbsoluteSystems,
  getRelativeSystems,
  getActiveAbsoluteSystem,
  setActiveAbsoluteSystem,
  getActiveRelativeSystem,
  setActiveRelativeSystem,
  resolveGrade
} from "./grading.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/* ── Utility ─────────────────────────────────────── */
function $el(id) { return document.getElementById(id); }

function showAlert(elId, type, msg, duration = 4000) {
  const el = $el(elId);
  if (!el) return;

  el.className = 'alert alert-' + type;
  el.innerHTML = msg;
  el.style.display = 'flex';

  clearTimeout(el.hideTimer);

  if (type === 'success') {
    el.hideTimer = setTimeout(() => {
      el.style.display = 'none';
    }, duration);
  }
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function nameFromEmail(email) {
  return (email || 'User').split('@')[0].replace(/[._]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function setText(id, val) {
  const el = $el(id);
  if (el) el.textContent = val;
}

/* ── Account Storage Helpers ────────────────────── */
function getAccounts(role) {
  return JSON.parse(localStorage.getItem('accounts_' + role) || '[]');
}
function saveAccounts(role, arr) {
  localStorage.setItem('accounts_' + role, JSON.stringify(arr));
}
function findAccount(role, email) {
  return getAccounts(role).find(a => a.email.toLowerCase() === email.toLowerCase());
}
function accountExists(role, email) {
  return !!findAccount(role, email);
}

/* ── OTP Storage ─────────────────────────────────── */
function storeOTP(email, otp) {
  const otpData = { otp: String(otp), expires: Date.now() + 10 * 60 * 1000 };
  localStorage.setItem('otp_' + email.toLowerCase(), JSON.stringify(otpData));
}
function verifyOTP(email, inputOtp) {
  const raw = localStorage.getItem('otp_' + email.toLowerCase());
  if (!raw) return false;
  const data = JSON.parse(raw);
  if (Date.now() > data.expires) return false;
  return String(inputOtp).trim() === data.otp;
}
function clearOTP(email) {
  localStorage.removeItem('otp_' + email.toLowerCase());
}
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

/* ── Faculty Registration ─────────────────────────── */
async function facultyRegister() {
  const name = ($el('regName') || {}).value?.trim();
  const email = ($el('regEmail') || {}).value?.trim();
  const dept = ($el('regDept') || {}).value?.trim();
  const password = ($el('regPassword') || {}).value;
  const confirm = ($el('regConfirm') || {}).value;

  if (!name || !email || !password || !confirm) {
    showAlert('regAlert', 'error', '⚠️ Please fill all required fields.');
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    showAlert('regAlert', 'error', '⚠️ Enter a valid email address.');
    return;
  }
  if (password.length < 6) {
    showAlert('regAlert', 'error', '⚠️ Password must be at least 6 characters.');
    return;
  }
  if (password !== confirm) {
    showAlert('regAlert', 'error', '⚠️ Passwords do not match.');
    return;
  }
  try {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await setDoc(
      doc(db, "faculty", userCredential.user.uid),
      {
        name: name,
        email: email,
        department: dept || "",
        approved: false,
        role: "faculty",
        createdAt: formatDate()
      }
    );

    showAlert(
      'regAlert',
      'success',
      '✅ Account created successfully! Redirecting to login...'
    );

    setTimeout(() => {
      window.location.href = 'faculty-login.html';
    }, 1500);

  }
  catch (error) {
    showAlert('regAlert', 'error', '⚠️ ' + error.message);
  }
}

/* ── Faculty Login ────────────────────────────────── */
async function facultyLogin() {
  const email = document.getElementById("facultyEmail").value;
  const password = document.getElementById("facultyPassword").value;

  if (!email || !password) {
    showAlert('loginAlert', 'error', '⚠️ Please fill all fields.');
    return;
  }

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = auth.currentUser;
    const facultyDoc = await getDoc(
      doc(db, "faculty", user.uid)
    );

    if (!facultyDoc.exists()) {
      showAlert('loginAlert', 'error', '⚠️ Faculty profile not found.');
      await signOut(auth);
      return;
    }

    if (!facultyDoc.data().approved) {
      showAlert('loginAlert', 'error', '⚠️ Your account is waiting for institution approval.');
      await signOut(auth);
      return;
    }

    showAlert('loginAlert', 'success', '✅ Login Successful');
    window.location.href = "faculty-dashboard.html";
  }
  catch (error) {
    showAlert('loginAlert', 'error', '⚠️ ' + error.message);
  }
}

/* ── Institution Login ────────────────────────────── */
async function institutionLogin() {
  console.log("Institution login started");
  const emailEl = $el('institutionEmail');
  const passEl = $el('institutionPassword');

  if (!emailEl || !passEl) return;

  const email = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) {
    showAlert('loginAlert', 'error', '⚠️ Please fill in all fields.');
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const adminDoc = await getDoc(doc(db, "institution", uid));

    if (!adminDoc.exists()) {
      showAlert('loginAlert', 'error', '⚠️ Access denied. You are not an institution administrator.');
      return;
    }

    window.location.href = 'institution-dashboard.html';
  }
  catch (error) {
    showAlert('loginAlert', 'error', '⚠️ Invalid email or password.');
  }
}

/* ── Profile ────────────────────────────────────────── */
async function loadFacultyProfile() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "faculty-login.html";
      return;
    }

    const facultyDoc = await getDoc(doc(db, "faculty", user.uid));
    if (!facultyDoc.exists()) {
      showAlert('profileAlert', 'error', '⚠️ Faculty profile not found.');
      return;
    }

    const profile = facultyDoc.data();
    document.getElementById("profileName").textContent = profile.name || "";
    document.getElementById("profileEmail").textContent = profile.email || "";
    document.getElementById("editName").value = profile.name || "";
    document.getElementById("editEmail").value = profile.email || "";
    document.getElementById("editDept").value = profile.department || "";
    document.getElementById("editPhone").value = profile.phone || "";
  });
}

async function saveProfile() {
  const name = document.getElementById("editName").value.trim();
  const dept = document.getElementById("editDept").value.trim();
  const phone = document.getElementById("editPhone").value.trim();
  const a = document.getElementById("profileAlert");
  const user = auth.currentUser;

  if (!user) return;

  if (!name) {
    a.className = "alert alert-error";
    a.textContent = "⚠️ Name is required.";
    a.style.display = "flex";
    return;
  }

  await updateDoc(
    doc(db, "faculty", user.uid),
    {
      name: name,
      department: dept,
      phone: phone
    }
  );

  document.getElementById("profileName").textContent = name;
  document.getElementById("profileEmail").textContent = user.email;

  a.className = "alert alert-success";
  a.textContent = "✅ Profile updated successfully.";
  a.style.display = "flex";

  setTimeout(() => {
    a.style.display = "none";
  }, 3000);
}

async function changePassword() {
  const curr = document.getElementById("currPass").value;
  const next = document.getElementById("newPass").value;
  const conf = document.getElementById("confPass").value;
  const a = document.getElementById("profileAlert");

  if (!curr || !next || !conf) {
    a.className = "alert alert-error";
    a.textContent = "⚠️ All password fields are required.";
    a.style.display = "flex";
    return;
  }

  if (next.length < 8) {
    a.className = "alert alert-error";
    a.textContent = "⚠️ New password must be at least 8 characters.";
    a.style.display = "flex";
    return;
  }

  if (next !== conf) {
    a.className = "alert alert-error";
    a.textContent = "⚠️ New passwords do not match.";
    a.style.display = "flex";
    return;
  }

  document.getElementById("currPass").value = "";
  document.getElementById("newPass").value = "";
  document.getElementById("confPass").value = "";

  a.className = "alert alert-success";
  a.textContent = "✅ Password validation successful.";
  a.style.display = "flex";
}

/* ── Logout ────────────────────────────────────────── */
async function logoutFaculty() {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "faculty-login.html";
}
async function logoutInstitution() {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "institution-login.html";
}

/* ── Institution Registration ─────────────────────── */
function institutionRegister() {
  const name = ($el('regName') || {}).value?.trim();
  const email = ($el('regEmail') || {}).value?.trim();
  const city = ($el('regCity') || {}).value?.trim();
  const password = ($el('regPassword') || {}).value;
  const confirm = ($el('regConfirm') || {}).value;

  if (!name || !email || !password || !confirm) {
    showAlert('regAlert', 'error', '⚠️ Please fill all required fields.');
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    showAlert('regAlert', 'error', '⚠️ Enter a valid email.');
    return;
  }
  if (password.length < 6) {
    showAlert('regAlert', 'error', '⚠️ Password must be at least 6 characters.');
    return;
  }
  if (password !== confirm) {
    showAlert('regAlert', 'error', '⚠️ Passwords do not match.');
    return;
  }
  if (accountExists('institution', email)) {
    showAlert('regAlert', 'error', '⚠️ An institution account already exists with this email.');
    return;
  }

  const accounts = getAccounts('institution');
  accounts.push({ name, email, city: city || '', password, createdAt: formatDate() });
  saveAccounts('institution', accounts);

  showAlert('regAlert', 'success', '✅ Institution registered! Redirecting to login...');
  setTimeout(() => window.location.href = 'institution-login.html', 1500);
}

/* ── Forgot Password — Send OTP ───────────────────── */
function sendForgotOTP(role) {
  const emailEl = $el('forgotEmail');
  if (!emailEl) return;
  const email = emailEl.value.trim();

  if (!email || !email.includes('@')) {
    showAlert('forgotAlert', 'error', '⚠️ Enter a valid email address.');
    return;
  }

  const account = findAccount(role, email);
  if (!account) {
    showAlert('forgotAlert', 'error', '⚠️ No account found with this email.');
    return;
  }

  const otp = generateOTP();
  storeOTP(email, otp);
  localStorage.setItem('forgotEmail_' + role, email);

  showAlert('forgotAlert', 'success',
    `✅ OTP generated! <br><strong style="font-size:22px;color:#1d4ed8;letter-spacing:4px;">${otp}</strong><br>
    <span style="font-size:12px;color:#64748b;">(In a real system, this would be sent to your email)</span>`
  );

  const step2 = $el('otpStep');
  if (step2) step2.style.display = 'block';
  const step1btn = $el('sendOtpBtn');
  if (step1btn) step1btn.disabled = true;
}

/* ── Forgot Password — Verify & Reset ─────────────── */
function verifyOTPAndReset(role) {
  const email = localStorage.getItem('forgotEmail_' + role) || '';
  const inputOtp = ($el('otpInput') || {}).value?.trim();
  const newPass = ($el('newPassword') || {}).value;
  const confPass = ($el('confirmPassword') || {}).value;

  if (!inputOtp || !newPass || !confPass) {
    showAlert('forgotAlert', 'error', '⚠️ Please fill all fields.');
    return;
  }
  if (!verifyOTP(email, inputOtp)) {
    showAlert('forgotAlert', 'error', '⚠️ Invalid or expired OTP. Please try again.');
    return;
  }
  if (newPass.length < 6) {
    showAlert('forgotAlert', 'error', '⚠️ Password must be at least 6 characters.');
    return;
  }
  if (newPass !== confPass) {
    showAlert('forgotAlert', 'error', '⚠️ Passwords do not match.');
    return;
  }

  const accounts = getAccounts(role);
  const idx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase());
  if (idx !== -1) {
    accounts[idx].password = newPass;
    saveAccounts(role, accounts);
  }

  clearOTP(email);
  localStorage.removeItem('forgotEmail_' + role);

  showAlert('forgotAlert', 'success', '✅ Password reset successfully! Redirecting to login...');
  const loginPage = role === 'faculty' ? 'faculty-login.html' : 'institution-login.html';
  setTimeout(() => window.location.href = loginPage, 2000);
}

/* ── Faculty Dashboard ────────────────────────────── */
async function initFacultyDashboard() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = 'faculty-login.html';
    return;
  }

  const email = user.email;
  const name = email.split('@')[0];

  const wMsg = $el('welcomeMsg');
  if (wMsg) wMsg.textContent = 'Welcome back, ' + name + '. Manage marks, subjects and student records.';

  const q = query(
    collection(db, "records"),
    where("facultyId", "==", user.uid)
  );

  const snapshot = await getDocs(q);
  const allRecords = [];

  snapshot.forEach((doc) => {
    allRecords.push(doc.data());
  });

  const students = [...new Set(allRecords.map(r => r.rollNo))];
  const subjects = [...new Set(allRecords.map(r => r.subject))];

  setText('statStudents', students.length);
  setText('statSubjects', subjects.length);
  setText('statRecords', allRecords.length);
  setText('statPending', 0);

  const recentUploads = $el('recentUploads');
  if (!recentUploads) return;

  const uploads = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
  if (uploads.length === 0) {
    recentUploads.innerHTML = `<div class="empty-state card">
      <div class="empty-icon">📭</div>
      <h3>No uploads yet</h3>
      <p>Start by uploading subject marks.</p>
      <button onclick="window.location.href='upload-excel.html'" style="width:auto;padding:12px 28px;margin-top:16px;">Upload Now →</button>
    </div>`;
    return;
  }

  let html = `<div class="table-wrap"><table>
    <thead><tr><th>Subject</th><th>Batch</th><th>Type</th><th>Records</th><th>Uploaded On</th></tr></thead><tbody>`;
  uploads.slice().reverse().forEach(u => {
    html += `<tr><td>${u.subject}</td><td>${u.batch}</td><td>${u.examType || 'Theory'}</td><td>${u.count}</td><td>${u.date}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  recentUploads.innerHTML = html;
}

/* ── Institution Dashboard ────────────────────────── */
async function initInstitutionDashboard() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = "institution-login.html";
    return;
  }

  const email = user.email;
  const name = email.split("@")[0];
  const wMsg = $el('instWelcome');
  if (wMsg) wMsg.textContent = 'Welcome, ' + name + '. Manage faculty uploads and generate final grades.';

  const snapshot = await getDocs(collection(db, "records"));
  const allRecords = [];

  snapshot.forEach((doc) => {
    allRecords.push(doc.data());
  });
  
  const students = [...new Set(allRecords.map(r => r.rollNo))];
  const subjects = [...new Set(allRecords.map(r => r.subject))];
  const batches = [...new Set(allRecords.map(r => r.batch))];

  setText('iStatStudents', students.length);
  setText('iStatSubjects', subjects.length);
  setText('iStatRecords', allRecords.length);
  setText('iStatBatches', batches.length);

  const container = $el('subjectSummaryContainer');
  if (!container) return;

  if (allRecords.length === 0) {
    container.innerHTML = `<div class="empty-state card">
      <div class="empty-icon">📭</div>
      <h3>No records yet</h3>
      <p>Faculty must upload marks before summaries appear here.</p>
    </div>`;
    return;
  }

  const subjectMap = {};
  allRecords.forEach(r => {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = { students: new Set(), batches: new Set(), marks: [] };
    subjectMap[r.subject].students.add(r.rollNo);
    subjectMap[r.subject].batches.add(r.batch);
    subjectMap[r.subject].marks.push(Number(r.theoryTotal || r.marks) || 0);
  });

  let html = `<div class="table-wrap"><table>
    <thead><tr><th>Subject</th><th>Students</th><th>Batches</th><th>Avg Marks</th><th>Highest</th><th>Lowest</th></tr></thead><tbody>`;
  Object.entries(subjectMap).forEach(([subject, data]) => {
    const avg = (data.marks.reduce((a, b) => a + b, 0) / data.marks.length).toFixed(1);
    html += `<tr>
      <td><strong>${subject}</strong></td>
      <td>${data.students.size}</td>
      <td>${[...data.batches].join(', ')}</td>
      <td>${avg}</td>
      <td>${Math.max(...data.marks)}</td>
      <td>${Math.min(...data.marks)}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

/* ── Navbar Dropdown ──────────────────────────────── */
function initDropdown() {
  const loginBtn = $el('loginBtn');
  const dropdownMenu = $el('dropdownMenu');
  const heroLoginBtn = $el('heroLoginBtn');

  if (loginBtn && dropdownMenu) {
    loginBtn.addEventListener('click', e => {
      e.preventDefault();
      dropdownMenu.classList.toggle('show');
    });
    document.addEventListener('click', e => {
      if (!loginBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  }
  if (heroLoginBtn && dropdownMenu) {
    heroLoginBtn.addEventListener('click', () => {
      dropdownMenu.classList.add('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ── SGPA Calculator — New Evaluation Scheme ──────── */
function addSubject() {
  const container = $el('subjectsContainer');
  if (!container) return;
  const card = document.createElement('div');
  card.className = 'subject-card';
  card.innerHTML = buildSubjectCardHTML(true);
  container.appendChild(card);
  updateExamTypeVisibility(card.querySelector('.examTypeSelect'));
}

function buildSubjectCardHTML(removable) {
  return `
    ${removable ? `<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
      <button onclick="this.closest('.subject-card').remove()" style="width:auto;padding:6px 14px;font-size:13px;background:linear-gradient(to right,#dc2626,#b91c1c);">✕ Remove</button>
    </div>` : ''}
    <div class="two-col">
      <div>
        <label>Subject Name</label>
        <input type="text" class="subjectName" placeholder="e.g. Data Structures">
      </div>
      <div>
        <label>Credits</label>
        <input type="number" class="credits" placeholder="e.g. 4" min="1" max="10">
      </div>
    </div>
    <div>
      <label>Exam Type</label>
      <select class="examTypeSelect" onchange="updateExamTypeVisibility(this)" style="margin-bottom:14px;">
        <option value="theory">Theory Subject</option>
        <option value="practical">Practical Subject</option>
        <option value="both">Theory + Practical Subject</option>
      </select>
    </div>
    <div class="theory-section">
      <p style="font-size:12px;font-weight:700;color:var(--primary-mid);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">📖 Theory (Max: 100)</p>
      <div class="three-col">
        <div>
          <label>Continuous Assessment <span style="color:#94a3b8;font-size:11px;">(max 25)</span></label>
          <input type="number" class="ca" placeholder="0–25" min="0" max="25">
        </div>
        <div>
          <label>Mid-term <span style="color:#94a3b8;font-size:11px;">(max 25)</span></label>
          <input type="number" class="midterm" placeholder="0–25" min="0" max="25">
        </div>
        <div>
          <label>End-term <span style="color:#94a3b8;font-size:11px;">(max 50)</span></label>
          <input type="number" class="endterm" placeholder="0–50" min="0" max="50">
        </div>
      </div>
    </div>
    <div class="practical-section" style="display:none;margin-top:16px;">
      <p style="font-size:12px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">🔬 Practical (Max: 100)</p>
      <div class="two-col">
        <div>
          <label>Lab Manual <span style="color:#94a3b8;font-size:11px;">(max 10)</span></label>
          <input type="number" class="labManual" placeholder="0–10" min="0" max="10">
        </div>
        <div>
          <label>Lab Assessment <span style="color:#94a3b8;font-size:11px;">(max 10)</span></label>
          <input type="number" class="labAssessment" placeholder="0–10" min="0" max="10">
        </div>
      </div>
      <div class="two-col">
        <div>
          <label>Internal Viva-voce <span style="color:#94a3b8;font-size:11px;">(max 30)</span></label>
          <input type="number" class="viva" placeholder="0–30" min="0" max="30">
        </div>
        <div>
          <label>End-term Practical <span style="color:#94a3b8;font-size:11px;">(max 50)</span></label>
          <input type="number" class="endPractical" placeholder="0–50" min="0" max="50">
        </div>
      </div>
    </div>
  `;
}

function updateExamTypeVisibility(selectEl) {
  const card = selectEl.closest('.subject-card');
  const theorySection = card.querySelector('.theory-section');
  const practicalSection = card.querySelector('.practical-section');
  const val = selectEl.value;
  theorySection.style.display = (val === 'practical') ? 'none' : 'block';
  practicalSection.style.display = (val === 'theory') ? 'none' : 'block';
}

function renderGradePointReference(system) {
  const box = $el('gradePointReference');
  if (!box) return;
  const nameEl = $el('gradePointRefSystemName');
  if (nameEl) nameEl.textContent = '— ' + system.name;
  const badgeClass = (gp) => gp >= 9 ? 'badge-purple' : gp >= 7 ? 'badge-green' : gp >= 5 ? 'badge-blue' : 'badge-red';
  const sorted = [...system.rules].sort((a, b) => b.min - a.min);
  box.innerHTML = sorted.map(r => {
    const minLabel = r.min === -Infinity ? 'Below' : `≥${r.min}`;
    return `<span class="badge ${badgeClass(r.gradePoint)}">${minLabel} → ${r.gradePoint} (${r.grade})</span>`;
  }).join('');
}

function initGradingSystemSelectors() {
  const absoluteSelect = $el('gradingSystemSelect');
  if (absoluteSelect) {
    const active = getActiveAbsoluteSystem();
    absoluteSelect.innerHTML = getAbsoluteSystems()
      .map(s => `<option value="${s.id}" ${s.id === active.id ? 'selected' : ''}>${s.name}${s.isCustom ? ' (Custom)' : ''}</option>`)
      .join('');
    renderGradePointReference(active);
    absoluteSelect.addEventListener('change', () => {
      setActiveAbsoluteSystem(absoluteSelect.value);
      renderGradePointReference(getActiveAbsoluteSystem());
    });
  }

  const relativeSelect = $el('relativeSystemSelect');
  if (relativeSelect) {
    const active = getActiveRelativeSystem();
    relativeSelect.innerHTML = getRelativeSystems()
      .map(s => `<option value="${s.id}" ${s.id === active.id ? 'selected' : ''}>${s.name}${s.isCustom ? ' (Custom)' : ''}</option>`)
      .join('');
    relativeSelect.addEventListener('change', () => setActiveRelativeSystem(relativeSelect.value));
  }
}

function getNum(el) { return Math.max(0, Number(el?.value) || 0); }

function calculateSGPA() {
  const cards = document.querySelectorAll('.subject-card');
  if (cards.length === 0) { alert('Please add at least one subject.'); return; }

  const gradingSystem = getActiveAbsoluteSystem();
  let totalCreditPoints = 0;
  let totalCredits = 0;
  let breakdown = [];

  for (const card of cards) {
    const c = Number(card.querySelector('.credits')?.value);
    
    // --> DIVIDE BY ZERO BUG FIX APPLIED HERE <-- //
    if (!c || c <= 0) { 
        alert('⚠️ Please enter valid credits (greater than 0) for all subjects to calculate SGPA.'); 
        return; 
    }

    const type = card.querySelector('.examTypeSelect')?.value || 'theory';
    let finalMark = 0;

    const ca = getNum(card.querySelector('.ca'));
    const mid = getNum(card.querySelector('.midterm'));
    const end = getNum(card.querySelector('.endterm'));
    const theoryTotal = ca + mid + end; // max 100

    const labM = getNum(card.querySelector('.labManual'));
    const labA = getNum(card.querySelector('.labAssessment'));
    const viva = getNum(card.querySelector('.viva'));
    const endP = getNum(card.querySelector('.endPractical'));
    const practicalTotal = labM + labA + viva + endP; // max 100

    if (type === 'theory') finalMark = theoryTotal;
    else if (type === 'practical') finalMark = practicalTotal;
    else finalMark = (theoryTotal * 0.6) + (practicalTotal * 0.4); // combined

    const { grade, gradePoint: gp } = resolveGrade(gradingSystem, finalMark);
    totalCreditPoints += c * gp;
    totalCredits += c;

    const name = card.querySelector('.subjectName')?.value || 'Subject';
    breakdown.push({ name, finalMark: finalMark.toFixed(1), gp, grade, credits: c, type });
  }

  const sgpa = (totalCreditPoints / totalCredits).toFixed(2);
  const result = $el('totalMarks');
  if (result) result.textContent = sgpa;

  const label = $el('sgpaLabel');
  if (label) {
    const s = parseFloat(sgpa);
    let lbl = s >= 9 ? '🏆 Outstanding' : s >= 8 ? '⭐ Excellent' : s >= 7 ? '✅ Good' : s >= 6 ? '🔵 Average' : '⚠️ Below Average';
    label.textContent = lbl;
    label.style.display = 'block';
  }

  // Breakdown table
  const bkEl = $el('breakdownTable');
  if (bkEl) {
    let html = `<div class="table-wrap" style="margin-top:24px;"><table>
      <thead><tr><th>Subject</th><th>Type</th><th>Final Mark</th><th>Grade Point</th><th>Credits</th><th>Credit Points</th></tr></thead><tbody>`;
    breakdown.forEach(b => {
      html += `<tr>
        <td><strong>${b.name}</strong></td>
        <td><span class="badge badge-blue">${b.type}</span></td>
        <td>${b.finalMark}</td>
        <td class="grade-${b.grade}">${b.gp} (${b.grade})</td>
        <td>${b.credits}</td>
        <td>${(b.gp * b.credits).toFixed(1)}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    bkEl.innerHTML = html;
    bkEl.style.display = 'block';
  }
}

/* ── Excel Upload ─────────────────────────────────── */
let uploadedData = [];

function readExcelFile() {
  const subjectName = $el('subjectName')?.value.trim();
  const batchName = $el('batchName')?.value.trim();
  const examType = $el('examTypeUpload')?.value || 'theory';
  const fileInput = $el('fileInput');
  const file = fileInput?.files?.[0];

  if (!subjectName) { showAlert('uploadAlert', 'error', '⚠️ Please enter a subject name.'); return; }
  if (!batchName) { showAlert('uploadAlert', 'error', '⚠️ Please enter a batch name.'); return; }
  if (!file) { showAlert('uploadAlert', 'error', '⚠️ Please select a file.'); return; }
  if (typeof XLSX === 'undefined') { showAlert('uploadAlert', 'error', '⚠️ Excel library not loaded.'); return; }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      uploadedData = XLSX.utils.sheet_to_json(sheet);
      if (uploadedData.length === 0) { showAlert('uploadAlert', 'error', '⚠️ File is empty.'); return; }
      showPreview(examType);
      showAlert('uploadAlert', 'success', '✅ File loaded! Review the preview below.');
    } catch (err) {
      showAlert('uploadAlert', 'error', '⚠️ Could not read file.');
    }
  };
  reader.onerror = () => showAlert('uploadAlert', 'error', '⚠️ File read error.');
  reader.readAsArrayBuffer(file);
}

function showPreview(examType) {
  if (!uploadedData.length) return;
  const keys = Object.keys(uploadedData[0]);
  let html = `<div class="table-wrap"><table><thead><tr>`;
  keys.forEach(k => html += `<th>${k}</th>`);
  html += `</tr></thead><tbody>`;
  uploadedData.slice(0, 50).forEach(row => {
    html += `<tr>`;
    keys.forEach(k => html += `<td>${row[k] !== undefined ? row[k] : ''}</td>`);
    html += `</tr>`;
  });
  if (uploadedData.length > 50) {
    html += `<tr><td colspan="${keys.length}" style="text-align:center;color:#64748b;">... and ${uploadedData.length - 50} more rows</td></tr>`;
  }
  html += `</tbody></table></div>`;
  $el('tableContainer').innerHTML = html;
  $el('previewSection').style.display = 'block';
  const rc = $el('recordCount');
  if (rc) rc.textContent = uploadedData.length + ' record(s) ready to save.';
  $el('previewSection').scrollIntoView({ behavior: 'smooth' });
}

async function saveRecords() {
  if (!uploadedData.length) { showAlert('uploadAlert', 'error', '⚠️ No data to save.'); return; }

  const credits = Number($el('subjectCredits')?.value) || 0;
  const subjectName = $el('subjectName')?.value.trim() || 'Unknown';
  const subjectCode = $el('subjectCode')?.value.trim() || '';
  const batchName = $el('batchName')?.value.trim() || 'Unknown';
  const semester = $el('semesterInput')?.value.trim() || '';
  const academicYear = $el('academicYear')?.value.trim() || '';
  const examType = $el('examTypeUpload')?.value || 'theory';

  const facultyId = auth.currentUser.uid;
  const facultyEmail = auth.currentUser.email;
  const enriched = uploadedData.map(row => {
    const get = (...keys) => {
      for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null && v !== '') return v;
      }
      return null;
    };

    const rollNo = String(get('rollNo', 'Roll No', 'ROLL NO', 'RollNo', 'roll_no') || '—');
    const name = String(get('name', 'Name', 'Student Name', 'STUDENT NAME') || '—');

    // Theory marks
    const ca = Number(get('ca', 'CA', 'Continuous Assessment', 'ContinuousAssessment') || 0);
    const midsem = Number(get('midsem', 'Midsem', 'midterm', 'Midterm', 'Mid Term') || 0);
    const endsem = Number(get('endsem', 'Endsem', 'endterm', 'End Term', 'EndTerm') || 0);
    const theoryTotal = ca + midsem + endsem || Number(get('marks', 'Marks', 'MARKS', 'Total') || 0);

    // Practical marks
    const labManual = Number(get('labManual', 'Lab Manual', 'LabManual') || 0);
    const labAssessment = Number(get('labAssessment', 'Lab Assessment', 'LabAssessment') || 0);
    const viva = Number(get('viva', 'Viva', 'Viva-voce', 'InternalViva') || 0);
    const endPractical = Number(get('endPractical', 'End Practical', 'EndPractical', 'EndSem Practical') || 0);
    const practicalTotal = labManual + labAssessment + viva + endPractical;

    let finalMarks;
    if (examType === 'theory') finalMarks = theoryTotal;
    else if (examType === 'practical') finalMarks = practicalTotal;
    else finalMarks = (theoryTotal * 0.6) + (practicalTotal * 0.4);

    return {
      rollNo, name,
      ca, midsem, endsem, theoryTotal,
      labManual, labAssessment, viva, endPractical, practicalTotal,
      marks: Math.round(finalMarks * 10) / 10,
      maxMarks: 100,
      examType,
      subject: subjectName,
      subjectCode,
      credits,
      batch: batchName,
      semester,
      academicYear,
      uploadedOn: formatDate(),
      facultyId,
      facultyEmail
    };
  });

  const oldRecordsQuery = query(
    collection(db, "records"),
    where("facultyId", "==", facultyId),
    where("subject", "==", subjectName),
    where("batch", "==", batchName),
    where("semester", "==", semester),
    where("academicYear", "==", academicYear)
  );

  const oldRecords = await getDocs(oldRecordsQuery);
  const isUpdate = !oldRecords.empty;

  for (const docSnap of oldRecords.docs) {
    await deleteDoc(docSnap.ref);
  }

  for (const record of enriched) {
    await addDoc(
      collection(db, "records"),
      {
        ...record,
        facultyId,
        facultyEmail
      }
    );
  }

  const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
  history.push({ subject: subjectName, batch: batchName, examType, count: enriched.length, date: formatDate() });
  localStorage.setItem('uploadHistory', JSON.stringify(history));

  if (isUpdate) {
    showAlert(
      "uploadAlert",
      "success",
      `♻️ Existing records found.<br><br>
     ${enriched.length} records have been replaced successfully.<br><br>
     Please regenerate and save Relative Grades.`
    );
  } else {
    showAlert(
      "uploadAlert",
      "success",
      `✅ ${enriched.length} records uploaded successfully!`
    );
  }
  clearPreview();
}

function clearPreview() {
  uploadedData = [];
  const ps = $el('previewSection');
  if (ps) ps.style.display = 'none';
  const tc = $el('tableContainer');
  if (tc) tc.innerHTML = '';
  const rc = $el('recordCount');
  if (rc) rc.textContent = '';
  const fileInput = $el('fileInput');
  if (fileInput) fileInput.value = '';
}

/* ── Export All Results ───────────────────────────── */
function exportAllResults() {
  const records = JSON.parse(localStorage.getItem('uploadedRecords') || '[]');
  if (!records.length) { alert('No records to export.'); return; }
  const headers = ['Roll No', 'Name', 'Subject', 'Batch', 'Exam Type', 'CA', 'Midsem', 'Endsem', 'Theory Total', 'Lab Manual', 'Lab Assess', 'Viva', 'End Practical', 'Practical Total', 'Final Marks', 'Academic Year', 'Uploaded On'];

  const rows = records.map(r => [r.rollNo, r.name, r.subject, r.batch, r.examType || 'theory',
  r.ca || 0, r.midsem || 0, r.endsem || 0, r.theoryTotal || r.marks,
  r.labManual || 0, r.labAssessment || 0, r.viva || 0, r.endPractical || 0, r.practicalTotal || 0,
  r.marks, r.academicYear || '—', r.uploadedOn || '—']);
  downloadCSV([headers, ...rows], 'UniGrade_AllResults.csv');
}

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── DOMContentLoaded Router ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  const page = location.pathname.split('/').pop() || 'index.html';

  initDropdown();
  initGradingSystemSelectors();

  // -> NEW: Institution SGPA Router
  if (page === 'institution-sgpa.html') {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = 'institution-login.html';
        return;
      }
      initInstitutionSGPA();
    });
  }

  if (page === 'relative-grading.html') {
    onAuthStateChanged(auth, (user) => {
      if (!user) { window.location.href = 'faculty-login.html'; return; }
      initRelativeGrading();
    });
  }

  if (page === 'profile.html') {
    loadFacultyProfile();
  }

  if (page === 'faculty-dashboard.html') {
    onAuthStateChanged(auth, (user) => {
      if (!user) { window.location.href = 'faculty-login.html'; return; }
      initFacultyDashboard();
    });
  }

  if (page === 'institution-dashboard.html') {
    onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = 'institution-login.html'; return; }
      const adminDoc = await getDoc(doc(db, "institution", user.uid));
      if (!adminDoc.exists()) { window.location.href = 'institution-login.html'; return; }
      initInstitutionDashboard();
    });
  }

  if (page === 'student-records.html') {
    onAuthStateChanged(auth, (user) => {
      if (!user) { window.location.href = 'faculty-login.html'; return; }
      loadRecords(user);
    });
  }

  if (page === 'institution-records.html') {
    onAuthStateChanged(auth, (user) => {
      if (!user) { window.location.href = 'institution-login.html'; return; }
      loadInstitutionRecords();
    });
  }

  const firstCard = document.querySelector('.subject-card');
  if (firstCard) {
    const sel = firstCard.querySelector('.examTypeSelect');
    if (sel) updateExamTypeVisibility(sel);
  }
});

/* ── Student Records Management (Faculty) ─────────── */
let records = [];
let gradedResults = [];

async function initRelativeGrading() {
  const user = auth.currentUser;
  if (!user) { window.location.href = "faculty-login.html"; return; }

  const q = query(
    collection(db, "records"),
    where("facultyId", "==", user.uid)
  );
  const snapshot = await getDocs(q);

  records = [];
  snapshot.forEach((doc) => {
    records.push({ id: doc.id, ...doc.data() });
  });

  if (records.length === 0) {
    document.getElementById("noDataMsg").style.display = "block";
    return;
  }

  const subjects = [...new Set(records.map(r => r.subject))];
  const batches = [...new Set(records.map(r => r.batch))];

  const sf = document.getElementById("gradingSubject");
  const bf = document.getElementById("gradingBatch");

  subjects.forEach(s => {
    const o = document.createElement("option");
    o.value = s; o.textContent = s;
    sf.appendChild(o);
  });

  batches.forEach(b => {
    const o = document.createElement("option");
    o.value = b; o.textContent = b;
    bf.appendChild(o);
  });
}

function generateGrades() {
  const subjFilter = document.getElementById("gradingSubject").value;
  const batchFilter = document.getElementById("gradingBatch").value;

  if (!subjFilter) { alert("Please select a subject."); return; }
  if (!batchFilter) { alert("Please select a batch."); return; }

  let filtered = records;
  if (subjFilter !== 'all') filtered = filtered.filter(r => r.subject === subjFilter);
  if (batchFilter !== 'all') filtered = filtered.filter(r => r.batch === batchFilter);

  if (filtered.length === 0) {
    alert('No records match the selected filters.'); return;
  }

  let dataForGrading = filtered.map(r => ({
    rollNo: r.rollNo,
    name: r.name,
    batch: r.batch,
    semester: r.semester,
    academicYear: r.academicYear,
    subject: r.subject,
    subjectCode: r.subjectCode,
    examType: r.examType,
    marks: Number(r.marks) || 0,
    credits: Number(r.credits) || 0
  }));

  const markValues = dataForGrading.map(d => d.marks);
  const mean = markValues.reduce((a, b) => a + b, 0) / markValues.length;
  const variance = markValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / markValues.length;
  const sd = Math.sqrt(variance);
  const relativeSystem = getActiveRelativeSystem();

  gradedResults = dataForGrading.map(d => {
    const z = sd === 0 ? 0 : (d.marks - mean) / sd;
    const { grade, gradePoint: gp } = resolveGrade(relativeSystem, z);
    const credits = Number(d.credits) || 0;
    const creditPoints = gp * credits;

    return {
      ...d,
      grade,
      gradePoint: gp,
      credits,
      creditPoints,
      zScore: z.toFixed(2)
    };
  });

  gradedResults.sort((a, b) => b.marks - a.marks);
  localStorage.setItem('relativeGrades', JSON.stringify(gradedResults));

  const gradeOrder = [...relativeSystem.rules].sort((a, b) => b.min - a.min).map(r => r.grade);
  const gradeCounts = {};
  gradeOrder.forEach(g => gradeCounts[g] = 0);
  gradedResults.forEach(r => { gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1; });
  const highest = Math.max(...markValues).toFixed(1);
  const lowest = Math.min(...markValues).toFixed(1);

  document.getElementById('statsSection').style.display = 'block';
  document.getElementById('statsGrid').innerHTML = `
                <div class="stat-card"><h2>${mean.toFixed(1)}</h2><p>Class Mean</p></div>
                <div class="stat-card"><h2>${sd.toFixed(1)}</h2><p>Std Deviation</p></div>
                <div class="stat-card"><h2>${highest}</h2><p>Highest</p></div>
                <div class="stat-card"><h2>${lowest}</h2><p>Lowest</p></div>
            `;

  const maxCount = Math.max(...Object.values(gradeCounts));
  const palette = ['#7c3aed', '#059669', '#2563eb', '#0891b2', '#0ea5e9', '#d97706', '#f97316', '#dc2626', '#64748b'];
  const colors = {};
  gradeOrder.forEach((g, i) => { colors[g] = palette[i % palette.length]; });
  let distHtml = '';
  Object.entries(gradeCounts).forEach(([g, count]) => {
    const pct = maxCount ? ((count / maxCount) * 100).toFixed(0) : 0;
    const pctOfClass = ((count / gradedResults.length) * 100).toFixed(0);
    distHtml += `
                    <div style="text-align:center;flex:1;min-width:70px;">
                        <div style="font-size:12px;font-weight:700;color:${colors[g]};margin-bottom:6px;">${count} (${pctOfClass}%)</div>
                        <div style="background:${colors[g]}22;border-radius:8px;overflow:hidden;height:120px;display:flex;align-items:flex-end;">
                            <div style="background:${colors[g]};width:100%;height:${pct}%;border-radius:6px;transition:height 1s ease;"></div>
                        </div>
                        <div style="font-size:18px;font-weight:800;color:${colors[g]};margin-top:8px;">${g}</div>
                    </div>`;
  });
  document.getElementById('gradeDistribution').innerHTML = distHtml;

  let html = `<div class="table-wrap"><table>
                    <thead><tr>
                        <th>Rank</th>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Batch</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>GP</th>
                        <th>Credits</th>
                        <th>Credit Points</th>
                      </tr></thead><tbody>`;

  gradedResults.forEach((r, i) => {
    html += `<tr>
          <td><strong>#${i + 1}</strong></td>
          <td>${r.rollNo}</td>
          <td><strong>${r.name}</strong></td>
          <td>${r.batch || '—'}</td>
          <td>${r.marks.toFixed(1)}</td>
          <td><span class="grade-${r.grade}">${r.grade}</span></td>
          <td>${r.gradePoint}</td>
          <td>${r.credits}</td>
          <td>${r.creditPoints}</td>
      </tr>`;
  });
  html += `</tbody></table></div>`;
  document.getElementById('resultsContainer').innerHTML = html;
  document.getElementById('resultsSection').style.display = 'block';

  document.getElementById('statsSection').scrollIntoView({ behavior: 'smooth' });
  document.getElementById("saveGradesBtn").style.display = "inline-flex";
}

async function saveGradesToFirebase() {
  if (!gradedResults.length) { alert("Generate grades first."); return; }
  const firstRecord = gradedResults[0];

  const oldGradesQuery = query(
    collection(db, "gradedRecords"),
    where("subject", "==", firstRecord.subject),
    where("batch", "==", firstRecord.batch),
    where("semester", "==", firstRecord.semester),
    where("academicYear", "==", firstRecord.academicYear)
  );

  const oldGrades = await getDocs(oldGradesQuery);
  for (const d of oldGrades.docs) {
    await deleteDoc(d.ref);
  }

  for (const r of gradedResults) {
    await addDoc(
      collection(db, "gradedRecords"),
      {
        rollNo: r.rollNo, name: r.name,
        subject: r.subject, subjectCode: r.subjectCode,
        batch: r.batch, semester: r.semester, academicYear: r.academicYear,
        examType: r.examType,
        marks: r.marks, grade: r.grade, gradePoint: r.gradePoint,
        credits: r.credits, creditPoints: r.creditPoints,
        zScore: r.zScore,
        facultyId: auth.currentUser.uid, facultyEmail: auth.currentUser.email,
        gradedOn: formatDate()
      }
    );
  }
  alert("Grades saved successfully!");
}

function exportGrades() {
  if (gradedResults.length === 0) { alert('Generate grades first.'); return; }
  const headers = ['Rank', 'Roll No', 'Name', 'Batch', 'Average Marks', 'Z-Score', 'Relative Grade'];
  const rows = gradedResults.map((r, i) => [i + 1, r.rollNo, r.name, r.batch, r.marks.toFixed(1), r.zScore, r.grade]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'UniGrade_RelativeGrades.csv';
  a.click();
}

let allRecords = [];

async function loadRecords(user) {
  const q = query(collection(db, "records"), where("facultyId", "==", user.uid));
  const snapshot = await getDocs(q);
  allRecords = [];
  snapshot.forEach((doc) => {
    allRecords.push({ id: doc.id, ...doc.data() });
  });

  updateStats();
  populateFilters();
  renderTable(allRecords);

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('subjectFilter').addEventListener('change', applyFilters);
  document.getElementById('batchFilter').addEventListener('change', applyFilters);
}

function updateStats() {
  const students = [...new Set(allRecords.map(r => r.rollNo))];
  const subjects = [...new Set(allRecords.map(r => r.subject))];
  const avg = allRecords.length ? (allRecords.reduce((s, r) => s + (r.marks || 0), 0) / allRecords.length).toFixed(1) : '—';

  const totalStudents = document.getElementById('totalStudents');
  const totalSubjects = document.getElementById('totalSubjects');
  const totalRecords = document.getElementById('totalRecords');
  const avgMarks = document.getElementById('avgMarks');

  if (totalStudents) totalStudents.textContent = students.length || '—';
  if (totalSubjects) totalSubjects.textContent = subjects.length || '—';
  if (totalRecords) totalRecords.textContent = allRecords.length || '—';
  if (avgMarks) avgMarks.textContent = avg;
}

/* ── Updated Filter Functions ── */

function populateFilters() {
  const sf = document.getElementById('subjectFilter');
  const bf = document.getElementById('batchFilter');
  if (!sf || !bf) return;

  // Extract unique values
  const subjects = [...new Set(allRecords.map(r => r.subject).filter(Boolean))];
  const batches = [...new Set(allRecords.map(r => r.batch).filter(Boolean))];

  // Refresh HTML
  sf.innerHTML = '<option value="">All Subjects</option>';
  bf.innerHTML = '<option value="">All Batches</option>';

  subjects.forEach(s => sf.innerHTML += `<option value="${s}">${s}</option>`);
  batches.forEach(b => bf.innerHTML += `<option value="${b}">${b}</option>`);
}

function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const subjectFilter = document.getElementById('subjectFilter');
    const batchFilter = document.getElementById('batchFilter');

    if (searchInput) searchInput.value = '';
    if (subjectFilter) subjectFilter.value = '';
    if (batchFilter) batchFilter.value = '';

    renderTable(allRecords);
}

function applyFilters() {
  const search = document.getElementById('searchInput')?.value.toLowerCase() || "";
  const subject = document.getElementById('subjectFilter')?.value || "";
  const batch = document.getElementById('batchFilter')?.value || "";

  const filtered = allRecords.filter(r => {
    const matchSearch = !search || 
                        (r.name?.toLowerCase().includes(search)) || 
                        (r.rollNo?.toLowerCase().includes(search));
    const matchSubject = !subject || r.subject === subject;
    const matchBatch = !batch || r.batch === batch;
    return matchSearch && matchSubject && matchBatch;
  });

  renderTable(filtered);
}

function renderTable(records) {
  const container = document.getElementById('recordsContainer');
  if (records.length === 0) {
    container.innerHTML = `
            <div class="empty-state" style="background:var(--surface);border-radius:var(--radius-lg);border:1px solid rgba(255,255,255,0.5);">
                <div class="empty-icon">📭</div>
                <h3>${allRecords.length === 0 ? 'No records uploaded yet' : 'No matching records'}</h3>
                <p>${allRecords.length === 0 ? 'Upload subject marks to see them here.' : 'Try adjusting your search or filters.'}</p>
                ${allRecords.length === 0 ? '<button onclick="window.location.href=\'upload-excel.html\'" style="margin-top:20px;width:auto;padding:12px 28px;">Upload Now →</button>' : ''}
            </div>`;
    return;
  }

  let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
            <p style="font-size:14px;color:var(--text-muted);font-weight:500;">${records.length} record${records.length !== 1 ? 's' : ''} found</p>
            <button class="btn-danger" onclick="deleteSelectedRecords()" style="width:auto;padding:9px 18px;font-size:13px;">🗑️ Delete Selected</button>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th><input type="checkbox" id="selectAllRecords"></th>
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
                <tbody>`;

  records.forEach((r, i) => {
    const pct = ((r.marks / (r.maxMarks || 100)) * 100).toFixed(0);
    const grade = getGrade(Number(pct));
    const theoryDetail = r.theoryTotal != null
      ? `${r.theoryTotal} <span style="color:#94a3b8;font-size:11px;">(${r.ca || 0}+${r.midsem || 0}+${r.endsem || 0})</span>`
      : '—';
    const practicalDetail = r.practicalTotal != null && r.practicalTotal > 0
      ? `${r.practicalTotal} <span style="color:#94a3b8;font-size:11px;">(${r.labManual || 0}+${r.viva || 0}+${r.endPractical || 0})</span>`
      : '—';
    html += `
            <tr>
                <td><input type="checkbox" class="recordCheckbox" value="${r.id}"></td>
                <td>${i + 1}</td>
                <td><strong>${r.rollNo}</strong></td>
                <td>${r.name}</td>
                <td><span class="badge badge-blue">${r.subject}</span></td>
                <td>${r.batch || '—'}</td>
                <td><span class="badge badge-green">${r.examType || 'theory'}</span></td>
                <td>${theoryDetail}</td>
                <td>${practicalDetail}</td>
                <td><strong>${r.marks} / ${r.maxMarks || 100}</strong></td>
                <td><span class="grade-${grade}" style="font-size:15px;">${grade}</span></td>
                <td style="font-size:12.5px;color:var(--text-muted);">${r.uploadedOn || '—'}</td>
            </tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
  setupSelectAll();
}

function getGrade(pct) {
  return resolveGrade(getActiveAbsoluteSystem(), pct).grade;
}

function exportCSV() {
  if (allRecords.length === 0) { alert('No records to export.'); return; }
  const headers = ['Roll No', 'Name', 'Subject', 'Batch', 'Marks', 'Max Marks', 'Academic Year', 'Uploaded On'];
  const rows = allRecords.map(r => [r.rollNo, r.name, r.subject, r.batch, r.marks, r.maxMarks || 100, r.academicYear || '—', r.uploadedOn || '—']);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'UniGrade_StudentRecords.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function loadInstitutionRecords() {
    const container = document.getElementById('recordsContainer');
    
    // 1. CLEAR the array before fetching new data
    allRecords = []; 
    
    try {
        const snapshot = await getDocs(collection(db, "records"));
        // 2. Map fresh data
        allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("Records loaded:", allRecords.length);
        
        updateStats();
        populateFilters();
        renderTable(allRecords);
    } catch (e) {
        console.error("Error loading records:", e);
    }
}

async function confirmDelete() {
  const confirmAction = confirm("Delete ALL records from Firestore?");
  if (!confirmAction) return;

  const snapshot = await getDocs(collection(db, "records"));
  for (const document of snapshot.docs) {
    await deleteDoc(document.ref);
  }
  alert("All records deleted.");
  location.reload();
}

function setupSelectAll() {
  const selectAll = document.getElementById("selectAllRecords");
  if (!selectAll) return;
  selectAll.addEventListener("change", function () {
    document.querySelectorAll(".recordCheckbox").forEach(cb => { cb.checked = this.checked; });
  });
}

async function deleteSelectedRecords() {
  const selected = document.querySelectorAll(".recordCheckbox:checked");
  if (selected.length === 0) { alert("Please select at least one record."); return; }

  const confirmDelete = confirm(`Delete ${selected.length} selected record(s)?`);
  if (!confirmDelete) return;

  for (const cb of selected) {
    await deleteDoc(doc(db, "records", cb.value));
  }

  alert(`${selected.length} record(s) deleted successfully.`);
  await loadRecords(auth.currentUser);

  const user = auth.currentUser;
  for (const cb of selected) {
    const record = allRecords.find(r => r.id === cb.value);
    if (record && record.facultyId === user.uid) {
      await deleteDoc(doc(db, "records", cb.value));
    }
  }
}

/* =====================================================
   Institution SGPA Generator Logic (NEW)
   ===================================================== */
let institutionSgpaData = [];
let finalSgpaResults = [];

async function initInstitutionSGPA() {
    const snapshot = await getDocs(collection(db, "records"));
    const batches = new Set();
    const years = new Set();
    
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if(data.batch) batches.add(data.batch);
        if(data.academicYear) years.add(data.academicYear);
    });

    const batchSelect = document.getElementById("batch");
    const yearSelect = document.getElementById("academicYear");
    
    if(batchSelect && yearSelect) {
        batches.forEach(b => {
            const opt = document.createElement("option"); 
            opt.value = b; opt.textContent = b; 
            batchSelect.appendChild(opt);
        });
        years.forEach(y => {
            const opt = document.createElement("option"); 
            opt.value = y; opt.textContent = y; 
            yearSelect.appendChild(opt);
        });
    }
}

async function loadGradedRecords() {
    const academicYear = document.getElementById("academicYear").value;
    const semester = document.getElementById("semester").value;
    const batch = document.getElementById("batch").value;

    if (!academicYear || !semester || !batch) {
        alert("⚠️ Please select Academic Year, Semester, and Batch.");
        return;
    }

    const q = query(
        collection(db, "gradedRecords"),
        where("batch", "==", batch),
        where("semester", "==", semester),
        where("academicYear", "==", academicYear)
    );

    const snapshot = await getDocs(q);
    institutionSgpaData = [];
    snapshot.forEach(docSnap => institutionSgpaData.push(docSnap.data()));

    if (institutionSgpaData.length === 0) {
        alert("📭 No records found for the selected criteria. Ensure faculty have uploaded and generated grades.");
        return;
    }

    const students = [...new Set(institutionSgpaData.map(r => r.rollNo))];
    const subjects = [...new Set(institutionSgpaData.map(r => r.subject))];

    document.getElementById("totalStudents").textContent = students.length;
    document.getElementById("totalSubjects").textContent = subjects.length;
    document.getElementById("completedSubjects").textContent = institutionSgpaData.length;
    
    const emptyState = document.getElementById("emptyState");
    if(emptyState) emptyState.style.display = "none";

    document.getElementById("summarySection").style.display = "grid";
    document.getElementById("recordsSection").style.display = "block";
    document.getElementById("resultsSection").style.display = "block";

    const genBtn = document.getElementById("generateBtn");
    if (genBtn) genBtn.disabled = false;

    let recordsHtml = `<div class="table-wrap"><table>
        <thead><tr><th>Roll No</th><th>Student Name</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Credits</th></tr></thead><tbody>`;
    
    institutionSgpaData.slice(0, 50).forEach(r => {
        recordsHtml += `<tr>
            <td><strong>${r.rollNo}</strong></td>
            <td>${r.name}</td>
            <td><span class="badge badge-blue">${r.subject}</span></td>
            <td>${r.marks}</td>
            <td><span class="grade-${r.grade}" style="font-size:15px; font-weight:bold;">${r.grade}</span></td>
            <td>${r.credits}</td>
        </tr>`;
    });
    
    if (institutionSgpaData.length > 50) {
        recordsHtml += `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">...and ${institutionSgpaData.length - 50} more records loaded.</td></tr>`;
    }
    
    recordsHtml += `</tbody></table></div>`;
    document.getElementById("recordsContainer").innerHTML = recordsHtml;
}

function generateSGPA() {
    if (institutionSgpaData.length === 0) {
        alert("⚠️ Please load records first.");
        return;
    }

    const studentMap = {};

    institutionSgpaData.forEach(r => {
        if (!studentMap[r.rollNo]) {
            studentMap[r.rollNo] = {
                rollNo: r.rollNo,
                name: r.name,
                totalCreditPoints: 0,
                totalCredits: 0,
                breakdown: []
            };
        }

        const gp = Number(r.gradePoint) || 0;
        const credits = Number(r.credits) || 0;
        
        studentMap[r.rollNo].totalCreditPoints += (gp * credits);
        studentMap[r.rollNo].totalCredits += credits;
        studentMap[r.rollNo].breakdown.push(r.subject);
    });

    finalSgpaResults = Object.values(studentMap).map(s => {
        return {
            ...s,
            sgpa: s.totalCredits > 0 ? (s.totalCreditPoints / s.totalCredits).toFixed(2) : "0.00"
        };
    });

    finalSgpaResults.sort((a, b) => b.sgpa - a.sgpa);

    const avgSGPA = (finalSgpaResults.reduce((sum, s) => sum + parseFloat(s.sgpa), 0) / finalSgpaResults.length).toFixed(2);
    document.getElementById("avgSGPA").textContent = avgSGPA;

    let html = `<div class="table-wrap"><table>
        <thead><tr><th>Rank</th><th>Roll No</th><th>Student Name</th><th>Subjects Evaluated</th><th>Total Credits</th><th>SGPA</th></tr></thead><tbody>`;

    finalSgpaResults.forEach((s, i) => {
        html += `<tr>
            <td><strong>#${i + 1}</strong></td>
            <td>${s.rollNo}</td>
            <td>${s.name}</td>
            <td><span class="badge badge-blue">${s.breakdown.length} Subjects</span></td>
            <td>${s.totalCredits}</td>
            <td><strong style="color:var(--primary); font-size:16px;">${s.sgpa}</strong></td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    document.getElementById("resultsTable").innerHTML = html;
    document.getElementById("saveSection").style.display = "block";
    
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) saveBtn.disabled = false;
}

async function saveSGPA() {
    if (finalSgpaResults.length === 0) {
        alert("⚠️ No SGPA results generated yet.");
        return;
    }

    const academicYear = document.getElementById("academicYear").value;
    const semester = document.getElementById("semester").value;
    const batch = document.getElementById("batch").value;

    const oldQuery = query(
        collection(db, "sgpaResults"),
        where("batch", "==", batch),
        where("semester", "==", semester),
        where("academicYear", "==", academicYear)
    );
    const oldDocs = await getDocs(oldQuery);
    for (const d of oldDocs.docs) {
        await deleteDoc(d.ref);
    }

    for (const res of finalSgpaResults) {
        await addDoc(collection(db, "sgpaResults"), {
            rollNo: res.rollNo,
            name: res.name,
            batch,
            semester,
            academicYear,
            sgpa: res.sgpa,
            totalCredits: res.totalCredits,
            generatedOn: formatDate(),
            generatedBy: auth.currentUser.email
        });
    }
    alert("✅ SGPA Results saved successfully!");
}

/* ── Export Functions to Window ───────────────────── */
window.facultyRegister = facultyRegister;
window.facultyLogin = facultyLogin;
window.institutionLogin = institutionLogin;
window.institutionRegister = institutionRegister;
window.sendForgotOTP = sendForgotOTP;
window.verifyOTPAndReset = verifyOTPAndReset;
window.addSubject = addSubject;
window.calculateSGPA = calculateSGPA;
window.updateExamTypeVisibility = updateExamTypeVisibility;
window.readExcelFile = readExcelFile;
window.saveRecords = saveRecords;
window.exportAllResults = exportAllResults;
window.confirmDelete = confirmDelete;
window.logoutFaculty = logoutFaculty;
window.saveProfile = saveProfile;
window.changePassword = changePassword;
window.generateGrades = generateGrades;
window.exportGrades = exportGrades;
window.deleteSelectedRecords = deleteSelectedRecords;
window.saveGradesToFirebase = saveGradesToFirebase;
window.loadGradedRecords = loadGradedRecords;
window.generateSGPA = generateSGPA;
window.saveSGPA = saveSGPA;
window.logoutInstitution = logoutInstitution;
window.loadInstitutionRecords = loadInstitutionRecords;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.exportCSV = exportCSV;
