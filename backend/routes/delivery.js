const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  let query, params = [];
  if (req.user.role === 'driver') {
    query = `SELECT d.*, o.total_amount, o.buyer_id, u1.name as buyer_name, u1.phone as buyer_phone,
      u2.name as farmer_name, l.title as listing_title
      FROM deliveries d JOIN orders o ON d.order_id=o.id JOIN users u1 ON o.buyer_id=u1.id
      JOIN users u2 ON o.farmer_id=u2.id JOIN listings l ON o.listing_id=l.id
      WHERE d.driver_id=? ORDER BY d.created_at DESC`;
    params = [req.user.id];
  } else if (req.user.role === 'admin') {
    query = `SELECT d.*, u.name as driver_name FROM deliveries d LEFT JOIN users u ON d.driver_id=u.id ORDER BY d.created_at DESC LIMIT 200`;
  } else return res.status(403).json({ error: 'Forbidden' });
  res.json(db.prepare(query).all(...params));
});

router.post('/', auth, requireRole('admin'), (req, res) => {
  const { order_id, driver_id, pickup_address, delivery_address } = req.body;
  if (!order_id || !delivery_address) return res.status(400).json({ error: 'order_id and delivery_address required' });
  const id = uuidv4();
  db.prepare('INSERT INTO deliveries (id,order_id,driver_id,pickup_address,delivery_address) VALUES (?,?,?,?,?)')
    .run(id, order_id, driver_id||null, pickup_address||null, delivery_address);
  if (driver_id) db.prepare("UPDATE orders SET driver_id=?, status='in_delivery' WHERE id=?").run(driver_id, order_id);
  res.status(201).json({ id });
});

router.patch('/:id/status', auth, requireRole('driver','admin'), (req, res) => {
  const { status, notes } = req.body;
  db.prepare('UPDATE deliveries SET status=?,notes=? WHERE id=?').run(status, notes||null, req.params.id);
  if (status === 'delivered') {
    const d = db.prepare('SELECT order_id FROM deliveries WHERE id=?').get(req.params.id);
    if (d) db.prepare("UPDATE orders SET status='delivered', updated_at=datetime('now') WHERE id=?").run(d.order_id);
  }
  res.json({ success: true });
});

module.exports = router;
