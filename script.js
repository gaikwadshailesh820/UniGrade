/* =====================================================
   UniGrade — script.js  (v2 — Full Featured)
   • Account creation (unique email/password)
   • Forgot password (OTP simulation)
   • New evaluation scheme: CA(25) + Midsem(25) + Endsem(50) = Theory(100)
   •                        LabManual(10) + LabAssessment(10) + Viva(30) + EndPractical(50) = Practical(100)
   ===================================================== */

/* ── Utility ─────────────────────────────────────── */
function $el(id){ return document.getElementById(id); }

function showAlert(elId, type, msg){
  const el = $el(elId);
  if(!el) return;
  el.className = 'alert alert-' + type;
  el.innerHTML = msg;
  el.style.display = 'flex';
  if(type === 'success') setTimeout(()=> el.style.display = 'none', 4000);
}

function formatDate(){
  return new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
}

function nameFromEmail(email){
  return (email||'User').split('@')[0].replace(/[._]/g,' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function setText(id, val){
  const el = $el(id);
  if(el) el.textContent = val;
}

/* ── Account Storage Helpers ────────────────────── */
function getAccounts(role){
  return JSON.parse(localStorage.getItem('accounts_' + role) || '[]');
}
function saveAccounts(role, arr){
  localStorage.setItem('accounts_' + role, JSON.stringify(arr));
}
function findAccount(role, email){
  return getAccounts(role).find(a => a.email.toLowerCase() === email.toLowerCase());
}
function accountExists(role, email){
  return !!findAccount(role, email);
}

/* ── OTP Storage ─────────────────────────────────── */
function storeOTP(email, otp){
  const otpData = { otp: String(otp), expires: Date.now() + 10 * 60 * 1000 };
  localStorage.setItem('otp_' + email.toLowerCase(), JSON.stringify(otpData));
}
function verifyOTP(email, inputOtp){
  const raw = localStorage.getItem('otp_' + email.toLowerCase());
  if(!raw) return false;
  const data = JSON.parse(raw);
  if(Date.now() > data.expires) return false;
  return String(inputOtp).trim() === data.otp;
}
function clearOTP(email){
  localStorage.removeItem('otp_' + email.toLowerCase());
}
function generateOTP(){
  return Math.floor(100000 + Math.random() * 900000);
}

/* ── Auth Guards ──────────────────────────────────── */
function guardFaculty(){
  if(!localStorage.getItem('facultyEmail')){
    window.location.href = 'faculty-login.html';
    return false;
  }
  return true;
}
function guardInstitution(){
  if(!localStorage.getItem('institutionEmail')){
    window.location.href = 'institution-login.html';
    return false;
  }
  return true;
}

/* ── Faculty Registration ─────────────────────────── */
function facultyRegister(){
  const name     = ($el('regName')||{}).value?.trim();
  const email    = ($el('regEmail')||{}).value?.trim();
  const dept     = ($el('regDept')||{}).value?.trim();
  const password = ($el('regPassword')||{}).value;
  const confirm  = ($el('regConfirm')||{}).value;

  if(!name || !email || !password || !confirm){
    showAlert('regAlert','error','⚠️ Please fill all required fields.');
    return;
  }
  if(!email.includes('@') || !email.includes('.')){
    showAlert('regAlert','error','⚠️ Enter a valid email address.');
    return;
  }
  if(password.length < 6){
    showAlert('regAlert','error','⚠️ Password must be at least 6 characters.');
    return;
  }
  if(password !== confirm){
    showAlert('regAlert','error','⚠️ Passwords do not match.');
    return;
  }
  if(accountExists('faculty', email)){
    showAlert('regAlert','error','⚠️ An account with this email already exists.');
    return;
  }

  const accounts = getAccounts('faculty');
  accounts.push({ name, email, dept: dept||'', password, createdAt: formatDate() });
  saveAccounts('faculty', accounts);

  showAlert('regAlert','success','✅ Account created successfully! Redirecting to login...');
  setTimeout(() => window.location.href = 'faculty-login.html', 1500);
}

/* ── Faculty Login ────────────────────────────────── */
function facultyLogin(){
  const emailEl = $el('facultyEmail');
  const passEl  = $el('facultyPassword');
  if(!emailEl || !passEl) return;

  const email    = emailEl.value.trim();
  const password = passEl.value;

  if(!email || !password){
    showAlert('loginAlert','error','⚠️ Please fill in all fields.');
    return;
  }
  if(!email.includes('@') || !email.includes('.')){
    showAlert('loginAlert','error','⚠️ Please enter a valid email address.');
    return;
  }

  const account = findAccount('faculty', email);
  if(!account){
    showAlert('loginAlert','error','⚠️ No account found with this email. <a href="faculty-register.html" style="color:#1d4ed8;font-weight:700;">Create one →</a>');
    return;
  }
  if(account.password !== password){
    showAlert('loginAlert','error','⚠️ Incorrect password. Please try again.');
    return;
  }

  localStorage.setItem('facultyEmail', email);
  localStorage.setItem('facultyProfile', JSON.stringify({ name: account.name, dept: account.dept }));
  window.location.href = 'faculty-dashboard.html';
}

/* ── Institution Login ────────────────────────────── */
function institutionLogin(){
  const emailEl = $el('institutionEmail');
  const passEl  = $el('institutionPassword');
  if(!emailEl || !passEl) return;

  const email    = emailEl.value.trim();
  const password = passEl.value;

  if(!email || !password){
    showAlert('loginAlert','error','⚠️ Please fill in all fields.');
    return;
  }
  if(!email.includes('@') || !email.includes('.')){
    showAlert('loginAlert','error','⚠️ Please enter a valid email address.');
    return;
  }

  const account = findAccount('institution', email);
  if(!account){
    showAlert('loginAlert','error','⚠️ No account found. <a href="institution-register.html" style="color:#1d4ed8;font-weight:700;">Register Institution →</a>');
    return;
  }
  if(account.password !== password){
    showAlert('loginAlert','error','⚠️ Incorrect password.');
    return;
  }

  localStorage.setItem('institutionEmail', email);
  localStorage.setItem('institutionName', account.name || nameFromEmail(email));
  window.location.href = 'institution-dashboard.html';
}

/* ── Institution Registration ─────────────────────── */
function institutionRegister(){
  const name     = ($el('regName')||{}).value?.trim();
  const email    = ($el('regEmail')||{}).value?.trim();
  const city     = ($el('regCity')||{}).value?.trim();
  const password = ($el('regPassword')||{}).value;
  const confirm  = ($el('regConfirm')||{}).value;

  if(!name || !email || !password || !confirm){
    showAlert('regAlert','error','⚠️ Please fill all required fields.');
    return;
  }
  if(!email.includes('@') || !email.includes('.')){
    showAlert('regAlert','error','⚠️ Enter a valid email.');
    return;
  }
  if(password.length < 6){
    showAlert('regAlert','error','⚠️ Password must be at least 6 characters.');
    return;
  }
  if(password !== confirm){
    showAlert('regAlert','error','⚠️ Passwords do not match.');
    return;
  }
  if(accountExists('institution', email)){
    showAlert('regAlert','error','⚠️ An institution account already exists with this email.');
    return;
  }

  const accounts = getAccounts('institution');
  accounts.push({ name, email, city: city||'', password, createdAt: formatDate() });
  saveAccounts('institution', accounts);

  showAlert('regAlert','success','✅ Institution registered! Redirecting to login...');
  setTimeout(() => window.location.href = 'institution-login.html', 1500);
}

/* ── Forgot Password — Send OTP ───────────────────── */
function sendForgotOTP(role){
  const emailEl = $el('forgotEmail');
  if(!emailEl) return;
  const email = emailEl.value.trim();

  if(!email || !email.includes('@')){
    showAlert('forgotAlert','error','⚠️ Enter a valid email address.');
    return;
  }

  const account = findAccount(role, email);
  if(!account){
    showAlert('forgotAlert','error','⚠️ No account found with this email.');
    return;
  }

  const otp = generateOTP();
  storeOTP(email, otp);
  localStorage.setItem('forgotEmail_' + role, email);

  // Simulate OTP display (in real app this would be emailed)
  showAlert('forgotAlert','success',
    `✅ OTP generated! <br><strong style="font-size:22px;color:#1d4ed8;letter-spacing:4px;">${otp}</strong><br>
    <span style="font-size:12px;color:#64748b;">(In a real system, this would be sent to your email)</span>`
  );

  // Show OTP step
  const step2 = $el('otpStep');
  if(step2) step2.style.display = 'block';
  const step1btn = $el('sendOtpBtn');
  if(step1btn) step1btn.disabled = true;
}

/* ── Forgot Password — Verify & Reset ─────────────── */
function verifyOTPAndReset(role){
  const email    = localStorage.getItem('forgotEmail_' + role) || '';
  const inputOtp = ($el('otpInput')||{}).value?.trim();
  const newPass  = ($el('newPassword')||{}).value;
  const confPass = ($el('confirmPassword')||{}).value;

  if(!inputOtp || !newPass || !confPass){
    showAlert('forgotAlert','error','⚠️ Please fill all fields.');
    return;
  }
  if(!verifyOTP(email, inputOtp)){
    showAlert('forgotAlert','error','⚠️ Invalid or expired OTP. Please try again.');
    return;
  }
  if(newPass.length < 6){
    showAlert('forgotAlert','error','⚠️ Password must be at least 6 characters.');
    return;
  }
  if(newPass !== confPass){
    showAlert('forgotAlert','error','⚠️ Passwords do not match.');
    return;
  }

  // Update password
  const accounts = getAccounts(role);
  const idx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase());
  if(idx !== -1){
    accounts[idx].password = newPass;
    saveAccounts(role, accounts);
  }

  clearOTP(email);
  localStorage.removeItem('forgotEmail_' + role);

  showAlert('forgotAlert','success','✅ Password reset successfully! Redirecting to login...');
  const loginPage = role === 'faculty' ? 'faculty-login.html' : 'institution-login.html';
  setTimeout(() => window.location.href = loginPage, 2000);
}

