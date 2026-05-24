const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/farms — farmer's own farms OR all farms for admin/officer
router.get('/', auth, (req, res) => {
  if (req.user.role === 'farmer') {
    return res.json(db.prepare('SELECT * FROM farms WHERE farmer_id=? ORDER BY created_at DESC').all(req.user.id));
  }
  if (['admin','extension_officer'].includes(req.user.role)) {
    return res.json(db.prepare(`SELECT f.*, u.name as farmer_name, u.rada_id, u.verification_status FROM farms f
      JOIN users u ON f.farmer_id=u.id ORDER BY f.created_at DESC`).all());
  }
  res.status(403).json({ error: 'Forbidden' });
});

router.get('/my', auth, requireRole('farmer'), (req, res) => {
  res.json(db.prepare('SELECT * FROM farms WHERE farmer_id=? ORDER BY created_at DESC').all(req.user.id));
});

router.post('/', auth, requireRole('farmer'), (req, res) => {
  const { name, parish, district, size_acres, land_tenure, irrigation, soil_type, description, lat, lng } = req.body;
  if (!name || !parish) return res.status(400).json({ error: 'name and parish required' });
  const id = uuidv4();
  db.prepare('INSERT INTO farms (id,farmer_id,name,parish,district,size_acres,land_tenure,irrigation,soil_type,description,lat,lng) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, req.user.id, name, parish, district||null, size_acres||null, land_tenure||null, irrigation||null, soil_type||null, description||null, lat||null, lng||null);
  res.status(201).json({ id });
});

router.patch('/:id', auth, requireRole('farmer'), (req, res) => {
  const farm = db.prepare('SELECT * FROM farms WHERE id=? AND farmer_id=?').get(req.params.id, req.user.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });
  const { name, parish, district, size_acres, land_tenure, irrigation, soil_type, description } = req.body;
  db.prepare('UPDATE farms SET name=?,parish=?,district=?,size_acres=?,land_tenure=?,irrigation=?,soil_type=?,description=? WHERE id=?')
    .run(name||farm.name, parish||farm.parish, district||farm.district, size_acres||farm.size_acres,
      land_tenure||farm.land_tenure, irrigation||farm.irrigation, soil_type||farm.soil_type, description||farm.description, req.params.id);
  res.json({ success: true });
});

module.exports = router;
