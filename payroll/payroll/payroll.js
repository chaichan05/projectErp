const KEY      = 'payroll_employees';
const SSF_RATE = 0.05;
const SSF_MAX  = 750;

const DEPT_CFG = {
  mgmt: { label: '👔 ผู้บริหาร',           cls: 'dept-mgmt' },
  milk: { label: '🥛 รับนม',               cls: 'dept-milk' },
  prod: { label: '🏭 ฝ่ายผลิต',            cls: 'dept-prod' },
  acc:  { label: '📊 บัญชี',               cls: 'dept-acc'  },
  qc:   { label: '🔬 QC',                  cls: 'dept-qc'   },
  feed: { label: '🌾 อาหารวัว',            cls: 'dept-feed' },
  fin:  { label: '💰 การเงิน',             cls: 'dept-acc'  },
};

const DEFAULT_EMPLOYEES = [
  { name: 'ชัยชาญ กลิ่นปะเสริฐ',      pos: 'เจ้าของ / ผู้บริหาร',        dept: 'mgmt', salary: 70750 },
  { name: 'นภัสสร มิลเลอร์',           pos: 'พนักงานฝ่ายบริการรับนม',    dept: 'milk', salary: 15750 },
  { name: 'กมลชนก บราวน์',             pos: 'พนักงานฝ่ายบริการรับนม',    dept: 'milk', salary: 15750 },
  { name: 'ธนกร วิลสัน',               pos: 'หัวหน้าฝ่ายผลิต',            dept: 'prod', salary: 25750 },
  { name: 'พีรพัฒน์ แฮร์ริส',          pos: 'พนักงานฝ่ายผลิต',            dept: 'prod', salary: 20750 },
  { name: 'วรินทร เทย์เลอร์',          pos: 'พนักงานฝ่ายผลิต',            dept: 'prod', salary: 20750 },
  { name: 'ปณิธาน คูเปอร์',            pos: 'พนักงานฝ่ายผลิต',            dept: 'prod', salary: 20750 },
  { name: 'ศุภิสรา มอร์แกน',           pos: 'พนักงานฝ่ายการเงิน',         dept: 'fin',  salary: 21750 },
  { name: 'ชนิสรา ไรท์',               pos: 'พนักงานฝ่ายการเงิน',         dept: 'fin',  salary: 21750 },
  { name: 'ภัทรพล อีแวนส์',            pos: 'พนักงานฝ่าย QC',             dept: 'qc',   salary: 20750 },
  { name: 'อัจฉริยา ฟอสเตอร์',         pos: 'พนักงานฝ่าย QC',             dept: 'qc',   salary: 20750 },
  { name: 'ณัฐวุฒิ คลาร์ก',            pos: 'หัวหน้าฝ่ายผลิตอาหารวัว',  dept: 'feed', salary: 25750 },
  { name: 'สิรภพ เบนเนตต์',            pos: 'พนักงานผลิตอาหารวัว',        dept: 'feed', salary: 20750 },
  { name: 'กัญญาณัฐ เทิร์นเนอร์',      pos: 'พนักงานผลิตอาหารวัว',        dept: 'feed', salary: 20750 },
  { name: 'ปุณณภพ ฮิวจ์',              pos: 'พนักงานผลิตอาหารวัว',        dept: 'feed', salary: 20750 },
];

let employees = [];

// ─── UTILS ───
function calcSSF(salary)        { return Math.min(Math.round(salary * SSF_RATE), SSF_MAX); }
function calcNet(salary, ssf)   { return salary - ssf; }
function fmt(n)  { return Math.round(n).toLocaleString('th-TH'); }
function fmtB(n) { return '฿' + fmt(n); }
function currentMonth() {
  return document.getElementById('monthPicker').value || new Date().toISOString().slice(0, 7);
}

// ─── LOAD / SAVE ───
function load() {
  employees = JSON.parse(localStorage.getItem(KEY) || '[]');
  if (!employees.length) {
    employees = DEFAULT_EMPLOYEES.map((e, i) => ({ ...e, id: i + 1, paidMonths: [] }));
    save();
  }
  const now = new Date();
  document.getElementById('monthPicker').value =
    now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  updateStats();
  renderTable();
}

function save() { localStorage.setItem(KEY, JSON.stringify(employees)); }

