
// ── DATA ──────────────────────────────────────────
let DB = {
  wallets: [],
  transactions: [],
  categories: { income: [], expense: [] },
  settings: {}
};

const DEFAULT_CATS = {
  income: [
    { icon: '💰', name: 'เงินเดือน' }, { icon: '💼', name: 'ฟรีแลนซ์' },
    { icon: '📈', name: 'ลงทุน' }, { icon: '🎁', name: 'โบนัส' },
    { icon: '🏠', name: 'ค่าเช่า' }, { icon: '💳', name: 'โอนเงิน' },
    { icon: '🎯', name: 'รางวัล' }, { icon: '🌟', name: 'อื่นๆ' }
  ],
  expense: [
    { icon: '🍜', name: 'อาหาร' }, { icon: '🛒', name: 'ช้อปปิ้ง' },
    { icon: '🚗', name: 'เดินทาง' }, { icon: '🏥', name: 'สุขภาพ' },
    { icon: '⚡', name: 'ค่าไฟ' }, { icon: '💧', name: 'ค่าน้ำ' },
    { icon: '📱', name: 'โทรศัพท์' }, { icon: '🎮', name: 'บันเทิง' },
    { icon: '👔', name: 'เสื้อผ้า' }, { icon: '📚', name: 'การศึกษา' },
    { icon: '🏠', name: 'ที่พัก' }, { icon: '✈️', name: 'ท่องเที่ยว' },
    { icon: '☕', name: 'กาแฟ' }, { icon: '🐾', name: 'สัตว์เลี้ยง' },
    { icon: '💄', name: 'ความงาม' }, { icon: '🔧', name: 'ซ่อมแซม' }
  ]
};

const DEFAULT_WALLETS = [
  { id: 'w1', name: 'กระเป๋าหลัก', icon: '💵', balance: 0 },
  { id: 'w2', name: 'ธนาคาร', icon: '🏦', balance: 0 }
];

function loadDB() {
  const raw = localStorage.getItem('jodjod_v1');
  if (raw) {
    try { DB = JSON.parse(raw); } catch(e) {}
  } else {
    DB.wallets = JSON.parse(JSON.stringify(DEFAULT_WALLETS));
    DB.categories = JSON.parse(JSON.stringify(DEFAULT_CATS));
    DB.transactions = [];
    DB.settings = {};
    saveDB();
  }
  if (!DB.categories) DB.categories = JSON.parse(JSON.stringify(DEFAULT_CATS));
  if (!DB.settings) DB.settings = {};
}
function saveDB() { localStorage.setItem('jodjod_v1', JSON.stringify(DB)); }

// ── STATE ──────────────────────────────────────────
let calYear, calMonth;       // current calendar view
let selWalletId = 'all';     // 'all' or wallet id
let selectedDay = null;
let activeCatTab = 'expense';
let selectedCat = null;
let editTxId = null;
let txFilterWallet = 'all', txFilterMonth = 'all', txFilterType = 'all';

// ── INIT ──────────────────────────────────────────
loadDB();
const now = new Date();
calYear = now.getFullYear(); calMonth = now.getMonth();
renderAll();

function renderAll() {
  renderBalanceCard();
  renderCalendar();
  renderTransactionPage();
  renderAddPage();
  renderWalletsPage();
  updateTodayLabel();
}

// ── NAVIGATION ──────────────────────────────────────
function goPage(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'transactions') renderTransactionPage();
  if (name === 'wallets') renderWalletsPage();
  if (name === 'add') { resetAddForm(); renderAddPage(); }
}

