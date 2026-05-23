const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth } = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'agrojm-dev-secret';

router.post('/register', (req, res) => {
  const { name, email, password, role, phone, parish, business_name, buyer_type } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing required fields' });
  if (!['farmer','buyer','driver'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id,name,email,password,role,phone,parish,business_name,buyer_type) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, name, email.toLowerCase(), hash, role, phone||null, parish||null, business_name||null, buyer_type||null);

  const token = jwt.sign({ id, name, email: email.toLowerCase(), role }, SECRET, { expiresIn: '8h' });
  res.status(201).json({ token, user: { id, name, email, role, parish, business_name, buyer_type } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, parish: user.parish, business_name: user.business_name, buyer_type: user.buyer_type } });
});

router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,phone,parish,business_name,buyer_type,verified,created_at FROM users WHERE id=?').get(req.user.id);
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

module.exports = router;
