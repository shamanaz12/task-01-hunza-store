// Order storage using Vercel Blob (Vercel's own file storage, free). Each order = one small JSON file.
const enabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;

async function allBlobs() {
  const { list } = require('@vercel/blob');
  const r = await list({ prefix: 'orders/', limit: 1000 });
  return r.blobs;
}

// returns true if saved, false if storage is not connected yet. Throws if storage is connected but fails.
async function saveOrder(order) {
  if (!enabled()) { order.id = 10000 + Math.floor(Math.random() * 90000); return false; }
  const { put } = require('@vercel/blob');
  order.id = 101 + (await allBlobs()).length;
  await put('orders/order-' + order.id + '.json', JSON.stringify(order), {
    access: 'public', contentType: 'application/json', addRandomSuffix: true
  });
  return true;
}

async function listOrders() {
  if (!enabled()) return [];
  const blobs = (await allBlobs()).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 300);
  const orders = await Promise.all(blobs.map(b => fetch(b.url).then(r => r.json()).catch(() => null)));
  return orders.filter(Boolean);
}

module.exports = { enabled, saveOrder, listOrders };
