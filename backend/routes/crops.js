const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/crops/types — all crop types
router.get('/types', (req, res) => {
  res.json(db.prepare('SELECT * FROM crop_types ORDER BY category, name').all());
});

// GET /api/crops/logs — farmer's crop logs
router.get('/logs', auth, requireRole('farmer'), (req, res) => {
  res.json(db.prepare(`SELECT cl.*, ct.name as crop_name, ct.category, f.name as farm_name
    FROM crop_logs cl JOIN crop_types ct ON cl.crop_type_id=ct.id LEFT JOIN farms f ON cl.farm_id=f.id
    WHERE cl.farmer_id=? ORDER BY cl.created_at DESC`).all(req.user.id));
});

// POST /api/crops/logs — farmer logs a crop
router.post('/logs', auth, requireRole('farmer'), (req, res) => {
  const { farm_id, crop_type_id, stage, planting_date, expected_harvest, quantity_planted, unit, notes } = req.body;
  if (!crop_type_id || !stage) return res.status(400).json({ error: 'crop_type_id and stage required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO crop_logs (id,farmer_id,farm_id,crop_type_id,stage,planting_date,expected_harvest,quantity_planted,unit,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, req.user.id, farm_id||null, crop_type_id, stage, planting_date||null, expected_harvest||null, quantity_planted||null, unit||'lb', notes||null);
  res.status(201).json({ id });
});

// PATCH /api/crops/logs/:id — update stage
router.patch('/logs/:id', auth, requireRole('farmer'), (req, res) => {
  const log = db.prepare('SELECT * FROM crop_logs WHERE id=? AND farmer_id=?').get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  const { stage, actual_harvest, quantity_harvested, notes } = req.body;
  db.prepare("UPDATE crop_logs SET stage=?,actual_harvest=?,quantity_harvested=?,notes=?,updated_at=datetime('now') WHERE id=?")
    .run(stage||log.stage, actual_harvest||log.actual_harvest, quantity_harvested||log.quantity_harvested, notes||log.notes, req.params.id);
  res.json({ success: true });
});

module.exports = router;