/* ── Faculty Dashboard ────────────────────────────── */
function initFacultyDashboard(){
  if(!guardFaculty()) return;
  const email   = localStorage.getItem('facultyEmail') || '';
  const profile = JSON.parse(localStorage.getItem('facultyProfile') || '{}');
  const name    = profile.name || nameFromEmail(email);

  const wMsg = $el('welcomeMsg');
  if(wMsg) wMsg.textContent = 'Welcome back, ' + name + '. Manage marks, subjects and student records.';

  const allRecords = JSON.parse(localStorage.getItem('uploadedRecords') || '[]');
  const students   = [...new Set(allRecords.map(r => r.rollNo))];
  const subjects   = [...new Set(allRecords.map(r => r.subject))];

  setText('statStudents', students.length);
  setText('statSubjects', subjects.length);
  setText('statRecords',  allRecords.length);
  setText('statPending',  0);

  const recentUploads = $el('recentUploads');
  if(!recentUploads) return;

  const uploads = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
  if(uploads.length === 0){
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
    html += `<tr><td>${u.subject}</td><td>${u.batch}</td><td>${u.examType||'Theory'}</td><td>${u.count}</td><td>${u.date}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  recentUploads.innerHTML = html;
}

/* ── Institution Dashboard ────────────────────────── */
function initInstitutionDashboard(){
  if(!guardInstitution()) return;
  const email = localStorage.getItem('institutionEmail') || '';
  const name  = localStorage.getItem('institutionName') || nameFromEmail(email);

  const wMsg = $el('instWelcome');
  if(wMsg) wMsg.textContent = 'Welcome, ' + name + '. Manage faculty uploads and generate final grades.';

  const allRecords = JSON.parse(localStorage.getItem('uploadedRecords') || '[]');
  const students   = [...new Set(allRecords.map(r => r.rollNo))];
  const subjects   = [...new Set(allRecords.map(r => r.subject))];
  const batches    = [...new Set(allRecords.map(r => r.batch))];

  setText('iStatStudents', students.length);
  setText('iStatSubjects', subjects.length);
  setText('iStatRecords',  allRecords.length);
  setText('iStatBatches',  batches.length);

  const container = $el('subjectSummaryContainer');
  if(!container) return;

  if(allRecords.length === 0){
    container.innerHTML = `<div class="empty-state card">
      <div class="empty-icon">📭</div>
      <h3>No records yet</h3>
      <p>Faculty must upload marks before summaries appear here.</p>
    </div>`;
    return;
  }

  const subjectMap = {};
  allRecords.forEach(r => {
    if(!subjectMap[r.subject]) subjectMap[r.subject] = { students: new Set(), batches: new Set(), marks: [] };
    subjectMap[r.subject].students.add(r.rollNo);
    subjectMap[r.subject].batches.add(r.batch);
    subjectMap[r.subject].marks.push(Number(r.theoryTotal || r.marks) || 0);
  });

  let html = `<div class="table-wrap"><table>
    <thead><tr><th>Subject</th><th>Students</th><th>Batches</th><th>Avg Marks</th><th>Highest</th><th>Lowest</th></tr></thead><tbody>`;
  Object.entries(subjectMap).forEach(([subject, data]) => {
    const avg = (data.marks.reduce((a,b)=>a+b,0)/data.marks.length).toFixed(1);
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
function initDropdown(){
  const loginBtn     = $el('loginBtn');
  const dropdownMenu = $el('dropdownMenu');
  const heroLoginBtn = $el('heroLoginBtn');

  if(loginBtn && dropdownMenu){
    loginBtn.addEventListener('click', e => {
      e.preventDefault();
      dropdownMenu.classList.toggle('show');
    });
    document.addEventListener('click', e => {
      if(!loginBtn.contains(e.target) && !dropdownMenu.contains(e.target)){
        dropdownMenu.classList.remove('show');
      }
    });
  }
  if(heroLoginBtn && dropdownMenu){
    heroLoginBtn.addEventListener('click', () => {
      dropdownMenu.classList.add('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ── SGPA Calculator — New Evaluation Scheme ──────── */
// Theory: CA(25) + Midsem(25) + Endsem(50) = 100
// Practical: LabManual(10) + LabAssessment(10) + Viva(30) + EndPractical(50) = 100
// Final = Theory(60%) + Practical(40%)

function addSubject(){
  const container = $el('subjectsContainer');
  if(!container) return;
  const card = document.createElement('div');
  card.className = 'subject-card';
  card.innerHTML = buildSubjectCardHTML(true);
  container.appendChild(card);
  updateExamTypeVisibility(card.querySelector('.examTypeSelect'));
}

function buildSubjectCardHTML(removable){
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
        <option value="theory">Theory Only (60%)</option>
        <option value="practical">Practical Only (40%)</option>
        <option value="both">Theory + Practical</option>
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

function updateExamTypeVisibility(selectEl){
  const card = selectEl.closest('.subject-card');
  const theorySection = card.querySelector('.theory-section');
  const practicalSection = card.querySelector('.practical-section');
  const val = selectEl.value;
  theorySection.style.display    = (val === 'practical') ? 'none' : 'block';
  practicalSection.style.display = (val === 'theory')    ? 'none' : 'block';
}

function getNum(el){ return Math.max(0, Number(el?.value) || 0); }

function calculateSGPA(){
  const cards = document.querySelectorAll('.subject-card');
  if(cards.length === 0){ alert('Please add at least one subject.'); return; }

  let totalCreditPoints = 0;
  let totalCredits = 0;
  let breakdown = [];

  for(const card of cards){
    const c = Number(card.querySelector('.credits')?.value);
    if(!c || c <= 0){ alert('Please enter valid credits for all subjects.'); return; }

    const type = card.querySelector('.examTypeSelect')?.value || 'theory';
    let finalMark = 0;

    const ca  = getNum(card.querySelector('.ca'));
    const mid = getNum(card.querySelector('.midterm'));
    const end = getNum(card.querySelector('.endterm'));
    const theoryTotal = ca + mid + end; // max 100

    const labM = getNum(card.querySelector('.labManual'));
    const labA = getNum(card.querySelector('.labAssessment'));
    const viva = getNum(card.querySelector('.viva'));
    const endP = getNum(card.querySelector('.endPractical'));
    const practicalTotal = labM + labA + viva + endP; // max 100

    if(type === 'theory')     finalMark = theoryTotal;
    else if(type === 'practical') finalMark = practicalTotal;
    else finalMark = (theoryTotal * 0.6) + (practicalTotal * 0.4); // combined

    const gp = marksToGP(finalMark);
    totalCreditPoints += c * gp;
    totalCredits += c;

    const name = card.querySelector('.subjectName')?.value || 'Subject';
    breakdown.push({ name, finalMark: finalMark.toFixed(1), gp, credits: c, type });
  }

  const sgpa = (totalCreditPoints / totalCredits).toFixed(2);
  const result = $el('totalMarks');
  if(result) result.textContent = sgpa;

  const label = $el('sgpaLabel');
  if(label){
    const s = parseFloat(sgpa);
    let lbl = s >= 9 ? '🏆 Outstanding' : s >= 8 ? '⭐ Excellent' : s >= 7 ? '✅ Good' : s >= 6 ? '🔵 Average' : '⚠️ Below Average';
    label.textContent = lbl;
    label.style.display = 'block';
  }

  // Breakdown table
  const bkEl = $el('breakdownTable');
  if(bkEl){
    let html = `<div class="table-wrap" style="margin-top:24px;"><table>
      <thead><tr><th>Subject</th><th>Type</th><th>Final Mark</th><th>Grade Point</th><th>Credits</th><th>Credit Points</th></tr></thead><tbody>`;
    breakdown.forEach(b => {
      html += `<tr>
        <td><strong>${b.name}</strong></td>
        <td><span class="badge badge-blue">${b.type}</span></td>
        <td>${b.finalMark}</td>
        <td class="grade-${gpToGrade(b.gp)}">${b.gp} (${gpToGrade(b.gp)})</td>
        <td>${b.credits}</td>
        <td>${(b.gp * b.credits).toFixed(1)}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    bkEl.innerHTML = html;
    bkEl.style.display = 'block';
  }
}

