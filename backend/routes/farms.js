const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/my', auth, requireRole('farmer'), (req, res) => {
  res.json(db.prepare('SELECT * FROM farms WHERE farmer_id=? ORDER BY created_at DESC').all(req.user.id));
});

router.post('/', auth, requireRole('farmer'), (req, res) => {
  const { name, parish, district, size_acres, description, lat, lng } = req.body;
  if (!name || !parish) return res.status(400).json({ error: 'name and parish required' });
  const id = uuidv4();
  db.prepare('INSERT INTO farms (id,farmer_id,name,parish,district,size_acres,description,lat,lng) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, req.user.id, name, parish, district||null, size_acres||null, description||null, lat||null, lng||null);
  res.status(201).json({ id });
});

router.patch('/:id', auth, requireRole('farmer'), (req, res) => {
  const farm = db.prepare('SELECT * FROM farms WHERE id=? AND farmer_id=?').get(req.params.id, req.user.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });
  const { name, parish, district, size_acres, description } = req.body;
  db.prepare('UPDATE farms SET name=?,parish=?,district=?,size_acres=?,description=? WHERE id=?')
    .run(name||farm.name, parish||farm.parish, district||farm.district, size_acres||farm.size_acres, description||farm.description, req.params.id);
  res.json({ success: true });
});

module.exports = router;
