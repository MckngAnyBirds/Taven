/* ===== Data ===== */
const MENU = {
  Appetizers: [['Cheesy Fries', 89], ['Wedges', 99], ['Caesar Salad', 119], ['Nachos', 139], ['Wings', 149],
    ['Onion Rings', 99], ['Chicken Fingers', 139], ['Mashed Potatoes', 89], ['Kwek Kwek', 69]],
  Meals: [['Creamy Carbonara', 189], ['Hungsilog', 129], ['Tapsilog', 139], ['Longsilog', 139], ['Tocilog', 139],
    ['Bacsilog', 149], ['Adobo', 159], ['Pork Sisig', 169], ['Chicken Pastil', 129], ['Fried Chicken', 159]],
  Drinks: [['Iced Tea', 49], ['Gulaman', 49], ['Four Seasons', 59], ['Buko Juice', 59], ['Canned Softdrinks', 49], ['Iced Coffee', 89]],
  Desserts: [['Leche Flan', 79], ['Turon', 69], ['Halo-halo', 99], ['Cheesecake', 139], ['Mango Graham', 99]],
};

const MEMBERS = [
  { id: 1, file: 'Ramit.HTML', name: 'Adrienne Dave O. Ramit', cardName: 'Adrienne Dave O. Ramit', cardImg: 'adrienne.png', img: 'adrienne.png', role: 'Member',
    details: [['Program', 'Bachelor of Science in Information Technology (BSIT)'], ['Contact Number', '09948627603'],
      ['Program of Interest', 'Information Technology, Pursuing Cyber Security']] },

  { id: 2, file: 'Fajardo.HTML', name: 'Johann Daniel S. Fajardo', cardName: 'Johann Daniel S. Fajardo', cardImg: 'johann.jpg', img: 'johann.png', role: 'Member',
    details: [['Birthday', 'October 20, 2006'], ['Age', '19'], ['Contact Number', '09993921456'], ['Student Number', '2516392'],
      ['Email Address', 'qjdfajardo25@tip.edu.ph']] },

  { id: 3, file: 'Marañon.HTML', name: 'Leirsiar D. Marañon', cardName: 'Leirsiar D. Marañon', cardImg: 'lei.png', img: 'lei.png', role: 'Leader',
    details: [['Age', '18'], ['Birthday', 'May 2, 2008'], ['Cellphone Number', '09352101962'], ['Email Address', 'qlgmaranon@tip.edu.ph ']] },

  { id: 4, file: 'Bonina.HTML', name: 'Mark Kristian C. Bonina', cardName: 'Mark Kristian C. Bonina', cardImg: 'mark.png', img: 'mark.png', role: 'Member',
    details: [['School', 'Technological Institute of the Philippines'], ['Education', 'Bachelor of Science in Information Technology'],
      ['Contact information', 'qmkbonina@tip.edu.ph'], ['Contact number', '09163449005'], ['Hobbies', 'Playing video games, Programming, plane spotting.']] },

  { id: 5, file: 'Vista.HTML', name: 'Miguelito Lawrence B. Vista', cardName: 'Miguelito Lawrence B. Vista', cardImg: 'migs.png', img: 'migs.png', role: 'Member',
    details: [['Birthday', 'May 05, 2006'], ['Age', '19 years old'], ['ID Number', '2513359']] },
];
const memberHref = m => encodeURI(m.file);
const MEMBER_FILES = MEMBERS.map(m => m.file.toLowerCase());

/* ===== Helpers ===== */
const $ = (s, r = document) => r.querySelector(s);
const money = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const imgSrc = name => `images/${name.replace(/\s+/g, '')}.png`;
const FALLBACK = 'data:image/svg+xml,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#f4dde8'/><text x='50%' y='58%' font-size='80' text-anchor='middle'>🍽️</text></svg>");
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (src, alt, cls = '') => `<img src="${src}" alt="${alt}" class="${cls}" loading="lazy" onerror="this.onerror=null;this.src=FALLBACK">`;


