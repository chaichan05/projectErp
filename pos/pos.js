const VAT_RATE = 0.07;
let subtotal = 0, vatAmount = 0, total = 0;

const PRODUCT_NAMES = {
    "25":  "นมดิบ",
    "45":  "นมพาสเจอร์ไรส์",
    "15":  "นมกล่อง",
    "350": "อาหารวัว"
};

const PRODUCT_UNITS = {
    "25":  "กิโลกรัม",
    "45":  "กิโลกรัม",
    "15":  "กล่อง",
    "350": "กระสอบ"
};

const DEFAULT_STOCK = {
    "25":  { name:"นมดิบ",          icon:"🥛", unit:"กก.",      qty:120000, max:120000 },
    "45":  { name:"นมพาสเจอร์ไรส์", icon:"🍼", unit:"กก.",      qty:20000,  max:20000  },
    "15":  { name:"นมกล่อง",        icon:"📦", unit:"กล่อง",    qty:40000,  max:40000  },
    "350": { name:"อาหารวัว",       icon:"🌾", unit:"กระสอบ",   qty:2227,   max:2227   },
};

function getStock() {
    let stock = JSON.parse(localStorage.getItem('milk_stock') || "{}");
    if (!Object.keys(stock).length) {
        stock = JSON.parse(JSON.stringify(DEFAULT_STOCK));
        localStorage.setItem('milk_stock', JSON.stringify(stock));
    }
    return stock;
}

function getStockQty(product) {
    return getStock()[product] || null;
}

function updateUnit() {
    const val = document.getElementById("product").value;
    const unit = PRODUCT_UNITS[val] || "กิโลกรัม";
    document.getElementById("qty-label").textContent = "จำนวน (" + unit + ") *";
    document.getElementById("kg").step = val === "350" ? "1" : "0.1";
    document.getElementById("kg").min  = val === "350" ? "1" : "0.1";
    checkStockHint();
    calculate();
}

function checkStockHint() {
    const product = document.getElementById("product").value;
    const kg      = Number(document.getElementById("kg").value);
    const hint    = document.getElementById("stock-hint");
    if (!hint) return;
    if (!product) { hint.textContent = ''; return; }
    const s = getStockQty(product);
    if (!s) { hint.textContent = ''; return; }
    const avail = Math.round(s.qty || 0);
    if (kg > 0 && kg > avail) {
        hint.innerHTML = `<span style="color:#e74c3c;font-weight:700">⚠️ เกินสต็อก! เหลือ ${avail.toLocaleString('th-TH')} ${s.unit}</span>`;
    } else if (avail === 0) {
        hint.innerHTML = `<span style="color:#e74c3c;font-weight:700">🔴 สต็อกหมด</span>`;
    } else {
        hint.innerHTML = `<span style="color:#27ae60">📦 สต็อกเหลือ ${avail.toLocaleString('th-TH')} ${s.unit}</span>`;
    }
}

// ─── CALCULATE ───
function calculate() {
    const priceIncVat = Number(document.getElementById("product").value);
    const kg          = Number(document.getElementById("kg").value);
    const money       = Number(document.getElementById("money").value);

    if (priceIncVat > 0 && kg > 0) {
        total     = priceIncVat * kg;
        subtotal  = Math.round(total / (1 + VAT_RATE));
        vatAmount = total - subtotal;

        document.getElementById("subtotalPrice").value = fmt(subtotal);
        document.getElementById("vatPrice").value      = fmt(vatAmount);
        document.getElementById("totalPrice").value    = fmt(total);

        document.getElementById("r-subtotal").textContent = fmt(subtotal);
        document.getElementById("r-vat").textContent      = fmt(vatAmount);
        document.getElementById("r-total").textContent    = fmt(total);

        if (money > 0) {
            const change = money - total;
            document.getElementById("r-money").textContent  = fmt(money);
            document.getElementById("r-change").textContent = change >= 0
                ? fmt(change)
                : `❌ ขาดอีก ${fmt(Math.abs(change))}`;
            document.getElementById("r-change").style.color = change >= 0 ? "var(--success)" : "var(--danger)";
        }
    } else {
        reset_receipt();
    }
    checkStockHint();
}

function fmt(n) {
    return Math.round(Number(n)).toLocaleString('th-TH') + " บาท";
}

function reset_receipt() {
    ["r-subtotal","r-vat","r-total","r-money","r-change"].forEach(id =>
        document.getElementById(id).textContent = "—");
    ["subtotalPrice","vatPrice","totalPrice"].forEach(id =>
        document.getElementById(id).value = "");
    subtotal = vatAmount = total = 0;
}

// ─── VALIDATE ───
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validatePhone(p) { return /^0\d{9}$/.test(p); }