// ── BALANCE CARD ──────────────────────────────────────
function renderBalanceCard() {
  const stats = calcStats(selWalletId, calYear, calMonth);

  const totalBal = selWalletId === "all"
    ? DB.wallets.reduce((sum, w) => sum + (w.balance || 0), 0)
    : (DB.wallets.find(w => w.id === selWalletId)?.balance || 0);

  document.getElementById("balance-card-wrap").innerHTML = `
    <div class="balance-card">

      <div class="balance-label">ยอดรวม</div>

      <div class="balance-amount ${totalBal < 0 ? "negative" : "positive"}">
        ${totalBal < 0 ? "-" : ""}${fmt(Math.abs(totalBal))} ฿
      </div>

      <div class="balance-row">

        <div class="balance-item">
          <div class="b-label">รายรับ</div>
          <div class="b-val income">
            +${fmt(stats.income)}
          </div>
        </div>

        <div class="balance-item">
          <div class="b-label">รายจ่าย</div>
          <div class="b-val expense">
            -${fmt(Math.abs(stats.expense))}
          </div>
        </div>

        <div class="balance-item">
          <div class="b-label">คงเหลือ</div>
          <div class="b-val ${stats.net < 0 ? "negative" : "positive"}">
            ${stats.net < 0 ? "-" : ""}${fmt(Math.abs(stats.net))}
          </div>
        </div>

      </div>

    </div>
  `;
}

function calcStats(walletId, y, m) {
  let txs = DB.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === y && d.getMonth() === m &&
      (walletId === 'all' || t.wallet === walletId);
  });
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, net: income - expense };
}

function fmt(n) {
  return Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── CALENDAR ──────────────────────────────────────
const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const DAYS_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];

function renderCalendar() {
  document.getElementById('cal-month-title').textContent = `${MONTHS_TH[calMonth]} ${calYear + 543}`;
  // label
  const wLabel = selWalletId === 'all' ? 'ทุกกระเป๋า' : (DB.wallets.find(w => w.id === selWalletId)?.name || '');
  document.getElementById('sel-wallet-label').textContent = wLabel;
  document.getElementById('sel-month-label').textContent = MONTHS_TH[calMonth];

  const dowRow = document.getElementById('cal-dow-row');
  dowRow.innerHTML = DAYS_TH.map(d => `<div class="cal-dow">${d}</div>`).join('');

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr = toDateStr(new Date());

  // build day totals
  const dayMap = {};
  DB.transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear() === calYear && d.getMonth() === calMonth &&
        (selWalletId === 'all' || t.wallet === selWalletId)) {
      const key = d.getDate();
      if (!dayMap[key]) dayMap[key] = { inc: 0, exp: 0 };
      if (t.type === 'income') dayMap[key].inc += t.amount;
      else dayMap[key].exp += t.amount;
    }
  });

  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = ds === todayStr;
    const isSel = selectedDay === ds;
    const dm = dayMap[d];
    html += `<div class="cal-day${isToday?' today':''}${isSel?' selected':''}" onclick="selectDay('${ds}')">
      <div class="day-num${isToday?' today-num':''}">${d}</div>
      ${dm && dm.inc > 0 ? `<div class="day-inc">+${fmtK(dm.inc)}</div>` : ''}
      ${dm && dm.exp > 0 ? `<div class="day-exp">-${fmtK(dm.exp)}</div>` : ''}
    </div>`;
  }
  document.getElementById('cal-days').innerHTML = html;
  if (selectedDay) renderDayDetail(selectedDay);
}

function fmtK(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(0) + 'K';
  return n.toLocaleString('th-TH', { maximumFractionDigits: 0 });
}

function selectDay(ds) {
  selectedDay = selectedDay === ds ? null : ds;
  renderCalendar();
  if (selectedDay) renderDayDetail(ds);
  else document.getElementById('day-detail').style.display = 'none';
}

function renderDayDetail(ds) {
  const txs = DB.transactions.filter(t => t.date === ds &&
    (selWalletId === 'all' || t.wallet === selWalletId))
    .sort((a, b) => b.time.localeCompare(a.time));
  const d = new Date(ds);
  document.getElementById('day-detail-title').textContent =
    `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear()+543}`;
  const dd = document.getElementById('day-detail');
  dd.style.display = 'block';
  if (txs.length === 0) {
    document.getElementById('day-tx-list').innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>ไม่มีรายการวันนี้</p></div>';
    return;
  }
  document.getElementById('day-tx-list').innerHTML = txs.map(t => txCardHTML(t)).join('');
}

