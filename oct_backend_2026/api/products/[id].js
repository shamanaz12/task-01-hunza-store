const products = require('../../lib/products');
module.exports = (req, res) => {
  const p = products.find(x => x.id === Number(req.query.id));
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.status(200).json(p);
};
