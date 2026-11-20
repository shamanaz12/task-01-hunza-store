const products = require('../lib/products');
module.exports = (req, res) => res.status(200).json({ ok: true, products: products.length, orderStorage: process.env.BLOB_READ_WRITE_TOKEN ? 'connected' : 'not connected' });
