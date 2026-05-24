const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('extension_officer','admin'));

// GET /api/officer/dashboard — officer's parish stats
router.get('/dashboard', (req, res) => {
  const parish = req.user.extension_parish || req.query.parish;
  const parishFilter = parish ? ' AND parish = ?' : '';
  const params = parish ? [parish] : [];

  const farmers = db.prepare(`SELECT COUNT(*) as c FROM users WHERE role='farmer'${parishFilter}`)
    .get(...params).c;
  const pendingVerifications = db.prepare(`SELECT COUNT(*) as c FROM users WHERE role='farmer' AND (verification_status IS NULL OR verification_status='pending')${parishFilter}`)
    .get(...params).c;
  const activeListings = db.prepare(`SELECT COUNT(*) as c FROM listings WHERE status='active'${parishFilter}`)
    .get(...params).c;
  const certifications = db.prepare(`SELECT COUNT(*) as c FROM certifications c JOIN users u ON c.farmer_id=u.id WHERE 1=1${parish ? ' AND u.parish=?' : ''}`)
    .get(...params).c;
  const activeAlerts = db.prepare(`SELECT COUNT(*) as c FROM pest_alerts WHERE active=1${parish ? ' AND (parish=? OR parish IS NULL)' : ''}`)
    .get(...params).c;

  res.json({ parish, farmers, pendingVerifications, activeListings, certifications, activeAlerts });
});

// GET /api/officer/farmers — farmers to verify
router.get('/farmers', (req, res) => {
  const { status, parish } = req.query;
  let q = `SELECT u.id,u.name,u.email,u.phone,u.parish,u.rada_id,u.national_id,
    u.verification_status,u.verified,u.created_at,
    v.name as verified_by_name,
    (SELECT COUNT(*) FROM farms f WHERE f.farmer_id=u.id) as farm_count,
    (SELECT COUNT(*) FROM certifications c WHERE c.farmer_id=u.id) as cert_count,
    (SELECT COUNT(*) FROM listings l WHERE l.farmer_id=u.id AND l.status='active') as active_listings
    FROM users u
    LEFT JOIN users v ON u.verified_by=v.id
    WHERE u.role='farmer'`;
  const params = [];
  if (status) { q += ' AND u.verification_status=?'; params.push(status); }
  if (parish) { q += ' AND u.parish=?'; params.push(parish); }
  q += ' ORDER BY u.created_at DESC';
  res.json(db.prepare(q).all(...params));
});

// PATCH /api/officer/farmers/:id/verify — verify or reject farmer
router.patch('/farmers/:id/verify', (req, res) => {
  const { status, notes } = req.body;
  if (!['verified','rejected'].includes(status)) return res.status(400).json({ error: 'status must be verified or rejected' });
  const farmer = db.prepare("SELECT * FROM users WHERE id=? AND role='farmer'").get(req.params.id);
  if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
  db.prepare(`UPDATE users SET verification_status=?,verified=?,verified_by=?,verified_at=datetime('now') WHERE id=?`)
    .run(status, status==='verified' ? 1 : 0, req.user.id, req.params.id);
  res.json({ success: true });
});

// GET /api/officer/farms — farms in parish
router.get('/farms', (req, res) => {
  const { parish } = req.query;
  let q = `SELECT f.*, u.name as farmer_name, u.email as farmer_email, u.rada_id, u.verification_status
    FROM farms f JOIN users u ON f.farmer_id=u.id WHERE 1=1`;
  const params = [];
  if (parish) { q += ' AND f.parish=?'; params.push(parish); }
  q += ' ORDER BY f.created_at DESC';
  res.json(db.prepare(q).all(...params));
});

// GET /api/officer/production — parish production summary
router.get('/production', (req, res) => {
  const { parish } = req.query;
  const parishFilter = parish ? 'AND l.parish=?' : '';
  const params = parish ? [parish] : [];

  const byParish = db.prepare(`SELECT l.parish, ct.category, ct.name as crop_name,
    SUM(l.quantity_available) as total_quantity, COUNT(*) as listing_count, AVG(l.price_per_unit) as avg_price
    FROM listings l JOIN crop_types ct ON l.crop_type_id=ct.id
    WHERE l.status='active' ${parishFilter}
    GROUP BY l.parish, ct.name ORDER BY l.parish, total_quantity DESC`).all(...params);

  const cropYields = db.prepare(`SELECT ct.name as crop_name, ct.category,
    SUM(cl.quantity_harvested) as total_harvested, COUNT(*) as log_count
    FROM crop_logs cl JOIN crop_types ct ON cl.crop_type_id=ct.id
    JOIN users u ON cl.farmer_id=u.id
    WHERE cl.stage='harvested' ${parish ? 'AND u.parish=?' : ''}
    GROUP BY ct.name ORDER BY total_harvested DESC`).all(...params);

  res.json({ byParish, cropYields });
});

module.exports = router;