// ─── CHECKOUT ───
function checkout() {
    const name    = document.getElementById("customerName").value.trim();
    const email   = document.getElementById("email").value.trim();
    const phone   = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const product = document.getElementById("product").value;
    const kg      = Number(document.getElementById("kg").value);
    const money   = Number(document.getElementById("money").value);

    if (!name || !email || !phone || !address) { return alert("⚠️ กรุณากรอกข้อมูลลูกค้าให้ครบ"); }
    if (!validateEmail(email))                  { return alert("⚠️ กรุณากรอกอีเมลให้ถูกต้อง"); }
    if (!validatePhone(phone))                  { return alert("⚠️ เบอร์โทรต้องเป็น 10 หลัก เริ่มต้นด้วย 0"); }
    if (!product)                               { return alert("⚠️ กรุณาเลือกประเภทสินค้า"); }
    if (!kg || kg <= 0)                         { return alert("⚠️ กรุณาระบุจำนวน"); }
    if (!money || money <= 0)                   { return alert("⚠️ กรุณากรอกจำนวนเงินที่รับมา"); }
    if (money < total)                          { return alert(`⚠️ เงินไม่พอ — ยอดรวม ${fmt(total)} แต่รับเงินมา ${fmt(money)}`); }

    let stock = getStock();
    const available = stock[product] ? (stock[product].qty || 0) : 0;
    const unit      = stock[product] ? stock[product].unit : 'หน่วย';
    if (kg > available) {
        return alert(`⚠️ สต็อกไม่พอ!\n\n${PRODUCT_NAMES[product]} เหลือ ${Math.round(available).toLocaleString('th-TH')} ${unit}\nแต่ต้องการ ${Math.round(kg).toLocaleString('th-TH')} ${unit}`);
    }

    const change = money - total;
    const now     = new Date();
    const date    = now.toLocaleString("th-TH");
    const isoDate = now.toISOString().split("T")[0];

    const sale = {
        date, name, email, phone, address,
        product, productName: PRODUCT_NAMES[product] || product, isoDate,
        kg, subtotal, vatAmount, total, money, change
    };

    const sales = JSON.parse(localStorage.getItem("sales") || "[]");
    sales.unshift(sale);
    localStorage.setItem("sales", JSON.stringify(sales));

    // หักสต็อก
    if (stock[product]) {
        stock[product].qty = Math.max(0, (stock[product].qty || 0) - kg);
    }
    localStorage.setItem('milk_stock', JSON.stringify(stock));

    showToast(`✅ บันทึกสำเร็จ — เงินทอน ${fmt(change)}`);
    renderHistory();
    clearForm();
}

// ─── CLEAR FORM ───
function clearForm() {
    ["customerName","email","phone","address","money","kg"].forEach(id =>
        document.getElementById(id).value = "");
    document.getElementById("product").value = "";
    const hint = document.getElementById("stock-hint");
    if (hint) hint.textContent = '';
    reset_receipt();
}

// ─── RENDER HISTORY ───
function renderHistory() {
    const sales = JSON.parse(localStorage.getItem("sales") || "[]");
    const body  = document.getElementById("historyBody");

    if (!sales.length) {
        body.innerHTML = `<tr><td colspan="11"><div class="empty-state"><div class="icon">📭</div>ยังไม่มีรายการขาย</div></td></tr>`;
        return;
    }

    const badges = { "25": "badge-raw", "45": "badge-past", "15": "badge-box", "350": "badge-feed" };

    body.innerHTML = sales.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${s.date}</td>
            <td>${s.name}</td>
            <td>${s.phone}</td>
            <td><span class="badge ${badges[s.product] || ''}">${s.productName}</span></td>
            <td>${Number(s.kg).toLocaleString('th-TH')} ${PRODUCT_UNITS[s.product] || 'กก.'}</td>
            <td>${Math.round(s.subtotal).toLocaleString('th-TH')}</td>
            <td>${Math.round(s.vatAmount).toLocaleString('th-TH')}</td>
            <td><strong>${Math.round(s.total).toLocaleString('th-TH')}</strong></td>
            <td>${Math.round(s.money).toLocaleString('th-TH')}</td>
            <td style="color:var(--success);font-weight:700">${Math.round(s.change).toLocaleString('th-TH')}</td>
        </tr>
    `).join('');
}

function clearHistory() {
    if (confirm("⚠️ ต้องการล้างประวัติการขายทั้งหมด?")) {
        localStorage.removeItem("sales");
        renderHistory();
    }
}

// ─── TOAST ───
function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

// ─── LISTENERS ───
document.getElementById("product").addEventListener("input", calculate);
document.getElementById("kg").addEventListener("input", () => { calculate(); checkStockHint(); });
document.getElementById("money").addEventListener("input", calculate);

// Init
renderHistory();