function calPrev() { if (calMonth === 0) { calMonth = 11; calYear--; } else calMonth--; selectedDay = null; renderBalanceCard(); renderCalendar(); }
function calNext() { if (calMonth === 11) { calMonth = 0; calYear++; } else calMonth++; selectedDay = null; renderBalanceCard(); renderCalendar(); }

function updateTodayLabel() {
  const d = new Date();
  document.getElementById('cal-today-label').textContent =
    `${d.getDate()} ${MONTHS_TH[d.getMonth()]}\n${d.getFullYear()+543}`;
}

// ── TRANSACTIONS PAGE ──────────────────────────────────────
function renderTransactionPage() {
  // filters
  const filterDiv = document.getElementById('tx-filters');
  let chips = `<div class="filter-chip${txFilterType==='all'?' active':''}" onclick="setTxFilter('type','all')">ทั้งหมด</div>
    <div class="filter-chip${txFilterType==='income'?' active':''}" onclick="setTxFilter('type','income')">💰 รายรับ</div>
    <div class="filter-chip${txFilterType==='expense'?' active':''}" onclick="setTxFilter('type','expense')">💸 รายจ่าย</div>`;
  DB.wallets.forEach(w => {
    chips += `<div class="filter-chip${txFilterWallet===w.id?' active':''}" onclick="setTxFilter('wallet','${w.id}')">${w.icon} ${w.name}</div>`;
  });
  filterDiv.innerHTML = chips;
  filterTx();
}

function setTxFilter(key, val) {
  if (key === 'type') txFilterType = val;
  if (key === 'wallet') txFilterWallet = txFilterWallet === val ? 'all' : val;
  renderTransactionPage();
}

function filterTx() {
  const q = (document.getElementById('tx-search')?.value || '').toLowerCase();
  let txs = [...DB.transactions];
  if (txFilterType !== 'all') txs = txs.filter(t => t.type === txFilterType);
  if (txFilterWallet !== 'all') txs = txs.filter(t => t.wallet === txFilterWallet);
  if (q) txs = txs.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q) ||
    (t.note || '').toLowerCase().includes(q)
  );
  txs.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const list = document.getElementById('tx-list');
  if (txs.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>ไม่พบรายการ</p></div>';
    return;
  }
  // group by date
  const groups = {};
  txs.forEach(t => { if (!groups[t.date]) groups[t.date] = []; groups[t.date].push(t); });
  let html = '';
  Object.keys(groups).sort((a,b) => b.localeCompare(a)).forEach(dt => {
    const d = new Date(dt);
    html += `<div class="section-label" style="padding:0;margin:12px 0 8px">${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear()+543}</div>`;
    html += groups[dt].map(t => txCardHTML(t)).join('');
  });
  list.innerHTML = html;
}

function txCardHTML(t) {
  const w = DB.wallets.find(w => w.id === t.wallet);
  const wName = w ? `${w.icon} ${w.name}` : '—';
  return `<div class="tx-card" onclick="openTxDetail('${t.id}')">
    <div class="tx-icon-wrap ${t.type === 'income' ? 'income-bg' : 'expense-bg'}">${t.icon}</div>
    <div class="tx-info">
      <div class="tx-name">${t.name}${t.note ? ' · <span style="font-weight:400;color:var(--text3)">'+t.note+'</span>' : ''}</div>
      <div class="tx-cat">${t.category}</div>
      <div class="tx-wallet-line">${wName}</div>
      <div class="tx-datetime">${t.date} ${t.time}</div>
    </div>
    <div class="tx-amount-wrap">
      <div class="tx-amount ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)} ฿</div>
    </div>
  </div>`;
}

