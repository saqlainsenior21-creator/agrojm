const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/certifications/my — farmer's own certs
router.get('/my', auth, requireRole('farmer'), (req, res) => {
  res.json(db.prepare(`SELECT c.*, f.name as farm_name, u.name as verified_by_name
    FROM certifications c
    LEFT JOIN farms f ON c.farm_id=f.id
    LEFT JOIN users u ON c.verified_by=u.id
    WHERE c.farmer_id=? ORDER BY c.created_at DESC`).all(req.user.id));
});

// POST /api/certifications — farmer registers a certification
router.post('/', auth, requireRole('farmer'), (req, res) => {
  const { farm_id, cert_type, cert_number, issued_by, issued_date, expiry_date, notes } = req.body;
  if (!cert_type) return res.status(400).json({ error: 'cert_type is required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO certifications (id,farmer_id,farm_id,cert_type,cert_number,issued_by,issued_date,expiry_date,notes)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, req.user.id, farm_id||null, cert_type, cert_number||null, issued_by||null, issued_date||null, expiry_date||null, notes||null);
  res.status(201).json({ id });
});

// GET /api/certifications — admin/officer: all certs
router.get('/', auth, requireRole('admin','extension_officer'), (req, res) => {
  res.json(db.prepare(`SELECT c.*, u.name as farmer_name, u.parish as farmer_parish, u.rada_id,
    f.name as farm_name, v.name as verified_by_name
    FROM certifications c
    JOIN users u ON c.farmer_id=u.id
    LEFT JOIN farms f ON c.farm_id=f.id
    LEFT JOIN users v ON c.verified_by=v.id
    ORDER BY c.created_at DESC`).all());
});

// PATCH /api/certifications/:id/verify — officer/admin verifies cert
router.patch('/:id/verify', auth, requireRole('admin','extension_officer'), (req, res) => {
  const { status, notes } = req.body;
  const cert = db.prepare('SELECT * FROM certifications WHERE id=?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: 'Certification not found' });
  db.prepare('UPDATE certifications SET status=?,verified_by=?,notes=? WHERE id=?')
    .run(status||'active', req.user.id, notes||cert.notes, req.params.id);
  res.json({ success: true });
});

module.exports = router;