function marksToGP(marks){
  if(marks >= 90) return 10;
  if(marks >= 80) return 9;
  if(marks >= 70) return 8;
  if(marks >= 60) return 7;
  if(marks >= 50) return 6;
  if(marks >= 40) return 5;
  return 0;
}

function gpToGrade(gp){
  if(gp === 10) return 'O';
  if(gp === 9)  return 'A+';
  if(gp === 8)  return 'A';
  if(gp === 7)  return 'B+';
  if(gp === 6)  return 'B';
  if(gp === 5)  return 'C';
  return 'F';
}

/* ── Excel Upload ─────────────────────────────────── */
let uploadedData = [];

function readExcelFile(){
  const subjectName = $el('subjectName')?.value.trim();
  const batchName   = $el('batchName')?.value.trim();
  const examType    = $el('examTypeUpload')?.value || 'theory';
  const fileInput   = $el('fileInput');
  const file        = fileInput?.files?.[0];

  if(!subjectName){ showAlert('uploadAlert','error','⚠️ Please enter a subject name.'); return; }
  if(!batchName)  { showAlert('uploadAlert','error','⚠️ Please enter a batch name.'); return; }
  if(!file)       { showAlert('uploadAlert','error','⚠️ Please select a file.'); return; }
  if(typeof XLSX === 'undefined'){ showAlert('uploadAlert','error','⚠️ Excel library not loaded.'); return; }

  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const data  = new Uint8Array(e.target.result);
      const wb    = XLSX.read(data, { type:'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      uploadedData = XLSX.utils.sheet_to_json(sheet);
      if(uploadedData.length === 0){ showAlert('uploadAlert','error','⚠️ File is empty.'); return; }
      showPreview(examType);
      showAlert('uploadAlert','success','✅ File loaded! Review the preview below.');
    } catch(err){
      showAlert('uploadAlert','error','⚠️ Could not read file.');
    }
  };
  reader.onerror = () => showAlert('uploadAlert','error','⚠️ File read error.');
  reader.readAsArrayBuffer(file);
}

