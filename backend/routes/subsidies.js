const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/subsidies — public: list active programs
router.get('/', (req, res) => {
  res.json(db.prepare(`SELECT s.*, u.name as created_by_name,
    (SELECT COUNT(*) FROM subsidy_applications sa WHERE sa.subsidy_id=s.id) as applicant_count
    FROM subsidies s LEFT JOIN users u ON s.created_by=u.id
    WHERE s.active=1 ORDER BY s.created_at DESC`).all());
});

// GET /api/subsidies/my — farmer: my applications
router.get('/my', auth, requireRole('farmer'), (req, res) => {
  res.json(db.prepare(`SELECT sa.*, s.title as program_title, s.subsidy_type, s.amount_jmd,
    u.name as reviewed_by_name
    FROM subsidy_applications sa
    JOIN subsidies s ON sa.subsidy_id=s.id
    LEFT JOIN users u ON sa.reviewed_by=u.id
    WHERE sa.farmer_id=?
    ORDER BY sa.created_at DESC`).all(req.user.id));
});

// POST /api/subsidies/:id/apply — farmer applies
router.post('/:id/apply', auth, requireRole('farmer'), (req, res) => {
  const sub = db.prepare('SELECT * FROM subsidies WHERE id=? AND active=1').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Program not found or closed' });
  const existing = db.prepare('SELECT id FROM subsidy_applications WHERE subsidy_id=? AND farmer_id=?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'You have already applied to this program' });
  const { justification, farm_id } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO subsidy_applications (id,subsidy_id,farmer_id,farm_id,justification) VALUES (?,?,?,?,?)')
    .run(id, req.params.id, req.user.id, farm_id||null, justification||null);
  res.status(201).json({ id });
});

// GET /api/subsidies/applications — admin/officer: all applications
router.get('/applications', auth, requireRole('admin','extension_officer'), (req, res) => {
  const { status, subsidy_id } = req.query;
  let q = `SELECT sa.*, s.title as program_title, s.subsidy_type, s.amount_jmd,
    u.name as farmer_name, u.email as farmer_email, u.parish as farmer_parish, u.rada_id,
    r.name as reviewed_by_name
    FROM subsidy_applications sa
    JOIN subsidies s ON sa.subsidy_id=s.id
    JOIN users u ON sa.farmer_id=u.id
    LEFT JOIN users r ON sa.reviewed_by=r.id
    WHERE 1=1`;
  const params = [];
  if (status) { q += ' AND sa.status=?'; params.push(status); }
  if (subsidy_id) { q += ' AND sa.subsidy_id=?'; params.push(subsidy_id); }
  q += ' ORDER BY sa.created_at DESC';
  res.json(db.prepare(q).all(...params));
});

// PATCH /api/subsidies/applications/:id — admin/officer: review
router.patch('/applications/:id', auth, requireRole('admin','extension_officer'), (req, res) => {
  const { status, review_notes } = req.body;
  const app = db.prepare('SELECT * FROM subsidy_applications WHERE id=?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  const now = new Date().toISOString();
  db.prepare(`UPDATE subsidy_applications SET status=?,review_notes=?,reviewed_by=?,reviewed_at=?,disbursed_at=? WHERE id=?`)
    .run(status||app.status, review_notes||app.review_notes, req.user.id, now,
      status==='disbursed' ? now : app.disbursed_at, req.params.id);
  res.json({ success: true });
});

// POST /api/subsidies — admin: create program
router.post('/', auth, requireRole('admin'), (req, res) => {
  const { title, description, subsidy_type, amount_jmd, eligibility, application_deadline, program_start, program_end, max_applicants } = req.body;
  if (!title || !description || !subsidy_type) return res.status(400).json({ error: 'title, description, subsidy_type required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO subsidies (id,title,description,subsidy_type,amount_jmd,eligibility,application_deadline,program_start,program_end,max_applicants,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, title, description, subsidy_type, amount_jmd||null, eligibility||null, application_deadline||null, program_start||null, program_end||null, max_applicants||null, req.user.id);
  res.status(201).json({ id });
});

// PATCH /api/subsidies/:id — admin: update/close
router.patch('/:id', auth, requireRole('admin'), (req, res) => {
  const { active, title, description } = req.body;
  const sub = db.prepare('SELECT * FROM subsidies WHERE id=?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Program not found' });
  db.prepare('UPDATE subsidies SET active=?,title=?,description=? WHERE id=?')
    .run(active !== undefined ? active : sub.active, title||sub.title, description||sub.description, req.params.id);
  res.json({ success: true });
});

module.exports = router;
