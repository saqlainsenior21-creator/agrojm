const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('admin'));

router.get('/stats', (req, res) => {
  const farmers  = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='farmer'").get().c;
  const buyers   = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='buyer'").get().c;
  const listings = db.prepare("SELECT COUNT(*) as c FROM listings WHERE status='active'").get().c;
  const orders   = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const revenue  = db.prepare("SELECT COALESCE(SUM(total_amount),0) as r FROM orders WHERE payment_status='paid'").get().r;
  const parishes = db.prepare("SELECT parish, COUNT(*) as count FROM listings WHERE status='active' GROUP BY parish ORDER BY count DESC").all();
  const topCrops = db.prepare(`SELECT ct.name, COUNT(*) as count FROM listings l JOIN crop_types ct ON l.crop_type_id=ct.id
    WHERE l.status='active' GROUP BY ct.name ORDER BY count DESC LIMIT 10`).all();
  res.json({ farmers, buyers, listings, orders, revenue, parishes, topCrops });
});

router.get('/users', (req, res) => {
  res.json(db.prepare('SELECT id,name,email,role,phone,parish,business_name,buyer_type,verified,active,created_at FROM users ORDER BY created_at DESC').all());
});

router.patch('/users/:id/verify', (req, res) => {
  db.prepare('UPDATE users SET verified=1 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

router.patch('/users/:id/deactivate', (req, res) => {
  db.prepare('UPDATE users SET active=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

router.get('/orders', (req, res) => {
  res.json(db.prepare(`SELECT o.*, u1.name as buyer_name, u2.name as farmer_name, l.title as listing_title
    FROM orders o JOIN users u1 ON o.buyer_id=u1.id JOIN users u2 ON o.farmer_id=u2.id JOIN listings l ON o.listing_id=l.id
    ORDER BY o.created_at DESC LIMIT 200`).all());
});

module.exports = router;