/* ===== Inventory (stock-in, stock-out, available stock) ===== */
const DEFAULT_STOCK = { Appetizers: 30, Meals: 25, Drinks: 50, Desserts: 20 };
const CAT_DESC = { Appetizers: 'A shareable starter, served hot.', Meals: 'A filling plate, cooked fresh to order.', Drinks: 'Served cold.', Desserts: 'A sweet finish to your meal.' };
const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const ALL_ITEMS = Object.entries(MENU).flatMap(([cat, items]) => items.map(([n, p]) => ({ name: n, price: p, cat })));
function getInv() {
  const inv = readJSON('inventory', {});
  let changed = false;
  ALL_ITEMS.forEach(i => { if (typeof inv[i.name] !== 'number') { inv[i.name] = DEFAULT_STOCK[i.cat]; changed = true; } });
  if (changed) localStorage.setItem('inventory', JSON.stringify(inv));
  return inv;
}
const stockOf = n => getInv()[n] ?? 0;
function moveStock(item, type, qty, ref = '') {
  // type: IN (stock-in), OUT (manual stock-out), SOLD (auto deduction), RESTORE (cancelled order)
  const inv = getInv();
  const delta = (type === 'IN' || type === 'RESTORE') ? qty : -qty;
  inv[item] = Math.max(0, inv[item] + delta);
  localStorage.setItem('inventory', JSON.stringify(inv));
  const log = readJSON('stockmoves', []);
  log.unshift({ time: new Date().toLocaleString('en-PH'), item, type, qty, ref, left: inv[item] });
  localStorage.setItem('stockmoves', JSON.stringify(log.slice(0, 200)));
}
const stockLabel = n => { const s = stockOf(n); return s === 0 ? ['Sold out', 'out'] : s <= 5 ? [`Only ${s} left`, 'low'] : [`${s} available`, '']; };

