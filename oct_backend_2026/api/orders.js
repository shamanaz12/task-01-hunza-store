const products = require('../lib/products');
const cfg = require('../lib/config');
const store = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  const clean = v => String(v || '').trim();
  if (clean(b.name).length < 3) return res.status(400).json({ error: 'Please enter your full name.' });
  const digits = clean(b.phone).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (clean(b.address).length < 10) return res.status(400).json({ error: 'Please enter your full address.' });
  if (clean(b.city).length < 2) return res.status(400).json({ error: 'Please enter your city.' });
  if (!Array.isArray(b.items) || b.items.length === 0) return res.status(400).json({ error: 'Your cart is empty.' });

  const lines = [];
  for (const it of b.items) {
    const p = products.find(x => x.id === Number(it.id));
    const qty = Number(it.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 50) return res.status(400).json({ error: 'Invalid item in cart.' });
    lines.push({ id: p.id, name: p.name, price: p.price, qty, lineTotal: p.price * qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const delivery = subtotal >= cfg.FREE_DELIVERY_ABOVE ? 0 : cfg.DELIVERY_FEE;
  const order = {
    name: clean(b.name), phone: clean(b.phone), address: clean(b.address), city: clean(b.city),
    payment: 'Cash on Delivery', items: lines, subtotal, delivery, total: subtotal + delivery,
    status: 'New', createdAt: new Date().toISOString()
  };
  let saved = false;
  try {
    saved = await store.saveOrder(order);
  } catch (e) {
    console.error('ORDER SAVE FAILED:', e.message);
    return res.status(503).json({ error: 'Sorry, we could not save your order right now. Please try again in a minute or WhatsApp us.' });
  }
  console.log('NEW ORDER #' + order.id + ' saved=' + saved + ' ' + JSON.stringify(order));
  res.status(201).json({ id: order.id, subtotal, delivery, total: order.total, saved });
};
