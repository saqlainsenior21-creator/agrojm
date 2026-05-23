const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/listings — public browse
router.get('/', (req, res) => {
  const { parish, crop_type_id, category, search, limit = 50, offset = 0 } = req.query;
  let query = `SELECT l.*, u.name as farmer_name, u.parish as farmer_parish, u.phone as farmer_phone,
    ct.name as crop_name, ct.category, ct.unit as crop_unit
    FROM listings l
    JOIN users u ON l.farmer_id = u.id
    JOIN crop_types ct ON l.crop_type_id = ct.id
    WHERE l.status = 'active'`;
  const params = [];
  if (parish)       { query += ' AND l.parish=?';          params.push(parish); }
  if (crop_type_id) { query += ' AND l.crop_type_id=?';    params.push(crop_type_id); }
  if (category)     { query += ' AND ct.category=?';        params.push(category); }
  if (search)       { query += ' AND (ct.name LIKE ? OR l.title LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  res.json(db.prepare(query).all(...params));
});

// GET /api/listings/:id
router.get('/:id', (req, res) => {
  const listing = db.prepare(`SELECT l.*, u.name as farmer_name, u.phone as farmer_phone, u.parish as farmer_parish,
    ct.name as crop_name, ct.category FROM listings l
    JOIN users u ON l.farmer_id=u.id JOIN crop_types ct ON l.crop_type_id=ct.id WHERE l.id=?`).get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json(listing);
});

// POST /api/listings — farmer creates listing
router.post('/', auth, requireRole('farmer', 'admin'), (req, res) => {
  const { farm_id, crop_type_id, title, description, quantity_available, unit, price_per_unit, parish, harvest_date, available_from, available_until } = req.body;
  if (!crop_type_id || !title || !quantity_available || !price_per_unit || !parish) return res.status(400).json({ error: 'Missing required fields' });
  const id = uuidv4();
  db.prepare(`INSERT INTO listings (id,farmer_id,farm_id,crop_type_id,title,description,quantity_available,unit,price_per_unit,parish,harvest_date,available_from,available_until)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, req.user.id, farm_id||null, crop_type_id, title, description||null, quantity_available, unit||'lb', price_per_unit, parish, harvest_date||null, available_from||null, available_until||null);
  res.status(201).json({ id, message: 'Listing created' });
});

// PATCH /api/listings/:id
router.patch('/:id', auth, requireRole('farmer','admin'), (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id=?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && listing.farmer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const fields = ['title','description','quantity_available','price_per_unit','status','harvest_date','available_until'];
  const updates = []; const vals = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); } });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  updates.push('updated_at=datetime(\'now\')');
  db.prepare(`UPDATE listings SET ${updates.join(',')} WHERE id=?`).run(...vals, req.params.id);
  res.json({ success: true });
});

// DELETE /api/listings/:id
router.delete('/:id', auth, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id=?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && listing.farmer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare("UPDATE listings SET status='expired' WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// GET /api/listings/my/all — farmer's own listings
router.get('/my/all', auth, requireRole('farmer'), (req, res) => {
  const listings = db.prepare(`SELECT l.*, ct.name as crop_name, ct.category FROM listings l
    JOIN crop_types ct ON l.crop_type_id=ct.id WHERE l.farmer_id=? ORDER BY l.created_at DESC`).all(req.user.id);
  res.json(listings);
});

module.exports = router;