function openTxDetail(id) {
  const t = DB.transactions.find(x => x.id === id);
  if (!t) return;
  const w = DB.wallets.find(w => w.id === t.wallet);
  openModal(`
    <div class="modal-title">${t.icon} ${t.name}</div>
    <div class="card2" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="color:var(--text3);font-size:13px">จำนวนเงิน</span>
        <span class="${t.type}" style="font-size:20px;font-weight:800">${t.type==='income'?'+':'-'}${fmt(t.amount)} ฿</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="color:var(--text3);font-size:13px">หมวดหมู่</span>
        <span style="font-size:13px">${t.category}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="color:var(--text3);font-size:13px">กระเป๋า</span>
        <span style="font-size:13px">${w ? w.icon+' '+w.name : '—'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="color:var(--text3);font-size:13px">วันที่</span>
        <span style="font-size:13px">${t.date} ${t.time}</span>
      </div>
      ${t.note ? `<div style="display:flex;justify-content:space-between">
        <span style="color:var(--text3);font-size:13px">หมายเหตุ</span>
        <span style="font-size:13px">${t.note}</span>
      </div>` : ''}
    </div>
    <div class="modal-actions">
      <button class="modal-btn delete" onclick="deleteTx('${id}')">🗑️ ลบ</button>
      <button class="modal-btn edit" onclick="openEditTx('${id}')">✏️ แก้ไข</button>
    </div>
  `);
}

function deleteTx(id) {
  const t = DB.transactions.find(x => x.id === id);
  if (!t) return;
  // revert wallet balance
  const w = DB.wallets.find(w => w.id === t.wallet);
  if (w) {
    if (t.type === 'income') w.balance -= t.amount;
    else w.balance += t.amount;
  }
  DB.transactions = DB.transactions.filter(x => x.id !== id);
  saveDB(); closeModal(); renderAll();
  showToast('🗑️ ลบรายการแล้ว');
}

function openEditTx(id) {
  const t = DB.transactions.find(x => x.id === id);
  if (!t) return;
  editTxId = id;
  closeModal();
  goPage('add', document.querySelectorAll('.nav-btn')[2]);
  setTimeout(() => {
    selectedCat = { icon: t.icon, name: t.category, type: t.type };
    activeCatTab = t.type;
    renderAddPage();
    document.getElementById('add-wallet-sel').value = t.wallet;
    document.getElementById('add-amount').value = t.amount;
    document.getElementById('add-date').value = t.date;
    document.getElementById('add-time').value = t.time;
    document.getElementById('add-note').value = t.note || '';
    showMiniForm();
  }, 50);
}

// ── ADD PAGE ──────────────────────────────────────
function renderAddPage() {
  // wallet select
  const sel = document.getElementById('add-wallet-sel');
  const prev = sel.value;
  sel.innerHTML = '<option value="">เลือกกระเป๋า...</option>';
  DB.wallets.forEach(w => {
    sel.innerHTML += `<option value="${w.id}">${w.icon} ${w.name}</option>`;
  });
  if (prev) sel.value = prev;
  else if (DB.wallets.length > 0) sel.value = DB.wallets[0].id;

  // tabs
  document.getElementById('tab-expense').className = 'cat-tab expense' + (activeCatTab === 'expense' ? ' active' : '');
  document.getElementById('tab-income').className = 'cat-tab income' + (activeCatTab === 'income' ? ' active' : '');

  renderCatGrid();
}

function setCatTab(type) {
  activeCatTab = type;
  selectedCat = null;
  document.getElementById('mini-form').style.display = 'none';
  renderAddPage();
}

function filterCats() {
  renderCatGrid();
}