// ─── STATS ───
function updateStats() {
  const month     = currentMonth();
  const sumSalary = employees.reduce((a, e) => a + e.salary, 0);
  const sumSSF    = employees.reduce((a, e) => a + calcSSF(e.salary), 0);
  const sumNet    = employees.reduce((a, e) => a + calcNet(e.salary, calcSSF(e.salary)), 0);
  const paid      = employees.filter(e => (e.paidMonths || []).includes(month)).length;

  document.getElementById('st-emp').textContent   = employees.length + ' คน';
  document.getElementById('st-total').textContent = fmtB(sumSalary);
  document.getElementById('st-ssf').textContent   = fmtB(sumSSF);
  document.getElementById('st-paid').textContent  = paid + '/' + employees.length;
}

// ─── NET PREVIEW ───
function calcNetPreview() {
  const salary = parseFloat(document.getElementById('f-salary').value) || 0;
  const el     = document.getElementById('net-preview');
  if (!salary) { el.innerHTML = ''; return; }
  const ssf = calcSSF(salary);
  const net = calcNet(salary, ssf);
  el.innerHTML =
    `💡 รับสุทธิ: <b style="color:var(--success,#27ae60)">${fmtB(net)}</b>` +
    `&nbsp;|&nbsp; ประกันสังคม: <span style="color:var(--danger,#e74c3c)">${fmtB(ssf)}</span>`;
}

// ─── ADD ───
function addEmployee() {
  const name   = document.getElementById('f-name').value.trim();
  const pos    = document.getElementById('f-pos').value.trim();
  const dept   = document.getElementById('f-dept').value;
  const salary = parseFloat(document.getElementById('f-salary').value) || 0;

  if (!name)   return alert('⚠️ กรุณากรอกชื่อพนักงาน');
  if (!pos)    return alert('⚠️ กรุณากรอกตำแหน่ง');
  if (!salary) return alert('⚠️ กรุณากรอกเงินเดือน');

  employees.push({ id: Date.now(), name, pos, dept, salary, paidMonths: [] });
  save();
  clearForm();
  updateStats();
  renderTable();
  showToast('✅ เพิ่มพนักงานสำเร็จ', 'ok');
}

