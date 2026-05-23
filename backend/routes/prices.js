const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/prices — current prices for all crops
router.get('/', (req, res) => {
  const { crop_type_id, parish, days = 7 } = req.query;
  const since = new Date(); since.setDate(since.getDate() - Number(days));
  const sinceStr = since.toISOString().split('T')[0];
  let query = `SELECT mp.*, ct.name as crop_name, ct.category, ct.unit as crop_unit
    FROM market_prices mp JOIN crop_types ct ON mp.crop_type_id=ct.id
    WHERE mp.recorded_date >= ?`;
  const params = [sinceStr];
  if (crop_type_id) { query += ' AND mp.crop_type_id=?'; params.push(crop_type_id); }
  if (parish)       { query += ' AND mp.parish=?';       params.push(parish); }
  query += ' ORDER BY mp.recorded_date DESC, ct.name ASC';
  res.json(db.prepare(query).all(...params));
});

// GET /api/prices/latest — one price per crop (most recent)
router.get('/latest', (req, res) => {
  const prices = db.prepare(`SELECT ct.id as crop_type_id, ct.name as crop_name, ct.category, ct.unit,
    mp.price_per_unit, mp.recorded_date
    FROM crop_types ct LEFT JOIN market_prices mp ON ct.id=mp.crop_type_id
    WHERE mp.id = (SELECT id FROM market_prices WHERE crop_type_id=ct.id ORDER BY recorded_date DESC LIMIT 1)
    ORDER BY ct.category, ct.name`).all();
  res.json(prices);
});

// POST /api/prices — admin records new price
router.post('/', auth, requireRole('admin'), (req, res) => {
  const { crop_type_id, price_per_unit, unit, parish, recorded_date } = req.body;
  if (!crop_type_id || !price_per_unit) return res.status(400).json({ error: 'crop_type_id and price_per_unit required' });
  db.prepare('INSERT INTO market_prices (id,crop_type_id,price_per_unit,unit,parish,recorded_date) VALUES (?,?,?,?,?,?)')
    .run(uuidv4(), crop_type_id, price_per_unit, unit||'lb', parish||'Kingston', recorded_date||new Date().toISOString().split('T')[0]);
  res.status(201).json({ success: true });
});

module.exports = router;