function renderCatGrid() {
  const q = (document.getElementById('cat-search-input')?.value || '').toLowerCase();
  const cats = DB.categories[activeCatTab] || [];
  const filtered = q ? cats.filter(c => c.name.toLowerCase().includes(q)) : cats;
  let html = filtered.map(c => `
    <div class="cat-item${selectedCat && selectedCat.name === c.name && selectedCat.type === activeCatTab ? ' selected' : ''}"
      onclick="selectCat('${encodeURIComponent(JSON.stringify({...c,type:activeCatTab}))}')">
      <div class="cat-emoji">${c.icon}</div>
      <div class="cat-name">${c.name}</div>
    </div>`).join('');
  html += `<div class="add-cat-btn" onclick="openAddCategory()">
    <div class="add-cat-circle">＋</div>
    <div class="cat-name">เพิ่ม</div>
  </div>`;
  document.getElementById('cat-grid').innerHTML = html;
}

function selectCat(encoded) {
  try { selectedCat = JSON.parse(decodeURIComponent(encoded)); } catch(e) { return; }
  renderCatGrid();
  showMiniForm();
}

function showMiniForm() {
  if (!selectedCat) return;
  const mf = document.getElementById('mini-form');
  mf.style.display = 'block';
  document.getElementById('mini-form-cat-icon').textContent = selectedCat.icon;
  document.getElementById('mini-form-cat-name').textContent = selectedCat.name;
  const badge = document.getElementById('mini-form-type-badge');
  badge.textContent = selectedCat.type === 'income' ? '💰 รายรับ' : '💸 รายจ่าย';
  badge.style.background = selectedCat.type === 'income' ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)';
  badge.style.color = selectedCat.type === 'income' ? 'var(--income)' : 'var(--expense)';

  if (!editTxId) {
    const n = new Date();
    document.getElementById('add-date').value = toDateStr(n);
    document.getElementById('add-time').value = toTimeStr(n);
  }
  document.getElementById('add-amount').focus();
  mf.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetAddForm() {
  editTxId = null;
  selectedCat = null;
  document.getElementById('mini-form').style.display = 'none';
  document.getElementById('add-amount').value = '';
  document.getElementById('add-note').value = '';
  document.getElementById('cat-search-input').value = '';
}

function saveTransaction() {
  if (!selectedCat) return;
  const walletId = document.getElementById('add-wallet-sel').value;
  const amountRaw = document.getElementById('add-amount').value;
  const date = document.getElementById('add-date').value;
  const time = document.getElementById('add-time').value;
  const note = document.getElementById('add-note').value.trim();

  if (!walletId) { showToast('⚠️ กรุณาเลือกกระเป๋าเงิน'); return; }
  if (!amountRaw || parseFloat(amountRaw) <= 0) { showToast('⚠️ กรุณาใส่จำนวนเงิน'); return; }

  const amount = parseFloat(parseFloat(amountRaw).toFixed(2));
  const w = DB.wallets.find(w => w.id === walletId);
  if (!w) return;

  if (editTxId) {
    // revert old
    const old = DB.transactions.find(x => x.id === editTxId);
    if (old) {
      const ow = DB.wallets.find(w => w.id === old.wallet);
      if (ow) { if (old.type === 'income') ow.balance -= old.amount; else ow.balance += old.amount; }
      DB.transactions = DB.transactions.filter(x => x.id !== editTxId);
    }
  }

  const tx = {
    id: editTxId || 'tx_' + Date.now(),
    icon: selectedCat.icon,
    name: selectedCat.name,
    category: selectedCat.name,
    type: selectedCat.type,
    amount, wallet: walletId, date, time, note
  };
  DB.transactions.push(tx);
  if (tx.type === 'income') w.balance += amount;
  else w.balance -= amount;

  saveDB();
  calYear = parseInt(date.split('-')[0]);
  calMonth = parseInt(date.split('-')[1]) - 1;
  renderAll();
  resetAddForm();
  editTxId = null;
  showToast(editTxId ? '✏️ แก้ไขแล้ว' : '✅ บันทึกแล้ว!');
  setTimeout(() => goPage('calendar', document.querySelectorAll('.nav-btn')[0]), 300);
}

