const STOCK_KEY = 'milk_stock';

const DEFAULT_STOCK = {
  "25":  { name:'นมดิบ',          icon:'🥛', unit:'กก.',      qty:120000, max:120000 },
  "45":  { name:'นมพาสเจอร์ไรส์', icon:'🍼', unit:'กก.',      qty:20000,  max:20000  },
  "15":  { name:'นมกล่อง',        icon:'📦', unit:'กล่อง',    qty:40000,  max:40000  },
  "350": { name:'อาหารวัว',       icon:'🌾', unit:'กระสอบ',   qty:2227,   max:2227   },
};

function getStock() {
  try {
    const s = JSON.parse(localStorage.getItem(STOCK_KEY) || '{}');
    return Object.keys(s).length ? s : JSON.parse(JSON.stringify(DEFAULT_STOCK));
  } catch { return JSON.parse(JSON.stringify(DEFAULT_STOCK)); }
}

function saveStock(s) { localStorage.setItem(STOCK_KEY, JSON.stringify(s)); }

function fmt(n) { return Math.round(n).toLocaleString('th-TH'); }

function renderStock() {
  const stock = getStock();
  const el = document.getElementById('stockList');
  el.innerHTML = Object.entries(stock).map(([key, item]) => {
    const pct  = Math.min(100, Math.round((item.qty / (item.max || 1)) * 100));
    const cls  = pct > 40 ? 'bar-ok'   : pct > 15 ? 'bar-warn'   : 'bar-low';
    const bcls = pct > 40 ? 'badge-ok' : pct > 15 ? 'badge-warn' : 'badge-low';
    const blbl = pct > 40 ? '✅ ปกติ'  : pct > 15 ? '⚠️ เตือน'  : '🔴 ต่ำ';
    return `
      <div class="stock-item">
        <div class="stock-top">
          <div class="stock-name">${item.icon} ${item.name}</div>
          <div style="display:flex;align-items:center;gap:7px">
            <span class="stock-qty">${fmt(item.qty)} ${item.unit}</span>
            <span class="badge ${bcls}">${blbl}</span>
          </div>
        </div>
        <div class="stock-bar-bg">
          <div class="stock-bar-fill ${cls}" style="width:${pct}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
          <div class="stock-meta">เหลือ ${pct}% จากสต็อกเริ่มต้น ${fmt(item.max)} ${item.unit}</div>
          <div class="stock-input-row">
            <input type="number" id="add-${key}" placeholder="จำนวนที่เติม" min="1" style="width:130px">
            <button class="btn-add" onclick="addStock('${key}')">+ เติม</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function addStock(key) {
  const inp = document.getElementById('add-' + key);
  const qty = parseInt(inp.value) || 0;
  if (qty <= 0) return showToast('⚠️ กรุณากรอกจำนวนที่ต้องการเติม');
  const stock = getStock();
  if (stock[key]) {
    stock[key].qty = (stock[key].qty || 0) + qty;
    stock[key].max = Math.max(stock[key].max || 0, stock[key].qty);
  }
  saveStock(stock);
  inp.value = '';
  renderStock();
  showToast(`✅ เติม ${stock[key].name} เพิ่ม ${fmt(qty)} ${stock[key].unit} แล้ว`);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Init
document.getElementById('heroDate').textContent =
  new Date().toLocaleDateString('th-TH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

renderStock();