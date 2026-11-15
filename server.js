const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DELIVERY_FEE = 200;
const FREE_DELIVERY_ABOVE = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const products = [
  { id: 1, name: 'Dried Hunza Apricots', category: 'apricots', price: 1200, rating: 5,
    image: 'images/apricot.jpg',
    description: 'Golden dried apricots, sun dried, sweet, no sugar added.' },
  { id: 2, name: 'Walnut Kernels', category: 'walnuts', price: 1500, rating: 5,
    image: 'images/walnut.jpg',
    description: 'Fresh walnut kernels from Hunza, best for brain.' },
  { id: 3, name: 'Wild Honey', category: 'honey', price: 2200, rating: 5,
    image: 'images/honey.jpg',
    description: '100% Pure Wild Honey, no mixing, original.' },
  { id: 4, name: 'Mulberry Dry Fruit', category: 'apricots', price: 900, rating: 4,
    image: 'images/mulberry.jpg',
    description: 'White dried mulberry, sweet and healthy.' },
  { id: 5, name: 'Almond Oil 100ml', category: 'oils', price: 1800, rating: 5,
    image: 'images/almond-oil.jpg',
    description: '100% Pure Cold Pressed Almond Oil for hair and skin.' },
  { id: 6, name: 'Apricot Kernel Oil 100ml', category: 'oils', price: 1600, rating: 4,
    image: 'images/apricot-oil.jpg',
    description: 'Pure Apricot Kernel Oil from Hunza.' }
];

const orders = [];
let nextOrderId = 101;

app.get('/api/products', (req, res) => res.json(products));

app.get('/api/products/:id', (req, res) => {
  const p = products.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

app.post('/api/orders', (req, res) => {
  const { name, phone, address, city, payment, items } = req.body || {};
  const clean = v => String(v || '').trim();
  if (clean(name).length < 3) return res.status(400).json({ error: 'Please enter your full name.' });
  const digits = clean(phone).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (clean(address).length < 10) return res.status(400).json({ error: 'Please enter your full address.' });
  if (clean(city).length < 2) return res.status(400).json({ error: 'Please enter your city.' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Your cart is empty.' });

  const lines = [];
  for (const it of items) {
    const p = products.find(x => x.id === Number(it.id));
    const qty = Number(it.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 50) return res.status(400).json({ error: 'Invalid item in cart.' });
    lines.push({ id: p.id, name: p.name, price: p.price, qty, lineTotal: p.price * qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const delivery = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const order = {
    id: nextOrderId++, name: clean(name), phone: clean(phone), address: clean(address), city: clean(city),
    payment: payment || 'Cash on Delivery', items: lines, subtotal, delivery, total: subtotal + delivery,
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  console.log('\n===== NEW ORDER #' + order.id + ' =====');
  console.log(JSON.stringify(order, null, 2));
  console.log('Total orders so far: ' + orders.length);
  res.status(201).json({ id: order.id, subtotal, delivery, total: order.total });
});

app.use((err, req, res, next) => res.status(400).json({ error: 'Invalid request.' }));

app.listen(PORT, () => console.log('Hunza Store running at http://localhost:' + PORT));