/* ===== Orders (reference no. + status) ===== */
const STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Completed', 'Cancelled'];
const getOrders = () => readJSON('orders', []);
const saveOrders = o => localStorage.setItem('orders', JSON.stringify(o));
function newRef() {
  const used = new Set(getOrders().map(o => o.no));
  let r;
  do { r = 'TV-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10); } while (used.has(r));
  return r;
}
function setStatus(no, status) {
  const orders = getOrders(), o = orders.find(x => x.no === no);
  if (!o || o.status === 'Cancelled' || o.status === status) return false;
  if (status === 'Cancelled') o.items.forEach(i => moveStock(i.name, 'RESTORE', i.quantity, no)); // stock goes back
  o.status = status;
  o.history.push({ status, time: new Date().toLocaleString('en-PH') });
  saveOrders(orders);
  return true;
}
const statusBadge = s => `<span class="status-badge st-${s}">${s}</span>`;

/* ===== Cart ===== */
function getCart() { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } }
function saveCart(c) { localStorage.setItem('cart', JSON.stringify(c)); updateBadge(); }
function updateBadge() {
  const n = getCart().reduce((s, i) => s + i.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(e => { e.textContent = n; });
}
function addToCart(name, price) {
  const cart = getCart();
  const found = cart.find(i => i.name === name);
  if ((found ? found.quantity : 0) + 1 > stockOf(name)) { toast(`Sorry, only ${stockOf(name)} ${name} available`); return; }
  found ? found.quantity++ : cart.push({ name, price, quantity: 1 });
  saveCart(cart);
  toast(`${name} added to cart`);
}
function toast(msg) {
  let box = $('#toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-box';
    box.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'toast toast-brand border-0';
  t.setAttribute('role', 'status');
  t.innerHTML = `<div class="d-flex"><div class="toast-body">🛒 ${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  box.appendChild(t);
  t.addEventListener('hidden.bs.toast', () => t.remove());
  new bootstrap.Toast(t, { delay: 1800 }).show();
}

/* ===== Layout (sticky navbar + footer) ===== */
function layout() {
  const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
  const group = (page === 'developers.html' || MEMBER_FILES.includes(page.toLowerCase())) ? 'aboutus.html' : (page === 'thankyou.html' ? 'summary.html' : page);
  const links = [['index.html', 'Home'], ['order.html', 'Menu'], ['aboutus.html', 'About Us'], ['track.html', 'Track Order'], ['summary.html', 'Cart'], ['admin.html', 'Staff']];
  const nav = $('#site-nav');
  if (nav) nav.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-taven">
      <div class="container">
        <a class="navbar-brand" href="index.html"><span class="brand-dot">T</span>Taven</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav ms-auto gap-lg-1 align-items-lg-center">
            ${links.map(([href, label]) => `<li class="nav-item"><a class="nav-link ${href === group ? 'active' : ''} ${href === 'admin.html' ? 'nav-staff ms-lg-2' : ''}" href="${href}">${href === 'summary.html' ? '🛒 ' : ''}${label}${href === 'summary.html' ? ' <span class="badge rounded-pill cart-count">0</span>' : ''}</a></li>`).join('')}
          </ul>
        </div>
      </div>
    </nav>`;
  const foot = $('#site-footer');
  if (foot) foot.innerHTML = `<footer class="site-footer"><p class="mb-0">© 2025 TAVEN Foods &amp; Drinks. All rights reserved.</p></footer>`;
}

/* ===== Home ===== */
function initHome() {
  const root = $('#popular');
  if (!root) return;
  root.innerHTML = ['Creamy Carbonara', 'Tapsilog', 'Fried Chicken', 'Halo-halo'].map(n => {
    const it = ALL_ITEMS.find(x => x.name === n);
    return `<div class="col-6 col-lg-3"><div class="menu-card"><a href="order.html">${img(imgSrc(n), n)}</a><div class="p-3"><h3 class="h6 mb-1">${n}</h3><div class="price">${money(it.price)}</div><div class="stock-tag ${stockLabel(n)[1]}">${stockLabel(n)[0]}</div></div></div></div>`;
  }).join('');
}

/* ===== Menu: browse → view details → add to cart ===== */
function initMenu() {
  const root = $('#menu-root');
  if (!root) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal fade" id="itemModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content">
      <div class="modal-header border-0"><h2 class="modal-title h4 text-brand" id="im-name" style="color:var(--brand)"></h2><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button></div>
      <div class="modal-body pt-0"><div id="im-img" class="mb-3"></div><p id="im-desc" class="text-muted"></p><div class="d-flex justify-content-between align-items-center"><span class="price fs-4" id="im-price"></span><span class="stock-tag" id="im-stock"></span></div></div>
      <div class="modal-footer border-0"><button class="btn btn-brand px-4" id="im-add">Add to cart</button></div></div></div></div>`);
  const modal = new bootstrap.Modal($('#itemModal'));
  let current = null;
  const refreshBtn = () => { const b = $('#im-add'); b.disabled = stockOf(current.name) === 0; b.textContent = b.disabled ? 'Sold out' : 'Add to cart'; };
  const draw = (q = '') => {
    const html = Object.entries(MENU).map(([cat, items]) => {
      const list = items.filter(([n]) => n.toLowerCase().includes(q));
      if (!list.length) return '';
      return `<section id="${cat.toLowerCase()}" class="scroll-target mb-5"><h2 class="section-title h3">${cat}</h2><div class="row g-4">
        ${list.map(([n, p]) => { const [lab, cls] = stockLabel(n); return `<div class="col-6 col-md-4 col-lg-3"><div class="menu-card d-flex flex-column ${cls === 'out' ? 'soldout' : ''}"><div data-view="${n}">${img(imgSrc(n), n)}</div>
          <div class="p-3 d-flex flex-column flex-grow-1"><h3 class="h6 mb-1">${n}</h3><div class="price">${money(p)}</div><div class="stock-tag ${cls} mb-1">${lab}</div>
          <button class="link-details mb-3" data-view="${n}">View details</button>
          <button class="btn btn-brand btn-sm mt-auto" data-add="${n}" data-price="${p}" ${cls === 'out' ? 'disabled' : ''}>${cls === 'out' ? 'Sold out' : 'Add to cart'}</button></div></div></div>`; }).join('')}
      </div></section>`;
    }).join('');
    root.innerHTML = html || '<p class="text-center text-muted py-5">No dishes match your search. Try another name.</p>';
  };
  draw();
  root.addEventListener('click', e => {
    const v = e.target.closest('[data-view]');
    if (v) {
      current = ALL_ITEMS.find(x => x.name === v.dataset.view);
      $('#im-name').textContent = current.name;
      $('#im-img').innerHTML = img(imgSrc(current.name), current.name, 'img-fluid rounded-3 w-100').replace('class="', 'style="max-height:260px;object-fit:cover" class="');
      $('#im-desc').textContent = `${current.cat.slice(0, -1) === 'Appetizer' ? 'Appetizer' : current.cat === 'Meals' ? 'Meal' : current.cat.slice(0, -1)}. ${CAT_DESC[current.cat]}`;
      $('#im-price').textContent = money(current.price);
      const [lab, cls] = stockLabel(current.name);
      $('#im-stock').textContent = lab; $('#im-stock').className = 'stock-tag ' + cls;
      refreshBtn(); modal.show(); return;
    }
    const b = e.target.closest('[data-add]');
    if (b) { addToCart(b.dataset.add, Number(b.dataset.price)); }
  });
  $('#im-add').addEventListener('click', () => { addToCart(current.name, current.price); modal.hide(); });
  $('#menu-search').addEventListener('input', e => draw(e.target.value.trim().toLowerCase()));
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.go);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }));
}

/* ===== Summary / checkout / payment (payment is SIMULATED; delivery is RECORDED only) ===== */
function initSummary() {
  const list = $('#cart-items');
  if (!list) return;
  const discSel = $('#discount-type'), custom = $('#custom-discount'), pay = $('#payment'), form = $('#checkout-form');
  const typeSel = $('#order-type'), methodSel = $('#pay-method');

  const calc = () => {
    const cart = getCart();
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let pct = discSel.value === 'custom' ? Number(custom.value) || 0 : Number(discSel.value);
    pct = Math.min(Math.max(pct, 0), 100);
    const discount = subtotal * pct / 100, total = subtotal - discount;
    const cash = methodSel.value === 'Cash';
    const payment = cash ? Number(pay.value) || 0 : total;
    $('#subtotal').textContent = money(subtotal);
    $('#discount').textContent = '-' + money(discount);
    $('#total').textContent = money(total);
    $('#change').textContent = cash ? (payment >= total && total > 0 ? money(payment - total) : '—') : '₱0.00';
    return { cart, subtotal, discount, total, payment, pct, cash };
  };
  const toggles = () => {
    $('#cash-box').classList.toggle('d-none', methodSel.value !== 'Cash');
    $('#addr-box').classList.toggle('d-none', typeSel.value !== 'Delivery');
    calc();
  };

  const render = () => {
    const cart = getCart();
    $('#cart-empty').classList.toggle('d-none', cart.length > 0);
    $('#cart-panel').classList.toggle('d-none', cart.length === 0);
    list.innerHTML = cart.map((it, i) => `
      <div class="cart-row d-flex align-items-center gap-3 p-3 mb-3">
        ${img(imgSrc(it.name), it.name, 'rounded-3').replace('class="', 'style="width:64px;height:64px;object-fit:cover" class="')}
        <div class="flex-grow-1"><div class="fw-semibold">${it.name}</div><div class="text-muted small">${money(it.price)} each · ${stockOf(it.name)} in stock</div></div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-brand qty-btn" data-act="dec" data-i="${i}" aria-label="Decrease ${it.name}">−</button>
          <span class="fw-semibold" style="min-width:1.5rem;text-align:center">${it.quantity}</span>
          <button class="btn btn-outline-brand qty-btn" data-act="inc" data-i="${i}" aria-label="Increase ${it.name}">+</button>
        </div>
        <div class="fw-bold price text-end" style="min-width:90px">${money(it.price * it.quantity)}</div>
        <button class="btn btn-sm btn-outline-danger" data-act="del" data-i="${i}" aria-label="Remove ${it.name}">✕</button>
      </div>`).join('');
    calc();
  };

  list.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const cart = getCart(), i = Number(b.dataset.i);
    if (b.dataset.act === 'inc') { if (cart[i].quantity + 1 > stockOf(cart[i].name)) { toast(`Only ${stockOf(cart[i].name)} ${cart[i].name} in stock`); return; } cart[i].quantity++; }
    if (b.dataset.act === 'dec') cart[i].quantity = Math.max(1, cart[i].quantity - 1);
    if (b.dataset.act === 'del') cart.splice(i, 1);
    saveCart(cart);
    render();
  });
  $('#clear-cart').addEventListener('click', () => { saveCart([]); render(); });
  discSel.addEventListener('change', () => { custom.classList.toggle('d-none', discSel.value !== 'custom'); calc(); });
  [custom, pay].forEach(el => el.addEventListener('input', calc));
  [typeSel, methodSel].forEach(el => el.addEventListener('change', toggles));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const { cart, subtotal, discount, total, payment, pct, cash } = calc();
    const err = $('#checkout-error');
    const fail = m => { err.textContent = m; err.classList.remove('d-none'); };
    const name = $('#customer-name').value.trim();
    if (!cart.length) return fail('Your cart is empty. Add something from the menu first.');
    if (!name) return fail('Please enter your name.');
    const type = typeSel.value, phone = $('#customer-phone').value.trim(), address = $('#customer-address').value.trim();
    if (type === 'Delivery' && (!phone || !address)) return fail('Delivery needs a contact number and an address.');
    const short = cart.find(i => i.quantity > stockOf(i.name));
    if (short) return fail(`Not enough stock for ${short.name} (${stockOf(short.name)} left). Please update your cart.`);
    if (cash && payment < total) return fail(`Payment is short. Enter at least ${money(total)}.`);
    err.classList.add('d-none');
    const no = newRef(), now = new Date().toLocaleString('en-PH');
    cart.forEach(i => moveStock(i.name, 'SOLD', i.quantity, no)); // automatic stock deduction
    const order = { no, name, phone, type, address, method: methodSel.value, paymentStatus: 'Paid (simulated)', date: now,
      items: cart, subtotal, discount, pct, total, payment, change: payment - total, status: 'Pending', history: [{ status: 'Pending', time: now }] };
    saveOrders([order, ...getOrders()]);
    localStorage.setItem('lastOrder', no);
    localStorage.removeItem('cart');
    location.href = 'thankyou.html';
  });
  toggles(); render();
}

/* ===== Receipt (shared by thank-you + track pages) ===== */
function receiptHTML(o) {
  return `
    <div class="d-flex justify-content-between small text-muted mb-1"><span>Reference no.</span><span>${esc(o.date)}</span></div>
    <div class="ref-no mb-2">${esc(o.no)}</div>
    <div class="mb-3">${statusBadge(o.status)} <span class="small text-muted ms-2">${esc(o.type)} · ${esc(o.method)} · ${esc(o.paymentStatus)}</span></div>
    ${o.type === 'Delivery' ? `<p class="small text-muted">Deliver to: ${esc(o.address)} (${esc(o.phone)})</p>` : ''}
    <table class="table table-sm align-middle receipt"><thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-end">Price</th><th class="text-end">Subtotal</th></tr></thead><tbody>
    ${o.items.map(i => `<tr><td>${esc(i.name)}</td><td class="text-center">${i.quantity}</td><td class="text-end">${money(i.price)}</td><td class="text-end">${money(i.price * i.quantity)}</td></tr>`).join('')}
    </tbody></table>
    <dl class="row mb-0 receipt">
      <dt class="col-8 fw-normal">Subtotal</dt><dd class="col-4 text-end">${money(o.subtotal)}</dd>
      <dt class="col-8 fw-normal">Discount (${o.pct}%)</dt><dd class="col-4 text-end">-${money(o.discount)}</dd>
      <dt class="col-8">Total</dt><dd class="col-4 text-end fw-bold price">${money(o.total)}</dd>
      <dt class="col-8 fw-normal">Payment</dt><dd class="col-4 text-end">${money(o.payment)}</dd>
      <dt class="col-8 fw-normal">Change</dt><dd class="col-4 text-end">${money(o.change)}</dd>
    </dl>`;
}
function progressHTML(o) {
  if (o.status === 'Cancelled') return '<p class="mt-3 mb-0">' + statusBadge('Cancelled') + ' <span class="text-muted small">This order was cancelled and the stock was returned.</span></p>';
  const steps = ['Pending', 'Confirmed', 'Preparing', 'Completed'], at = steps.indexOf(o.status);
  return `<div class="track">${steps.map((s, i) => `<div class="${i <= at ? 'done' : ''}">${s}</div>`).join('')}</div>`;
}

/* ===== Thank you / order confirmation ===== */
function initThanks() {
  const msg = $('#thankyou-message');
  if (!msg) return;
  const o = getOrders().find(x => x.no === localStorage.getItem('lastOrder'));
  const box = $('#receipt');
  if (!o) { box.innerHTML = '<p class="text-center text-muted mb-0">No recent order found. <a href="order.html">Browse the menu</a> to place one.</p>'; return; }
  msg.textContent = `Thank you, ${o.name}! Your order has been placed.`;
  box.innerHTML = receiptHTML(o) + progressHTML(o);
  $('#track-link').href = 'track.html?ref=' + encodeURIComponent(o.no);
}

/* ===== Order status tracking (customer) ===== */
function initTrack() {
  const form = $('#track-form');
  if (!form) return;
  const show = ref => {
    const o = getOrders().find(x => x.no.toLowerCase() === ref.trim().toLowerCase());
    const out = $('#track-result');
    out.innerHTML = o ? `<div class="soft-card receipt-card p-4">${receiptHTML(o)}${progressHTML(o)}
      <h3 class="h6 mt-3">Status history</h3><ul class="small text-muted mb-0">${o.history.map(h => `<li>${h.status} — ${esc(h.time)}</li>`).join('')}</ul></div>`
      : '<p class="text-center text-muted">No order found for that reference number.</p>';
  };
  form.addEventListener('submit', e => { e.preventDefault(); show($('#track-ref').value); });
  const q = new URLSearchParams(location.search).get('ref');
  if (q) { $('#track-ref').value = q; show(q); }
}

/* ===== Admin / Staff (demo PIN: staff123) ===== */
function initAdmin() {
  const root = $('#admin-root');
  if (!root) return;
  const PIN = 'staff123';
  const draw = () => {
    if (sessionStorage.getItem('staff') !== '1') {
      root.innerHTML = `<form id="pin-form" class="soft-card p-4 mx-auto" style="max-width:380px"><h2 class="h5 mb-3">Staff sign-in</h2>
        <label class="form-label" for="pin">Staff PIN</label><input type="password" id="pin" class="form-control mb-3" required>
        <div id="pin-err" class="alert alert-danger py-2 d-none">Wrong PIN.</div><button class="btn btn-brand w-100">Sign in</button>
        <p class="small text-muted mt-3 mb-0">Demo only: PIN is <b>staff123</b>. Customers cannot see this panel's controls.</p></form>`;
      $('#pin-form').addEventListener('submit', e => { e.preventDefault(); if ($('#pin').value === PIN) { sessionStorage.setItem('staff', '1'); draw(); } else $('#pin-err').classList.remove('d-none'); });
      return;
    }
    const orders = getOrders(), inv = getInv(), log = readJSON('stockmoves', []);
    root.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3"><ul class="nav nav-pills gap-1" role="tablist">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="pill" data-bs-target="#t-orders">Orders (${orders.length})</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#t-inv">Inventory</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#t-log">Stock movements</button></li></ul>
        <button class="btn btn-outline-brand btn-sm" id="signout">Sign out</button></div>
      <div class="tab-content">
        <div class="tab-pane fade show active" id="t-orders"><div class="soft-card p-3 table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Ref no.</th><th>Customer</th><th>Type</th><th class="text-end">Total</th><th>Status</th><th>Update</th></tr></thead><tbody>
          ${orders.map(o => `<tr><td class="fw-semibold">${esc(o.no)}</td><td>${esc(o.name)}</td><td>${esc(o.type)}</td><td class="text-end">${money(o.total)}</td><td>${statusBadge(o.status)}</td>
            <td>${o.status === 'Cancelled' || o.status === 'Completed' ? '<span class="text-muted small">Closed</span>' : `<select class="form-select form-select-sm" data-ref="${o.no}" style="min-width:130px">${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>`}</td></tr>`).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No orders yet.</td></tr>'}
        </tbody></table></div><p class="small text-muted mt-2">Cancelling an order returns its items to available stock.</p></div>
        <div class="tab-pane fade" id="t-inv"><div class="soft-card p-3 table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Item</th><th>Category</th><th class="text-end">Available</th><th style="width:130px">Qty</th><th></th></tr></thead><tbody>
          ${ALL_ITEMS.map(i => `<tr><td>${i.name}</td><td class="text-muted">${i.cat}</td><td class="text-end fw-bold ${inv[i.name] === 0 ? 'text-danger' : ''}">${inv[i.name]}</td>
            <td><input type="number" min="1" value="1" class="form-control form-control-sm" data-q="${i.name}" aria-label="Quantity for ${i.name}"></td>
            <td class="text-nowrap"><button class="btn btn-sm btn-brand" data-mv="IN" data-item="${i.name}">Stock-in</button> <button class="btn btn-sm btn-outline-brand" data-mv="OUT" data-item="${i.name}">Stock-out</button></td></tr>`).join('')}
        </tbody></table></div><p class="small text-muted mt-2">Stock-out is for manual removals (spoilage, damaged goods). Sales deduct stock automatically.</p></div>
        <div class="tab-pane fade" id="t-log"><div class="soft-card p-3 table-responsive"><table class="table table-sm mb-0"><thead><tr><th>Time</th><th>Item</th><th>Type</th><th class="text-end">Qty</th><th class="text-end">Left</th><th>Ref</th></tr></thead><tbody>
          ${log.slice(0, 60).map(l => `<tr><td>${esc(l.time)}</td><td>${esc(l.item)}</td><td>${{ IN: 'Stock-in', OUT: 'Stock-out', SOLD: 'Sold (auto)', RESTORE: 'Returned (cancel)' }[l.type]}</td><td class="text-end">${l.qty}</td><td class="text-end">${l.left}</td><td>${esc(l.ref)}</td></tr>`).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">No movements yet.</td></tr>'}
        </tbody></table></div></div></div>`;
    $('#signout').addEventListener('click', () => { sessionStorage.removeItem('staff'); draw(); });
    root.querySelectorAll('select[data-ref]').forEach(sel => sel.addEventListener('change', () => { setStatus(sel.dataset.ref, sel.value); draw(); }));
    root.querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', () => {
      const q = Math.floor(Number(root.querySelector(`[data-q="${CSS.escape(b.dataset.item)}"]`).value));
      if (!(q > 0)) return;
      if (b.dataset.mv === 'OUT' && q > stockOf(b.dataset.item)) { toast(`Only ${stockOf(b.dataset.item)} available`); return; }
      moveStock(b.dataset.item, b.dataset.mv, q); draw();
      root.querySelector('[data-bs-target="#t-inv"]').click();
    }));
  };
  draw();
}

/* ===== Developers ===== */
function initDevelopers() {
  const root = $('#team');
  if (!root) return;
  root.innerHTML = MEMBERS.map(m => `
    <div class="col-6 col-md-4 col-lg-3"><a class="member-card text-center" href="${memberHref(m)}">
      ${img('images/' + m.cardImg, m.cardName)}<div class="p-3"><h3 class="h6 mb-1">${m.cardName}</h3>
      <span class="badge ${m.role === 'Leader' ? 'text-bg-warning' : 'text-bg-secondary'}">${m.role}</span></div></a></div>`).join('');
}
function initMember() {
  const root = $('#member-profile');
  if (!root) return;
  const m = MEMBERS.find(x => x.id === Number(root.dataset.id));
  if (!m) return;
  root.innerHTML = `
    <div class="soft-card profile-card p-4 p-md-5">
      <div class="text-center mb-4">
        ${img('images/' + m.img, m.name, 'profile-img mb-3')}
        <h2 class="h3 mb-1" style="color:var(--brand)">${m.name}</h2>
        <span class="badge ${m.role === 'Leader' ? 'text-bg-warning' : 'text-bg-secondary'}">${m.role}</span>
      </div>
      <dl class="row mb-4">${m.details.map(([k, v]) => `<dt class="col-sm-4 label">${k}</dt><dd class="col-sm-8">${v}</dd>`).join('')}</dl>
      <div class="text-center"><a class="btn btn-brand px-4" href="developers.html">← Back to Developers</a></div>
    </div>`;
  document.title = `${m.cardName} - Taven`;
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  layout();
  updateBadge();
  initHome(); initMenu(); initSummary(); initThanks(); initTrack(); initAdmin(); initDevelopers(); initMember();
});