function clearForm() {
  ['f-name', 'f-pos', 'f-salary'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-dept').value = 'mgmt';
  document.getElementById('net-preview').innerHTML = '';
}

// ─── TABLE ───
function renderTable() {
  const month = currentMonth();
  updateStats();

  const body = document.getElementById('payBody');

  if (!employees.length) {
    body.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:#888">📭 ยังไม่มีพนักงาน</td></tr>`;
    clearFooter();
    return;
  }

  let sSalary = 0, sSSF = 0, sNet = 0;

  body.innerHTML = employees.map((e, i) => {
    const ssf  = calcSSF(e.salary);
    const net  = calcNet(e.salary, ssf);
    const paid = (e.paidMonths || []).includes(month);
    const dept = DEPT_CFG[e.dept] || { label: e.dept, cls: '' };

    sSalary += e.salary;
    sSSF    += ssf;
    sNet    += net;

    return `<tr>
      <td>${i + 1}</td>
      <td><b>${e.name}</b></td>
      <td><span class="dept ${dept.cls}">${dept.label}</span></td>
      <td>${e.pos}</td>
      <td>${fmtB(e.salary)}</td>
      <td style="color:var(--danger,#e74c3c)">-${fmtB(ssf)}</td>
      <td style="font-weight:800">${fmtB(net)}</td>
      <td><span class="badge ${paid ? 'badge-paid' : 'badge-unpaid'}">${paid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}</span></td>
      <td><button class="btn btn-ghost btn-sm" onclick="openSlip(${i})">🧾</button></td>
      <td style="display:flex;gap:5px;align-items:center">
        ${!paid
          ? `<button class="btn btn-success btn-sm" onclick="payOne(${i})">จ่าย</button>`
          : `<button class="btn btn-ghost btn-sm"   onclick="unpayOne(${i})">ยกเลิก</button>`}
        <button class="btn btn-danger btn-sm" onclick="delEmployee(${i})">🗑</button>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('f-salary-sum').textContent = fmtB(sSalary);
  document.getElementById('f-ssf-sum').textContent    = '-' + fmtB(sSSF);
  document.getElementById('f-net-sum').textContent    = fmtB(sNet);
}

function clearFooter() {
  ['f-salary-sum', 'f-ssf-sum', 'f-net-sum']
    .forEach(id => document.getElementById(id).textContent = '—');
}

// ─── PAY ───
function payOne(i) {
  const month = currentMonth();
  if (!employees[i].paidMonths) employees[i].paidMonths = [];
  if (!employees[i].paidMonths.includes(month)) employees[i].paidMonths.push(month);
  save();
  renderTable();
  showToast('💸 จ่ายเงินเดือน ' + employees[i].name, 'ok');
}

function unpayOne(i) {
  const month = currentMonth();
  employees[i].paidMonths = (employees[i].paidMonths || []).filter(m => m !== month);
  save();
  renderTable();
  showToast('↩ ยกเลิกการจ่าย ' + employees[i].name, 'inf');
}

function payAll() {
  const month = currentMonth();
  employees.forEach(e => {
    if (!e.paidMonths) e.paidMonths = [];
    if (!e.paidMonths.includes(month)) e.paidMonths.push(month);
  });
  save();
  renderTable();
  showToast('✅ จ่ายเงินเดือนทุกคนแล้ว', 'ok');
}

// ─── DELETE ───
function delEmployee(i) {
  if (!confirm(`ลบ "${employees[i].name}" ออกจากระบบ?`)) return;
  employees.splice(i, 1);
  save();
  updateStats();
  renderTable();
  showToast('🗑 ลบแล้ว', 'inf');
}

function clearAll() {
  if (!confirm('ล้างข้อมูลพนักงานทั้งหมด?')) return;
  employees = [];
  save();
  updateStats();
  renderTable();
  showToast('ล้างข้อมูลแล้ว', 'inf');
}

// ─── SLIP ───
function openSlip(i) {
  const e     = employees[i];
  const month = currentMonth();
  const ssf   = calcSSF(e.salary);
  const net   = calcNet(e.salary, ssf);
  const paid  = (e.paidMonths || []).includes(month);
  const dept  = DEPT_CFG[e.dept] || { label: e.dept };
  const [y, m] = month.split('-');
  const thMonth = new Date(parseInt(y), parseInt(m) - 1)
    .toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  document.getElementById('slipContent').innerHTML = `
    <div class="slip" id="slipPrint">
      <div class="slip-title">
        ศูนย์รับซื้อน้ำนมดิบเกษตรกร<br>
        <small style="font-size:12px;font-weight:400;color:#888">สลิปเงินเดือน · ${thMonth}</small>
      </div>
      <div class="slip-section">ข้อมูลพนักงาน</div>
      <div class="slip-row"><span>ชื่อ</span><span><b>${e.name}</b></span></div>
      <div class="slip-row"><span>ตำแหน่ง</span><span>${e.pos}</span></div>
      <div class="slip-row"><span>ฝ่าย</span><span>${dept.label}</span></div>
      <div class="slip-section">รายได้</div>
      <div class="slip-row"><span>เงินเดือน</span><span>${fmtB(e.salary)}</span></div>
      <div class="slip-section">รายการหัก</div>
      <div class="slip-row deduct"><span>ประกันสังคม (5%, สูงสุด ฿750)</span><span>-${fmtB(ssf)}</span></div>
      <div class="slip-row total"><span>รับสุทธิ</span><span>${fmtB(net)}</span></div>
      <div style="text-align:center;margin-top:12px;font-size:11px;color:#888">
        สถานะ: ${paid ? '✅ จ่ายแล้ว' : '⏳ ยังไม่จ่าย'} · ${thMonth}
      </div>
    </div>`;

  document.getElementById('slipModal').classList.add('open');
}

function printSlip() {
  const content = document.getElementById('slipPrint').innerHTML;
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>สลิปเงินเดือน</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family:'Sarabun',sans-serif; padding:30px; max-width:420px; margin:0 auto }
      .slip-title  { text-align:center; font-size:16px; font-weight:700; margin-bottom:14px; line-height:1.6 }
      .slip-row    { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed #e2e8f0 }
      .slip-section{ font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#7f8c8d; padding:8px 0 2px }
      .total       { font-weight:800; font-size:15px; color:#27ae60; border-top:2px solid #d5eef5; padding-top:10px; margin-top:4px }
      .deduct      { color:#e74c3c }
    </style></head>
    <body>${content}</body></html>`);
  w.document.close();
  w.print();
}

function closeModal() { document.getElementById('slipModal').classList.remove('open'); }

document.getElementById('slipModal').addEventListener('click', e => {
  if (e.target === document.getElementById('slipModal')) closeModal();
});

// ─── TOAST ───
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.className = type;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── INIT ───
load();