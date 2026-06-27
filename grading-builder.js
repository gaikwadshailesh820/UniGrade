/* =====================================================
   UniGrade — grading-builder.js
   Page logic for grading-systems.html (Custom Grading
   System Builder + Library browser).
   ===================================================== */

import {
  getAllSystems,
  getAbsoluteSystems,
  getRelativeSystems,
  getCustomSystems,
  getSystem,
  saveCustomSystem,
  deleteCustomSystem,
  duplicateSystem,
  getActiveAbsoluteSystem,
  setActiveAbsoluteSystem,
  getActiveRelativeSystem,
  setActiveRelativeSystem,
  validateSystem,
  createEmptySystem
} from './grading.js';

const $ = (id) => document.getElementById(id);

let editingId = null; // id of the custom system currently loaded in the builder

function showBuilderAlert(type, msg) {
  const el = $('builderAlert');
  el.className = 'alert alert-' + type;
  el.innerHTML = msg;
  el.style.display = 'flex';
  if (type === 'success') setTimeout(() => el.style.display = 'none', 3500);
}

/* ── Rule rows ─────────────────────────────────────── */

function addRuleRow(rule = { grade: '', min: '', max: '', gradePoint: '' }) {
  const tbody = $('rulesBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="ruleGrade" value="${rule.grade ?? ''}" placeholder="e.g. O" style="margin:0;"></td>
    <td><input type="number" class="ruleMin" value="${rule.min === -Infinity ? '' : rule.min ?? ''}" placeholder="min" style="margin:0;" step="0.01"></td>
    <td><input type="number" class="ruleMax" value="${rule.max === Infinity || rule.max === undefined ? '' : rule.max ?? ''}" placeholder="max (blank = ∞)" style="margin:0;" step="0.01"></td>
    <td><input type="number" class="ruleGP" value="${rule.gradePoint ?? ''}" placeholder="0–10" style="margin:0;" min="0" max="10"></td>
    <td><button type="button" class="removeRuleBtn btn-danger" style="width:auto;padding:8px 12px;font-size:12px;">✕</button></td>
  `;
  tr.querySelector('.removeRuleBtn').addEventListener('click', () => tr.remove());
  tbody.appendChild(tr);
}

function clearRuleRows() {
  $('rulesBody').innerHTML = '';
}

function updateModeLabels() {
  const isRelative = $('sysMode').value === 'relative';
  $('minHeader').textContent = isRelative ? 'Min Z-Score' : 'Min Marks (%)';
  $('maxHeader').textContent = isRelative ? 'Max Z-Score' : 'Max Marks (%)';
}

/* ── Form <-> System object ───────────────────────── */

function loadSystemIntoForm(system) {
  editingId = system.isCustom ? system.id : null; // built-ins are loaded as a starting template, not edited in place
  $('builderTitle').textContent = system.isCustom ? '🛠️ Editing: ' + system.name : '🛠️ New System (based on ' + system.name + ')';
  $('sysName').value = system.isCustom ? system.name : '';
  $('sysUniversity').value = system.university || '';
  $('sysMode').value = system.mode;
  $('sysPassingGP').value = system.passingGradePoint ?? 4;
  $('sysDescription').value = system.description || '';
  updateModeLabels();
  clearRuleRows();
  system.rules.forEach(addRuleRow);
  window.scrollTo({ top: $('builderTitle').offsetTop - 100, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  $('builderTitle').textContent = '🛠️ Custom Grading Builder';
  $('sysName').value = '';
  $('sysUniversity').value = '';
  $('sysMode').value = 'absolute';
  $('sysPassingGP').value = 4;
  $('sysDescription').value = '';
  updateModeLabels();
  clearRuleRows();
  const blank = createEmptySystem('absolute');
  blank.rules.forEach(addRuleRow);
}

function readFormAsSystem() {
  const rows = [...$('rulesBody').querySelectorAll('tr')];
  const rules = rows.map(row => ({
    grade: row.querySelector('.ruleGrade').value.trim(),
    min: row.querySelector('.ruleMin').value === '' ? -Infinity : Number(row.querySelector('.ruleMin').value),
    max: row.querySelector('.ruleMax').value === '' ? Infinity : Number(row.querySelector('.ruleMax').value),
    gradePoint: Number(row.querySelector('.ruleGP').value)
  }));

  return {
    id: editingId || ('custom-' + Date.now()),
    name: $('sysName').value.trim(),
    university: $('sysUniversity').value.trim(),
    mode: $('sysMode').value,
    description: $('sysDescription').value.trim(),
    passingGradePoint: Number($('sysPassingGP').value) || 0,
    isCustom: true,
    rules
  };
}

/* ── Library rendering ────────────────────────────── */

function systemCardHTML(system, { showActions = true } = {}) {
  const activeAbsolute = getActiveAbsoluteSystem().id === system.id;
  const activeRelative = getActiveRelativeSystem().id === system.id;
  const isActive = activeAbsolute || activeRelative;

  const rulesPreview = system.rules
    .slice(0, 4)
    .map(r => `<span class="eval-pill ${system.mode === 'relative' ? 'practical' : ''}">${r.grade} → GP ${r.gradePoint}</span>`)
    .join('');

  return `
    <div class="card" style="cursor:default;${isActive ? 'border:2px solid var(--primary-mid);' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:8px;">
        <div>
          <h3 style="color:var(--primary);font-size:16px;font-weight:700;margin-bottom:4px;">${system.name}</h3>
          <p style="color:var(--text-muted);font-size:12.5px;margin:0;">${system.university || '—'}</p>
        </div>
        <span class="badge ${system.mode === 'relative' ? 'badge-purple' : 'badge-blue'}">${system.mode}</span>
      </div>
      ${system.description ? `<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">${system.description}</p>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">${rulesPreview}${system.rules.length > 4 ? `<span class="eval-pill">+${system.rules.length - 4} more</span>` : ''}</div>
      ${showActions ? `
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" data-action="activate" data-id="${system.id}" data-mode="${system.mode}" style="width:auto;padding:9px 14px;font-size:12.5px;">${isActive ? '✅ Active' : 'Set Active'}</button>
        <button type="button" class="btn-secondary" data-action="duplicate" data-id="${system.id}" style="width:auto;padding:9px 14px;font-size:12.5px;">⧉ Duplicate / Edit</button>
        ${system.isCustom ? `<button type="button" class="btn-danger" data-action="delete" data-id="${system.id}" style="width:auto;padding:9px 14px;font-size:12.5px;">🗑️ Delete</button>` : ''}
      </div>` : ''}
    </div>`;
}

function renderLibrary() {
  const container = $('systemLibrary');
  const systems = [...getAbsoluteSystems().filter(s => !s.isCustom), ...getRelativeSystems().filter(s => !s.isCustom)];
  container.innerHTML = systems.map(s => systemCardHTML(s)).join('');
  container.querySelectorAll('button[data-action]').forEach(bindCardAction);
}

function renderCustomSystems() {
  const container = $('customSystemsContainer');
  const customs = getCustomSystems();
  if (customs.length === 0) {
    container.innerHTML = `
      <div class="empty-state card" style="border:1px solid rgba(255,255,255,0.5);">
        <div class="empty-icon">🧩</div>
        <h3>No custom grading systems yet</h3>
        <p>Use the builder above to create one, or duplicate a system from the library to start editing.</p>
      </div>`;
    return;
  }
  container.innerHTML = `<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:18px;">
    ${customs.map(s => systemCardHTML(s)).join('')}
  </div>`;
  container.querySelectorAll('button[data-action]').forEach(bindCardAction);
}

function bindCardAction(btn) {
  btn.addEventListener('click', () => {
    const { action, id, mode } = btn.dataset;
    const system = getSystem(id);
    if (!system) return;

    if (action === 'activate') {
      if (mode === 'relative') setActiveRelativeSystem(id);
      else setActiveAbsoluteSystem(id);
      showBuilderAlert('success', `✅ "${system.name}" is now the active ${mode} grading system.`);
      renderLibrary();
      renderCustomSystems();
    }

    if (action === 'duplicate') {
      loadSystemIntoForm(system.isCustom ? system : { ...system, isCustom: false });
    }

    if (action === 'delete') {
      if (!confirm(`Delete "${system.name}"? This cannot be undone.`)) return;
      deleteCustomSystem(id);
      showBuilderAlert('success', '🗑️ Custom grading system deleted.');
      renderCustomSystems();
      renderLibrary();
    }
  });
}

/* ── Init ──────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  if (!$('rulesBody')) return; // not this page

  resetForm();
  renderLibrary();
  renderCustomSystems();

  $('addRuleBtn').addEventListener('click', () => addRuleRow());
  $('newSystemBtn').addEventListener('click', resetForm);
  $('sysMode').addEventListener('change', updateModeLabels);

  $('saveSystemBtn').addEventListener('click', () => {
    const system = readFormAsSystem();
    const errors = validateSystem(system);
    if (errors.length) {
      showBuilderAlert('error', '⚠️ ' + errors.join('<br>⚠️ '));
      return;
    }
    saveCustomSystem(system);
    editingId = system.id;
    showBuilderAlert('success', `✅ "${system.name}" saved! You can now set it as active from the list below.`);
    renderCustomSystems();
  });
});