function openAddCategory() {
  openModal(`
    <div class="modal-title">เพิ่มหมวดหมู่ใหม่</div>
    <div class="form-field">
      <div class="form-label">อีโมจิ</div>
      <input class="form-input" type="text" id="new-cat-icon" placeholder="เช่น 🛍️" maxlength="4" style="font-size:24px;text-align:center">
    </div>
    <div class="form-field">
      <div class="form-label">ชื่อหมวดหมู่</div>
      <input class="form-input" type="text" id="new-cat-name" placeholder="เช่น ของฝาก">
    </div>
    <div class="modal-actions">
      <button class="modal-btn secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="modal-btn primary" onclick="saveNewCat()">เพิ่ม</button>
    </div>
  `);
}

function saveNewCat() {
  const icon = document.getElementById('new-cat-icon').value.trim();
  const name = document.getElementById('new-cat-name').value.trim();
  if (!icon || !name) { showToast('⚠️ กรุณากรอกให้ครบ'); return; }
  if (!DB.categories[activeCatTab]) DB.categories[activeCatTab] = [];
  DB.categories[activeCatTab].push({ icon, name });
  saveDB(); closeModal(); renderCatGrid();
  showToast('✅ เพิ่มหมวดหมู่แล้ว');
}

// ── WALLETS PAGE ──────────────────────────────────────
function renderWalletsPage() {
  const list = document.getElementById('wallet-list');
  if (DB.wallets.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">💼</div><p>ยังไม่มีกระเป๋าเงิน</p></div>';
    return;
  }
  list.innerHTML = DB.wallets.map(w => {
    const stats = calcStats(w.id, now.getFullYear(), now.getMonth());
    return `<div class="wallet-card" onclick="openWalletDetail('${w.id}')">
      <div class="wallet-card-header">
        <div class="wallet-icon">${w.icon}</div>
        <div>
          <div class="wallet-name">${w.name}</div>
          <div class="wallet-bal">${fmt(w.balance || 0)} ฿</div>
        </div>
      </div>
      <div class="wallet-stats">
        <div class="wallet-stat"><div class="ws-label">รายรับ</div><div class="ws-val income">+${fmt(stats.income)}</div></div>
        <div class="wallet-stat"><div class="ws-label">รายจ่าย</div><div class="ws-val expense">-${fmt(stats.expense)}</div></div>
        <div class="wallet-stat"><div class="ws-label">คงเหลือ</div><div class="ws-val net">${fmt(stats.net)}</div></div>
      </div>
    </div>`;
  }).join('');
}

function openWalletDetail(id) {
  const w = DB.wallets.find(x => x.id === id);
  if (!w) return;
  const stats = calcStats(id, now.getFullYear(), now.getMonth());
  const txs = DB.transactions.filter(t => t.wallet === id).sort((a,b) => (b.date+b.time).localeCompare(a.date+a.time)).slice(0, 5);
  const barData = last6Months().map(({y,m,label}) => {
    const s = calcStats(id, y, m);
    return { label, inc: s.income, exp: s.expense };
  });
  const maxVal = Math.max(...barData.map(b => Math.max(b.inc, b.exp)), 1);
  const bars = barData.map(b => `
    <div class="bar-wrap">
      <div style="display:flex;gap:2px;align-items:flex-end;height:60px">
        <div class="bar inc" style="flex:1;height:${Math.round(b.inc/maxVal*56)+4}px"></div>
        <div class="bar exp" style="flex:1;height:${Math.round(b.exp/maxVal*56)+4}px"></div>
      </div>
      <div class="bar-label">${b.label}</div>
    </div>`).join('');

  openModal(`
    <div class="modal-title">${w.icon} ${w.name}</div>
    <div class="card2" style="margin-bottom:12px">
      <div style="color:var(--text3);font-size:12px">ยอดคงเหลือ</div>
      <div style="font-size:28px;font-weight:800;color:var(--accent2)">${fmt(w.balance||0)} ฿</div>
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:6px">6 เดือนล่าสุด</div>
    <div class="bar-chart">${bars}</div>
    <div style="display:flex;gap:12px;margin:8px 0 16px;font-size:11px">
      <span style="color:var(--income)">■ รายรับ</span>
      <span style="color:var(--expense)">■ รายจ่าย</span>
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:8px">รายการล่าสุด</div>
    ${txs.length ? txs.map(t => txCardHTML(t)).join('') : '<div style="color:var(--text3);font-size:13px;text-align:center;padding:16px">ยังไม่มีรายการ</div>'}
    <div class="modal-actions" style="margin-top:16px">
      <button class="modal-btn delete" onclick="deleteWallet('${id}')">🗑️ ลบ</button>
      <button class="modal-btn edit" onclick="openEditWallet('${id}')">✏️ แก้ไข</button>
    </div>
  `);
}