function showPreview(examType){
  if(!uploadedData.length) return;
  const keys = Object.keys(uploadedData[0]);
  let html = `<div class="table-wrap"><table><thead><tr>`;
  keys.forEach(k => html += `<th>${k}</th>`);
  html += `</tr></thead><tbody>`;
  uploadedData.slice(0, 50).forEach(row => {
    html += `<tr>`;
    keys.forEach(k => html += `<td>${row[k] !== undefined ? row[k] : ''}</td>`);
    html += `</tr>`;
  });
  if(uploadedData.length > 50){
    html += `<tr><td colspan="${keys.length}" style="text-align:center;color:#64748b;">... and ${uploadedData.length - 50} more rows</td></tr>`;
  }
  html += `</tbody></table></div>`;
  $el('tableContainer').innerHTML = html;
  $el('previewSection').style.display = 'block';
  const rc = $el('recordCount');
  if(rc) rc.textContent = uploadedData.length + ' record(s) ready to save.';
  $el('previewSection').scrollIntoView({ behavior:'smooth' });
}

function saveRecords(){
  if(!uploadedData.length){ showAlert('uploadAlert','error','⚠️ No data to save.'); return; }

  const subjectName  = $el('subjectName')?.value.trim()  || 'Unknown';
  const subjectCode  = $el('subjectCode')?.value.trim()  || '';
  const batchName    = $el('batchName')?.value.trim()    || 'Unknown';
  const semester     = $el('semesterInput')?.value.trim()|| '';
  const academicYear = $el('academicYear')?.value.trim() || '';
  const examType     = $el('examTypeUpload')?.value      || 'theory';

  const enriched = uploadedData.map(row => {
    const get = (...keys) => {
      for(const k of keys){
        const v = row[k];
        if(v !== undefined && v !== null && v !== '') return v;
      }
      return null;
    };

    const rollNo = String(get('rollNo','Roll No','ROLL NO','RollNo','roll_no') || '—');
    const name   = String(get('name','Name','Student Name','STUDENT NAME') || '—');

    // Theory marks
    const ca         = Number(get('ca','CA','Continuous Assessment','ContinuousAssessment') || 0);
    const midsem     = Number(get('midsem','Midsem','midterm','Midterm','Mid Term') || 0);
    const endsem     = Number(get('endsem','Endsem','endterm','End Term','EndTerm') || 0);
    const theoryTotal = ca + midsem + endsem || Number(get('marks','Marks','MARKS','Total') || 0);

    // Practical marks
    const labManual    = Number(get('labManual','Lab Manual','LabManual') || 0);
    const labAssessment= Number(get('labAssessment','Lab Assessment','LabAssessment') || 0);
    const viva         = Number(get('viva','Viva','Viva-voce','InternalViva') || 0);
    const endPractical = Number(get('endPractical','End Practical','EndPractical','EndSem Practical') || 0);
    const practicalTotal = labManual + labAssessment + viva + endPractical;

    let finalMarks;
    if(examType === 'theory') finalMarks = theoryTotal;
    else if(examType === 'practical') finalMarks = practicalTotal;
    else finalMarks = (theoryTotal * 0.6) + (practicalTotal * 0.4);

    return {
      rollNo, name,
      ca, midsem, endsem, theoryTotal,
      labManual, labAssessment, viva, endPractical, practicalTotal,
      marks: Math.round(finalMarks * 10) / 10,
      maxMarks: 100,
      examType,
      subject: subjectName, subjectCode, batch: batchName,
      semester, academicYear, uploadedOn: formatDate()
    };
  });

  const existing = JSON.parse(localStorage.getItem('uploadedRecords') || '[]');
  localStorage.setItem('uploadedRecords', JSON.stringify(existing.concat(enriched)));

  const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
  history.push({ subject: subjectName, batch: batchName, examType, count: enriched.length, date: formatDate() });
  localStorage.setItem('uploadHistory', JSON.stringify(history));

  showAlert('uploadAlert','success','✅ ' + enriched.length + ' records saved successfully!');
  clearPreview();
}

