const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth } = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'agrojm-dev-secret';

router.post('/register', (req, res) => {
  const { name, email, password, role, phone, parish, business_name, buyer_type, rada_id, national_id } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing required fields' });
  if (!['farmer','buyer','driver'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare(`INSERT INTO users (id,name,email,password,role,phone,parish,business_name,buyer_type,rada_id,national_id,verification_status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, name, email.toLowerCase(), hash, role, phone||null, parish||null,
      business_name||null, buyer_type||null, rada_id||null, national_id||null, 'pending');

  const token = jwt.sign({ id, name, email: email.toLowerCase(), role }, SECRET, { expiresIn: '8h' });
  res.status(201).json({ token, user: { id, name, email, role, parish, business_name, buyer_type, rada_id } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, extension_parish: user.extension_parish }, SECRET, { expiresIn: '8h' });
  res.json({ token, user: {
    id: user.id, name: user.name, email: user.email, role: user.role,
    parish: user.parish, business_name: user.business_name, buyer_type: user.buyer_type,
    rada_id: user.rada_id, verification_status: user.verification_status,
    extension_parish: user.extension_parish
  }});
});

router.get('/me', auth, (req, res) => {
  const user = db.prepare(`SELECT id,name,email,role,phone,parish,business_name,buyer_type,
    rada_id,national_id,verification_status,verified,extension_parish,created_at FROM users WHERE id=?`).get(req.user.id);
  res.json(user);
});

router.post('/change-password', auth, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password)) return res.status(401).json({ error: 'Current password incorrect' });
  db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(new_password, 10), req.user.id);
  res.json({ success: true });
});

// POST /api/auth/verify-rada — farmer self-verifies using RADA ID
router.post('/verify-rada', auth, (req, res) => {
  const { rada_id } = req.body;
  if (!rada_id || !rada_id.trim().toUpperCase().startsWith('RADA-') || rada_id.trim().length < 8)
    return res.status(400).json({ error: 'Valid RADA ID required (format: RADA-YYYY-XXXXX)' });

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (user.role !== 'farmer') return res.status(403).json({ error: 'Only farmers can self-verify' });
  if (user.verification_status === 'verified') return res.status(400).json({ error: 'Already verified' });

  // If farmer registered with a RADA ID, submitted ID must match
  if (user.rada_id && user.rada_id.toLowerCase() !== rada_id.trim().toLowerCase())
    return res.status(400).json({ error: 'RADA ID does not match your registered ID. Contact your local extension officer.' });

  const cleanId = rada_id.trim().toUpperCase();
  db.prepare("UPDATE users SET rada_id=?, verification_status='verified', verified=1 WHERE id=?")
    .run(cleanId, req.user.id);

  const updated = db.prepare(`SELECT id,name,email,role,phone,parish,business_name,buyer_type,
    rada_id,national_id,verification_status,verified,extension_parish FROM users WHERE id=?`).get(req.user.id);
  const token = jwt.sign({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, extension_parish: updated.extension_parish }, SECRET, { expiresIn: '8h' });
  res.json({ token, user: updated });
});

// PATCH /api/auth/profile — update own profile (RADA ID, NIN, phone, parish)
router.patch('/profile', auth, (req, res) => {
  const { phone, parish, rada_id, national_id, business_name } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  db.prepare('UPDATE users SET phone=?,parish=?,rada_id=?,national_id=?,business_name=? WHERE id=?')
    .run(phone||user.phone, parish||user.parish, rada_id||user.rada_id, national_id||user.national_id, business_name||user.business_name, req.user.id);
  res.json({ success: true });
});

module.exports = router;