function last6Months() {
  const result = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    result.push({ y: dt.getFullYear(), m: dt.getMonth(), label: MONTHS_TH[dt.getMonth()].slice(0,3) });
  }
  return result;
}

function deleteWallet(id) {
  if (DB.wallets.length <= 1) { showToast('⚠️ ต้องมีอย่างน้อย 1 กระเป๋า'); return; }
  DB.wallets = DB.wallets.filter(w => w.id !== id);
  DB.transactions = DB.transactions.filter(t => t.wallet !== id);
  saveDB(); closeModal(); renderAll();
  showToast('🗑️ ลบกระเป๋าแล้ว');
}

function openEditWallet(id) {
  const w = DB.wallets.find(x => x.id === id);
  if (!w) return;
  closeModal();
  openModal(`
    <div class="modal-title">แก้ไขกระเป๋า</div>
    <div class="form-field">
      <div class="form-label">ไอคอน</div>
      <input class="form-input" type="text" id="ew-icon" value="${w.icon}" maxlength="4" style="font-size:24px;text-align:center">
    </div>
    <div class="form-field">
      <div class="form-label">ชื่อกระเป๋า</div>
      <input class="form-input" type="text" id="ew-name" value="${w.name}">
    </div>
    <div class="form-field">
      <div class="form-label">ยอดคงเหลือเริ่มต้น</div>
      <input class="form-input" type="number" id="ew-bal" value="${w.balance||0}" inputmode="decimal">
    </div>
    <div class="modal-actions">
      <button class="modal-btn secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="modal-btn primary" onclick="saveEditWallet('${id}')">บันทึก</button>
    </div>
  `);
}

function saveEditWallet(id) {
  const w = DB.wallets.find(x => x.id === id);
  if (!w) return;
  w.icon = document.getElementById('ew-icon').value.trim() || w.icon;
  w.name = document.getElementById('ew-name').value.trim() || w.name;
  w.balance = parseFloat(document.getElementById('ew-bal').value) || 0;
  saveDB(); closeModal(); renderAll();
  showToast('✅ แก้ไขแล้ว');
}

function openAddWallet() {
  openModal(`
    <div class="modal-title">เพิ่มกระเป๋าใหม่</div>
    <div class="form-field">
      <div class="form-label">ไอคอน</div>
      <input class="form-input" type="text" id="nw-icon" placeholder="💵" maxlength="4" style="font-size:24px;text-align:center">
    </div>
    <div class="form-field">
      <div class="form-label">ชื่อกระเป๋า</div>
      <input class="form-input" type="text" id="nw-name" placeholder="เช่น กระเป๋าหลัก">
    </div>
    <div class="form-field">
      <div class="form-label">ยอดเริ่มต้น (บาท)</div>
      <input class="form-input" type="number" id="nw-bal" placeholder="0" inputmode="decimal">
    </div>
    <div class="modal-actions">
      <button class="modal-btn secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="modal-btn primary" onclick="saveNewWallet()">เพิ่ม</button>
    </div>
  `);
}

