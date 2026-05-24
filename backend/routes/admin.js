const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('admin'));

router.get('/stats', (req, res) => {
  const farmers  = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='farmer' AND active=1").get().c;
  const buyers   = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='buyer' AND active=1").get().c;
  const listings = db.prepare("SELECT COUNT(*) as c FROM listings WHERE status='active'").get().c;
  const orders   = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const revenue  = db.prepare("SELECT COALESCE(SUM(total_amount),0) as r FROM orders WHERE payment_status='paid'").get().r;
  const verifiedFarmers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='farmer' AND verification_status='verified'").get().c;
  const pendingVerifications = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='farmer' AND (verification_status IS NULL OR verification_status='pending')").get().c;
  const totalFarms = db.prepare("SELECT COUNT(*) as c FROM farms").get().c;
  const totalCerts = db.prepare("SELECT COUNT(*) as c FROM certifications WHERE status='active'").get().c;
  const activeAlerts = db.prepare("SELECT COUNT(*) as c FROM pest_alerts WHERE active=1").get().c;
  const subsidyApps = db.prepare("SELECT COUNT(*) as c FROM subsidy_applications WHERE status='applied'").get().c;

  const parishes = db.prepare(`SELECT parish, COUNT(*) as count FROM listings
    WHERE status='active' AND parish IS NOT NULL GROUP BY parish ORDER BY count DESC`).all();
  const topCrops = db.prepare(`SELECT ct.name, COUNT(*) as count FROM listings l
    JOIN crop_types ct ON l.crop_type_id=ct.id
    WHERE l.status='active' GROUP BY ct.name ORDER BY count DESC LIMIT 10`).all();
  const farmersByParish = db.prepare(`SELECT parish, COUNT(*) as count FROM users
    WHERE role='farmer' AND active=1 AND parish IS NOT NULL GROUP BY parish ORDER BY count DESC`).all();
  const recentOrders = db.prepare(`SELECT strftime('%Y-%m-%d', o.created_at) as date, COUNT(*) as orders,
    COALESCE(SUM(o.total_amount),0) as revenue FROM orders o
    WHERE o.created_at >= date('now','-30 days') GROUP BY date ORDER BY date DESC`).all();

  res.json({
    farmers, buyers, listings, orders, revenue, verifiedFarmers, pendingVerifications,
    totalFarms, totalCerts, activeAlerts, subsidyApps,
    parishes, topCrops, farmersByParish, recentOrders
  });
});

router.get('/users', (req, res) => {
  const { role, parish, verification_status } = req.query;
  let q = `SELECT u.id,u.name,u.email,u.role,u.phone,u.parish,u.business_name,u.buyer_type,
    u.rada_id,u.national_id,u.verification_status,u.verified,u.active,u.created_at,
    v.name as verified_by_name
    FROM users u LEFT JOIN users v ON u.verified_by=v.id WHERE 1=1`;
  const params = [];
  if (role) { q += ' AND u.role=?'; params.push(role); }
  if (parish) { q += ' AND u.parish=?'; params.push(parish); }
  if (verification_status) { q += ' AND u.verification_status=?'; params.push(verification_status); }
  q += ' ORDER BY u.created_at DESC';
  res.json(db.prepare(q).all(...params));
});

router.patch('/users/:id/verify', (req, res) => {
  db.prepare("UPDATE users SET verified=1,verification_status='verified',verified_by=?,verified_at=datetime('now') WHERE id=?")
    .run(req.user.id, req.params.id);
  res.json({ success: true });
});

router.patch('/users/:id/deactivate', (req, res) => {
  db.prepare('UPDATE users SET active=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

router.patch('/users/:id/activate', (req, res) => {
  db.prepare('UPDATE users SET active=1 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/admin/users — create extension officer or admin user
router.post('/users', (req, res) => {
  const { name, email, password, role, phone, parish, extension_parish } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Required fields missing' });
  if (!['extension_officer','admin','driver'].includes(role)) return res.status(400).json({ error: 'Invalid role for this endpoint' });
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users (id,name,email,password,role,phone,parish,extension_parish,verified,verification_status) VALUES (?,?,?,?,?,?,?,?,1,'verified')")
    .run(id, name, email.toLowerCase(), hash, role, phone||null, parish||null, extension_parish||null);
  res.status(201).json({ id });
});

router.get('/orders', (req, res) => {
  res.json(db.prepare(`SELECT o.*, u1.name as buyer_name, u1.buyer_type, u2.name as farmer_name,
    u2.parish as farmer_parish, l.title as listing_title, ct.name as crop_name
    FROM orders o JOIN users u1 ON o.buyer_id=u1.id JOIN users u2 ON o.farmer_id=u2.id
    JOIN listings l ON o.listing_id=l.id JOIN crop_types ct ON l.crop_type_id=ct.id
    ORDER BY o.created_at DESC LIMIT 500`).all());
});

// GET /api/admin/pest-alerts — all alerts management
router.get('/pest-alerts', (req, res) => {
  res.json(db.prepare(`SELECT pa.*, ct.name as crop_name, u.name as issued_by_name
    FROM pest_alerts pa LEFT JOIN crop_types ct ON pa.crop_type_id=ct.id
    LEFT JOIN users u ON pa.issued_by=u.id ORDER BY pa.created_at DESC`).all());
});

// GET /api/admin/certifications — all certs
router.get('/certifications', (req, res) => {
  res.json(db.prepare(`SELECT c.*, u.name as farmer_name, u.parish, u.rada_id,
    f.name as farm_name, v.name as verified_by_name
    FROM certifications c JOIN users u ON c.farmer_id=u.id
    LEFT JOIN farms f ON c.farm_id=f.id LEFT JOIN users v ON c.verified_by=v.id
    ORDER BY c.created_at DESC`).all());
});

// GET /api/admin/subsidies/applications — all subsidy applications
router.get('/subsidies/applications', (req, res) => {
  res.json(db.prepare(`SELECT sa.*, s.title as program_title, s.subsidy_type, s.amount_jmd,
    u.name as farmer_name, u.parish, u.rada_id, r.name as reviewed_by_name
    FROM subsidy_applications sa JOIN subsidies s ON sa.subsidy_id=s.id
    JOIN users u ON sa.farmer_id=u.id LEFT JOIN users r ON sa.reviewed_by=r.id
    ORDER BY sa.created_at DESC`).all());
});

module.exports = router;
