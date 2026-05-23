const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/orders — buyer places order
router.post('/', auth, requireRole('buyer'), (req, res) => {
  const { listing_id, quantity, delivery_address, delivery_date, notes } = req.body;
  if (!listing_id || !quantity || !delivery_address) return res.status(400).json({ error: 'Missing required fields' });

  const listing = db.prepare('SELECT * FROM listings WHERE id=? AND status=?').get(listing_id, 'active');
  if (!listing) return res.status(404).json({ error: 'Listing not found or unavailable' });
  if (quantity > listing.quantity_available) return res.status(400).json({ error: `Only ${listing.quantity_available} ${listing.unit} available` });

  const total = quantity * listing.price_per_unit;
  const id = uuidv4();
  db.prepare(`INSERT INTO orders (id,buyer_id,listing_id,farmer_id,quantity,unit,unit_price,total_amount,delivery_address,delivery_date,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, req.user.id, listing_id, listing.farmer_id, quantity, listing.unit, listing.price_per_unit, total, delivery_address, delivery_date||null, notes||null);

  res.status(201).json({ id, total_amount: total, currency: 'JMD', message: 'Order placed successfully' });
});

// GET /api/orders — buyer or farmer sees their orders
router.get('/', auth, (req, res) => {
  let query, params;
  if (req.user.role === 'buyer') {
    query = `SELECT o.*, l.title as listing_title, ct.name as crop_name, u.name as farmer_name, u.phone as farmer_phone
      FROM orders o JOIN listings l ON o.listing_id=l.id JOIN crop_types ct ON l.crop_type_id=ct.id
      JOIN users u ON o.farmer_id=u.id WHERE o.buyer_id=? ORDER BY o.created_at DESC`;
    params = [req.user.id];
  } else if (req.user.role === 'farmer') {
    query = `SELECT o.*, l.title as listing_title, ct.name as crop_name, u.name as buyer_name, u.phone as buyer_phone, u.business_name
      FROM orders o JOIN listings l ON o.listing_id=l.id JOIN crop_types ct ON l.crop_type_id=ct.id
      JOIN users u ON o.buyer_id=u.id WHERE o.farmer_id=? ORDER BY o.created_at DESC`;
    params = [req.user.id];
  } else if (req.user.role === 'admin') {
    query = `SELECT o.*, l.title as listing_title, ct.name as crop_name FROM orders o
      JOIN listings l ON o.listing_id=l.id JOIN crop_types ct ON l.crop_type_id=ct.id ORDER BY o.created_at DESC LIMIT 200`;
    params = [];
  } else return res.status(403).json({ error: 'Forbidden' });
  res.json(db.prepare(query).all(...params));
});

// PATCH /api/orders/:id/status — farmer confirms/rejects, admin updates
router.patch('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (req.user.role === 'farmer' && order.farmer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (req.user.role === 'buyer' && order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?").run(status, req.params.id);
  res.json({ success: true });
});

module.exports = router;