function saveNewWallet() {
  const icon = document.getElementById('nw-icon').value.trim() || '💵';
  const name = document.getElementById('nw-name').value.trim();
  const balance = parseFloat(document.getElementById('nw-bal').value) || 0;
  if (!name) { showToast('⚠️ กรุณาใส่ชื่อกระเป๋า'); return; }
  DB.wallets.push({ id: 'w_'+Date.now(), name, icon, balance });
  saveDB(); closeModal(); renderAll();
  showToast('✅ เพิ่มกระเป๋าแล้ว');
}

// ── MONTH / WALLET PICKERS ──────────────────────────────────────
function openMonthPicker() {
  const months = MONTHS_TH.map((m, i) => `
    <div style="padding:12px;border-radius:10px;cursor:pointer;font-size:15px;
      background:${calMonth===i ? 'rgba(59,130,246,.2)' : 'transparent'};
      color:${calMonth===i ? 'var(--accent2)' : 'var(--text)'};font-weight:${calMonth===i?700:400}"
      onclick="pickMonth(${i})">${m}</div>`).join('');
  openModal(`<div class="modal-title">เลือกเดือน</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">${months}</div>`);
}

function pickMonth(m) {
  calMonth = m; selectedDay = null;
  closeModal(); renderBalanceCard(); renderCalendar();
}

function openWalletPicker(ctx) {
  let opts = `<div style="padding:12px;border-radius:10px;cursor:pointer;font-size:15px;
    background:${selWalletId==='all'?'rgba(59,130,246,.2)':'transparent'};color:${selWalletId==='all'?'var(--accent2)':'var(--text)'};font-weight:${selWalletId==='all'?700:400}"
    onclick="pickWallet('all')">🌐 ทุกกระเป๋า</div>`;
  DB.wallets.forEach(w => {
    opts += `<div style="padding:12px;border-radius:10px;cursor:pointer;font-size:15px;
      background:${selWalletId===w.id?'rgba(59,130,246,.2)':'transparent'};color:${selWalletId===w.id?'var(--accent2)':'var(--text)'};font-weight:${selWalletId===w.id?700:400}"
      onclick="pickWallet('${w.id}')">${w.icon} ${w.name}</div>`;
  });
  openModal(`<div class="modal-title">เลือกกระเป๋า</div>${opts}`);
}

function pickWallet(id) {
  selWalletId = id; selectedDay = null;
  closeModal(); renderBalanceCard(); renderCalendar();
}

// ── SETTINGS ──────────────────────────────────────
function exportData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jodjod-backup-' + toDateStr(new Date()) + '.json';  a.click();
  showToast('📤 ส่งออกข้อมูลแล้ว');
}

function importData() {
  document.getElementById('import-file').click();
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.wallets || !data.transactions) { showToast('⚠️ ไฟล์ไม่ถูกต้อง'); return; }
      DB = data;
      saveDB(); renderAll();
      showToast('📥 นำเข้าข้อมูลแล้ว');
    } catch(err) { showToast('⚠️ ไม่สามารถอ่านไฟล์ได้'); }
    e.target.value = '';
  };
  reader.readAsText(file);
}

function resetData() {
  openModal(`
    <div class="modal-title" style="color:var(--expense)">⚠️ ล้างข้อมูลทั้งหมด</div>
    <div style="color:var(--text2);font-size:14px;margin-bottom:20px">ข้อมูลทั้งหมดจะถูกลบอย่างถาวร ไม่สามารถกู้คืนได้</div>
    <div class="modal-actions">
      <button class="modal-btn secondary" onclick="closeModal()">ยกเลิก</button>
      <button class="modal-btn delete" onclick="confirmReset()">ล้างข้อมูล</button>
    </div>
  `);
}

function confirmReset() {
  localStorage.removeItem('jodjod_v1');
  closeModal();
  loadDB(); renderAll();
  showToast('🗑️ ล้างข้อมูลแล้ว');
}

// ── MODAL ──────────────────────────────────────────
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── TOAST ──────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ── UTILS ──────────────────────────────────────────
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function toTimeStr(d) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function updateAddForm() {}