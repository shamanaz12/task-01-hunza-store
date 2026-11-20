const crypto = require('crypto');
const cfg = require('../../lib/config');
const store = require('../../lib/store');

module.exports = async (req, res) => {
  const pw = process.env.ADMIN_PASSWORD || cfg.ADMIN_PASSWORD;
  const hash = s => crypto.createHash('sha256').update(String(s)).digest();
  if (!crypto.timingSafeEqual(hash(req.headers['x-admin-password'] || ''), hash(pw))) {
    await new Promise(r => setTimeout(r, 800));
    return res.status(401).json({ error: 'Wrong password.' });
  }
  try {
    res.status(200).json({ connected: store.enabled(), orders: await store.listOrders() });
  } catch (e) {
    res.status(503).json({ error: 'Could not read orders: ' + e.message });
  }
};
