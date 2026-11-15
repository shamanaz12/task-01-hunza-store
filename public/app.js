const DELIVERY_FEE = 200, FREE_DELIVERY_ABOVE = 3000, CART_KEY = 'hunza_cart';
const WA_NUMBER = '923001234567';
const $ = (s, r = document) => r.querySelector(s);
const rs = n => 'Rs ' + Number(n).toLocaleString('en-PK');
const stars = n => '⭐'.repeat(n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function getCart() {
  try { const c = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(c) ? c : []; }
  catch (e) { return []; }
}
function saveCart(c) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {}
  updateBadge();
}
function updateBadge() {
  const n = getCart().reduce((s, i) => s + i.qty, 0);
  const b = $('#cart-btn');
  if (b) b.textContent = 'Cart (' + n + ')';
}
function addToCart(p, qty = 1) {
  const c = getCart();
  const found = c.find(i => i.id === p.id);
  if (found) found.qty = Math.min(50, found.qty + qty);
  else c.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty });
  saveCart(c);
  toast(p.name + ' added to cart');
}
function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2200);
}
function openModal(html) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = '<div class="modal-box">' + html + '</div>';
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); });
  document.body.appendChild(m);
}
async function fetchJSON(url, opt) {
  const r = await fetch(url, opt);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
  return d;
}

function renderLayout() {
  document.body.insertAdjacentHTML('afterbegin', `
  <div class="topbar">Free Delivery on Orders Above Rs 3000 | Cash on Delivery Available All Over Pakistan</div>
  <header class="header"><div class="container">
    <a href="index.html" class="logo">HUNZA STORE 🌿</a>
    <form class="search" id="search-form">
      <input type="search" id="search-input" placeholder="Search for Apricots, Walnuts, Honey..." aria-label="Search products" autocomplete="off">
      <button type="submit">Search</button>
    </form>
    <div class="hbtns">
      <a href="cart.html" class="btn-h" id="cart-btn">Cart (0)</a>
      <button type="button" class="btn-h" id="login-btn">Login</button>
    </div>
  </div></header>
  <nav class="nav"><div class="container">
    <a href="index.html" data-nav="home">Home</a>
    <a href="index.html#products" data-nav="shop">Shop</a>
    <a href="index.html?cat=apricots#products" data-nav="apricots">Apricots</a>
    <a href="index.html?cat=walnuts#products" data-nav="walnuts">Walnuts</a>
    <a href="index.html?cat=honey#products" data-nav="honey">Honey</a>
    <a href="index.html?cat=oils#products" data-nav="oils">Oils</a>
    <a href="#contact">Contact</a>
  </div></nav>`);
  document.body.insertAdjacentHTML('beforeend', `
  <footer class="footer" id="contact"><div class="container">
    <div class="cols">
      <div><h4>About Hunza Store</h4><p>We bring pure dry fruits directly from Hunza Valley farmers to your home.</p></div>
      <div><h4>Quick Links</h4><ul>
        <li><a href="index.html">Home</a></li><li><a href="index.html#products">Shop</a></li>
        <li><a href="cart.html">Cart</a></li><li><a href="#contact">Contact Us</a></li>
        <li><a href="https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi, I want to track my order.')}" target="_blank" rel="noopener">Track Order</a></li>
      </ul></div>
      <div><h4>Contact Us</h4>
        <p>WhatsApp: <a href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener">0300-1234567</a></p>
        <p>Email: <a href="mailto:hunzastore@gmail.com">hunzastore@gmail.com</a></p>
        <p>Address: Hunza, Gilgit Baltistan, Pakistan</p></div>
    </div>
    <div class="copy">© 2026 Hunza Store. All Rights Reserved.</div>
  </div></footer>`);
  const page = document.body.dataset.page;
  const cat = new URLSearchParams(location.search).get('cat');
  const key = page === 'home' ? (cat || 'home') : null;
  const active = key && $('[data-nav="' + key + '"]');
  if (active) active.classList.add('active');
  $('#login-btn').addEventListener('click', () => openModal(
    '<h3>Login</h3><p>Customer accounts are coming soon. You do not need an account to order: add products to your cart and pay Cash on Delivery.</p><button class="btn" data-close>Continue Shopping</button>'));
}

function initSearch(onFilter) {
  const f = $('#search-form'), i = $('#search-input');
  i.value = new URLSearchParams(location.search).get('q') || '';
  f.addEventListener('submit', e => {
    e.preventDefault();
    const v = i.value.trim();
    if (onFilter) { onFilter(v); const s = $('#products'); if (s) s.scrollIntoView({ behavior: 'smooth' }); }
    else location.href = 'index.html' + (v ? '?q=' + encodeURIComponent(v) : '') + '#products';
  });
  if (onFilter) i.addEventListener('input', () => onFilter(i.value.trim()));
}

function initHome() {
  const grid = $('#product-grid'), none = $('#no-results');
  const cards = [...grid.querySelectorAll('.card')];
  const cat = new URLSearchParams(location.search).get('cat');
  const TITLES = { apricots: 'Apricots & Dried Fruits', walnuts: 'Walnuts', honey: 'Honey', oils: 'Natural Oils' };
  if (cat && TITLES[cat]) $('#products-title').textContent = TITLES[cat];
  const draw = q => {
    q = (q || '').toLowerCase();
    let shown = 0;
    cards.forEach(c => {
      const ok = (q || !cat || c.dataset.category === cat) && (!q || c.dataset.search.includes(q));
      c.hidden = !ok;
      if (ok) shown++;
    });
    none.hidden = shown > 0;
  };
  initSearch(draw);
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const c = b.closest('.card');
    addToCart({ id: Number(c.dataset.id), name: c.dataset.name, price: Number(c.dataset.price), image: c.querySelector('img').getAttribute('src') });
  });
  draw($('#search-input').value.trim());
}

