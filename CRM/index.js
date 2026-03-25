const STORAGE_KEY = 'crm_customers';
const SALES_KEY = 'sales';

let customers = [], noteIdx = null, editIdx = null, deleteIdx = null;

// ─── LOAD & INIT ───
function load() {
  customers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  importFromPOS();
  updateStats();
  renderTable();
}

// ─── AUTO IMPORT จาก POS ───
function importFromPOS() {
  const sales = JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
  if (!sales.length) return;

  let imported = 0;
  const custMap = {};
  sales.forEach(s => {
    const name = (s.name || s.customerName || '').trim();
    const phone = (s.phone || '').trim();
    const email = (s.email || '').trim();
    if (!name && !phone) return;
    const key = phone || email || name;
    if (!custMap[key]) {
      custMap[key] = { name, phone, email, address: s.address || '', totalSpent: 0, buyCount: 0, lastBuy: s.isoDate || '' };
    }
    custMap[key].totalSpent += Math.round(s.total || 0);
    custMap[key].buyCount += 1;
    const d = s.isoDate || '';
    if (d && d > custMap[key].lastBuy) custMap[key].lastBuy = d;
  });

  Object.values(custMap).forEach(c => {
    const existing = customers.find(x =>
      (c.phone && x.phone === c.phone) ||
      (c.email && x.email === c.email) ||
      (c.name && x.name === c.name)
    );
    if (!existing) {
      customers.push({
        id: Date.now() + Math.random(),
        name: c.name, email: c.email, phone: c.phone, address: c.address,
        totalSpent: c.totalSpent, buyCount: c.buyCount,
        lastBuy: c.lastBuy, notes: [], createdAt: new Date().toISOString(),
      });
      imported++;
    } else {
      existing.totalSpent = c.totalSpent;
      existing.buyCount = c.buyCount;
      if (c.lastBuy) existing.lastBuy = c.lastBuy;
    }
  });

  if (imported > 0) { save(); showToast('นำเข้า ' + imported + ' รายการจาก POS', 'inf'); }
  else if (Object.keys(custMap).length > 0) { save(); }
}

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(customers)); }

// ─── STATS ───
function updateStats() {
  document.getElementById('st-all').textContent = customers.length;
  const totalRevenue = customers.reduce((a, c) => a + (c.totalSpent || 0), 0);
  document.getElementById('st-revenue').textContent = '฿' + Math.round(totalRevenue).toLocaleString('th-TH');
}

// ─── TABLE ───
function renderTable() {
  const list = customers;

  const body = document.getElementById('custBody');
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="ei">📭</div><p>ไม่พบรายการ</p></div></td></tr>`;
    return;
  }

  body.innerHTML = list.map((c, fi) => {
    const ri = customers.indexOf(c);
    const spent = c.totalSpent ? '฿' + Math.round(c.totalSpent).toLocaleString('th-TH') : '—';
    const lastBuy = c.lastBuy
      ? (c.lastBuy.includes('T') ? new Date(c.lastBuy).toLocaleDateString('th-TH') : c.lastBuy)
      : '—';
    return `<tr>
      <td>${fi + 1}</td>
      <td><b>${c.name}</b></td>
      <td>${c.phone || '—'}</td>
      <td>${c.email || '—'}</td>
      <td style="font-weight:700">${spent}</td>
      <td>${lastBuy}</td>
      <td><button class="btn btn-warning btn-sm" onclick="openNote(${ri})">📝 ${(c.notes || []).length}</button></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" onclick="openEdit(${ri})">✏️ แก้ไข</button>
          <button class="btn btn-danger btn-sm" onclick="openDelete(${ri})">🗑️ ลบ</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── NOTES ───
function openNote(i) {
  noteIdx = i;
  document.getElementById('note-custName').textContent = customers[i].name;
  document.getElementById('note-input').value = '';
  renderNotes();
  document.getElementById('noteModal').classList.add('open');
}

function renderNotes() {
  const notes = [...(customers[noteIdx].notes || [])].reverse();
  const el = document.getElementById('note-list');
  if (!notes.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:16px;font-size:13px">ยังไม่มีบันทึก</div>';
    return;
  }
  el.innerHTML = notes.map(n => `
    <div class="note-item">
      <div class="note-date">${n.date}</div>
      ${n.text}
    </div>`).join('');
}

function saveNote() {
  const text = document.getElementById('note-input').value.trim();
  if (!text) return;
  if (!customers[noteIdx].notes) customers[noteIdx].notes = [];
  customers[noteIdx].notes.push({ date: new Date().toLocaleString('th-TH'), text });
  save(); renderNotes(); renderTable();
  document.getElementById('note-input').value = '';
  showToast('📝 บันทึกแล้ว', 'ok');
}

// ─── EDIT ───
function openEdit(i) {
  editIdx = i;
  const c = customers[i];
  document.getElementById('edit-name').value = c.name || '';
  document.getElementById('edit-phone').value = c.phone || '';
  document.getElementById('edit-email').value = c.email || '';
  document.getElementById('edit-address').value = c.address || '';
  document.getElementById('editModal').classList.add('open');
}

function saveEdit() {
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { showToast('กรุณากรอกชื่อลูกค้า', 'err'); return; }

  customers[editIdx].name    = name;
  customers[editIdx].phone   = document.getElementById('edit-phone').value.trim();
  customers[editIdx].email   = document.getElementById('edit-email').value.trim();
  customers[editIdx].address = document.getElementById('edit-address').value.trim();

  save(); updateStats(); renderTable();
  closeModal('editModal');
  showToast('✏️ แก้ไขข้อมูลแล้ว', 'ok');
}

// ─── DELETE ───
function openDelete(i) {
  deleteIdx = i;
  document.getElementById('delete-custName').textContent = customers[i].name;
  document.getElementById('deleteModal').classList.add('open');
}

function confirmDelete() {
  const name = customers[deleteIdx].name;
  customers.splice(deleteIdx, 1);
  deleteIdx = null;
  save(); updateStats(); renderTable();
  closeModal('deleteModal');
  showToast('🗑️ ลบ ' + name + ' แล้ว', 'ok');
}

// ─── MODAL ───
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.overlay').forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); })
);

// ─── TOAST ───
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.className = type; t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

load();