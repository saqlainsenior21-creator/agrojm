const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/alerts — public: list active pest/disease alerts
router.get('/', (req, res) => {
  const { parish, severity } = req.query;
  let q = `SELECT pa.*, ct.name as crop_name, u.name as issued_by_name
    FROM pest_alerts pa
    LEFT JOIN crop_types ct ON pa.crop_type_id = ct.id
    LEFT JOIN users u ON pa.issued_by = u.id
    WHERE pa.active = 1`;
  const params = [];
  if (parish) { q += ' AND (pa.parish = ? OR pa.parish IS NULL)'; params.push(parish); }
  if (severity) { q += ' AND pa.severity = ?'; params.push(severity); }
  q += ' ORDER BY pa.created_at DESC';
  res.json(db.prepare(q).all(...params));
});

// GET /api/alerts/all — admin/officer: all alerts including inactive
router.get('/all', auth, requireRole('admin','extension_officer'), (req, res) => {
  res.json(db.prepare(`SELECT pa.*, ct.name as crop_name, u.name as issued_by_name
    FROM pest_alerts pa
    LEFT JOIN crop_types ct ON pa.crop_type_id = ct.id
    LEFT JOIN users u ON pa.issued_by = u.id
    ORDER BY pa.created_at DESC`).all());
});

// POST /api/alerts — admin or extension_officer issues alert
router.post('/', auth, requireRole('admin','extension_officer'), (req, res) => {
  const { parish, crop_type_id, alert_type, severity, title, message, affected_crops, recommended_action, valid_from, valid_until } = req.body;
  if (!alert_type || !severity || !title || !message) return res.status(400).json({ error: 'alert_type, severity, title and message are required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO pest_alerts
    (id,parish,crop_type_id,alert_type,severity,title,message,affected_crops,recommended_action,issued_by,valid_from,valid_until)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, parish||null, crop_type_id||null, alert_type, severity, title, message, affected_crops||null, recommended_action||null, req.user.id, valid_from||null, valid_until||null);
  res.status(201).json({ id });
});

// PATCH /api/alerts/:id — update or deactivate
router.patch('/:id', auth, requireRole('admin','extension_officer'), (req, res) => {
  const { active, title, message, recommended_action, valid_until } = req.body;
  const alert = db.prepare('SELECT * FROM pest_alerts WHERE id=?').get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  db.prepare(`UPDATE pest_alerts SET active=?,title=?,message=?,recommended_action=?,valid_until=? WHERE id=?`)
    .run(active !== undefined ? active : alert.active, title||alert.title, message||alert.message,
      recommended_action||alert.recommended_action, valid_until||alert.valid_until, req.params.id);
  res.json({ success: true });
});

module.exports = router;