async function initProduct() {
  initSearch(null);
  const box = $('#detail');
  const id = new URLSearchParams(location.search).get('id');
  try {
    const p = await fetchJSON('/api/products/' + encodeURIComponent(id));
    document.title = p.name + ' - Hunza Store';
    box.innerHTML = `<div class="detail">
      <img class="product-image" src="${p.image}" alt="${esc(p.name)}">
      <div class="info">
        <h1>${esc(p.name)}</h1>
        <div class="stars">${stars(p.rating)}</div>
        <div class="price big">${rs(p.price)}</div>
        <p class="desc">${esc(p.description)}</p>
        <p class="meta">✅ 100% Natural &nbsp; 🚚 Delivery in 2-3 days &nbsp; 💵 Cash on Delivery</p>
        <div class="qty-row"><span>Quantity</span>
          <div class="qty"><button type="button" id="minus" aria-label="Decrease quantity">−</button><span id="qty">1</span><button type="button" id="plus" aria-label="Increase quantity">+</button></div></div>
        <div class="actions"><button type="button" class="btn" id="add">Add to Cart</button><a href="index.html" class="btn btn-outline">← Back to Home</a></div>
      </div></div>`;
    let q = 1;
    const qe = $('#qty');
    $('#minus').onclick = () => { if (q > 1) qe.textContent = --q; };
    $('#plus').onclick = () => { if (q < 50) qe.textContent = ++q; };
    $('#add').onclick = () => addToCart(p, q);
  } catch (e) {
    box.innerHTML = '<div class="panel empty"><h2>Product not found</h2><p>This product does not exist or the server is not running.</p><a class="btn" href="index.html">Back to Home</a></div>';
  }
}

function initCart() {
  initSearch(null);
  const items = $('#cart-items'), summary = $('#summary'), wrap = $('#cart-wrap');
  const empty = $('#empty'), success = $('#success'), form = $('#checkout');
  const errBox = $('#form-error'), btn = $('#confirm-btn');
  const showErr = m => { errBox.textContent = m; errBox.hidden = false; };

  function render() {
    const c = getCart();
    wrap.hidden = c.length === 0;
    empty.hidden = c.length !== 0;
    if (!c.length) return;
    items.innerHTML = c.map(i => `<div class="cart-item">
      <img class="product-image" src="${i.image}" alt="${esc(i.name)}">
      <div><a href="product.html?id=${i.id}"><strong>${esc(i.name)}</strong></a>
        <div class="muted">${rs(i.price)} each</div>
        <div class="qty"><button type="button" data-act="dec" data-id="${i.id}" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button type="button" data-act="inc" data-id="${i.id}" aria-label="Increase quantity">+</button></div></div>
      <div class="right"><strong>${rs(i.price * i.qty)}</strong><button type="button" class="remove" data-act="del" data-id="${i.id}">Remove</button></div>
    </div>`).join('');
    const sub = c.reduce((s, i) => s + i.price * i.qty, 0);
    const ship = sub >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
    summary.innerHTML = `<div class="sum-row"><span>Subtotal</span><span>${rs(sub)}</span></div>
      <div class="sum-row"><span>Delivery</span><span>${ship ? rs(ship) : 'FREE'}</span></div>
      ${ship ? `<p class="hint">Add ${rs(FREE_DELIVERY_ABOVE - sub)} more for free delivery.</p>` : ''}
      <div class="sum-row sum-total"><span>Total</span><span>${rs(sub + ship)}</span></div>`;
  }

  items.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const c = getCart();
    const it = c.find(x => x.id === Number(b.dataset.id));
    if (!it) return;
    if (b.dataset.act === 'inc') it.qty = Math.min(50, it.qty + 1);
    if (b.dataset.act === 'dec') it.qty = Math.max(1, it.qty - 1);
    if (b.dataset.act === 'del') c.splice(c.indexOf(it), 1);
    saveCart(c);
    render();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errBox.hidden = true;
    const c = getCart();
    if (!c.length) return showErr('Your cart is empty.');
    const data = {
      name: $('#fullName').value.trim(), phone: $('#phone').value.trim(),
      address: $('#address').value.trim(), city: $('#city').value.trim(),
      payment: 'Cash on Delivery', items: c.map(i => ({ id: i.id, qty: i.qty }))
    };
    const digits = data.phone.replace(/\D/g, '');
    if (data.name.length < 3) return showErr('Please enter your full name.');
    if (digits.length < 10 || digits.length > 13) return showErr('Please enter a valid phone number.');
    if (data.address.length < 10) return showErr('Please enter your full address.');
    if (data.city.length < 2) return showErr('Please enter your city.');
    btn.disabled = true;
    btn.textContent = 'Placing order...';
    try {
      const o = await fetchJSON('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      saveCart([]);
      wrap.hidden = true;
      success.hidden = false;
      success.innerHTML = `<div class="panel success"><div class="check">✅</div><h2>Order Successful!</h2>
        <p>Your Order ID is <strong>#${o.id}</strong>. Total: <strong>${rs(o.total)}</strong>. We will call you to confirm.</p>
        <a href="index.html" class="btn">Continue Shopping</a></div>`;
      window.scrollTo(0, 0);
    } catch (err) {
      showErr(err.message);
      btn.disabled = false;
      btn.textContent = 'Confirm Order';
    }
  });
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
  updateBadge();
  const page = document.body.dataset.page;
  if (page === 'home') initHome();
  if (page === 'product') initProduct();
  if (page === 'cart') initCart();
});