function clearPreview(){
  uploadedData = [];
  const ps = $el('previewSection');
  if(ps) ps.style.display = 'none';
}

/* ── Export All Results ───────────────────────────── */
function exportAllResults(){
  const records = JSON.parse(localStorage.getItem('uploadedRecords') || '[]');
  if(!records.length){ alert('No records to export.'); return; }
  const headers = ['Roll No','Name','Subject','Batch','Exam Type','CA','Midsem','Endsem','Theory Total','Lab Manual','Lab Assess','Viva','End Practical','Practical Total','Final Marks','Academic Year','Uploaded On'];
  const rows = records.map(r => [r.rollNo,r.name,r.subject,r.batch,r.examType||'theory',
    r.ca||0,r.midsem||0,r.endsem||0,r.theoryTotal||r.marks,
    r.labManual||0,r.labAssessment||0,r.viva||0,r.endPractical||0,r.practicalTotal||0,
    r.marks,r.academicYear||'—',r.uploadedOn||'—']);
  downloadCSV([headers,...rows], 'UniGrade_AllResults.csv');
}

function downloadCSV(rows, filename){
  const csv  = rows.map(r => r.map(v => '"' + String(v||'').replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── DOMContentLoaded Router ─────────────────────── */
document.addEventListener('DOMContentLoaded', function(){
  const page = location.pathname.split('/').pop() || 'index.html';
  initDropdown();
  if(page === 'faculty-dashboard.html')     initFacultyDashboard();
  if(page === 'institution-dashboard.html') initInstitutionDashboard();

  // Initialize first subject card in SGPA calculator
  const firstCard = document.querySelector('.subject-card');
  if(firstCard){
    const sel = firstCard.querySelector('.examTypeSelect');
    if(sel) updateExamTypeVisibility(sel);
  }
});
