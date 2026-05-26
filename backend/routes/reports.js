const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/reports/ministry — public ministry statistics portal
router.get('/ministry', (req, res) => {
  const totalFarmers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='farmer' AND active=1").get().c;
  const verifiedFarmers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='farmer' AND verification_status='verified'").get().c;
  const totalBuyers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='buyer' AND active=1").get().c;
  const totalFarms = db.prepare("SELECT COUNT(*) as c FROM farms").get().c;
  const totalListings = db.prepare("SELECT COUNT(*) as c FROM listings WHERE status='active'").get().c;
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const tradeValue = db.prepare("SELECT COALESCE(SUM(total_amount),0) as v FROM orders WHERE status IN ('confirmed','delivered','completed') OR payment_status='paid'").get().v;
  const totalCerts = db.prepare("SELECT COUNT(*) as c FROM certifications WHERE status='active'").get().c;
  const activeAlerts = db.prepare("SELECT COUNT(*) as c FROM pest_alerts WHERE active=1").get().c;

  const farmersByParish = db.prepare(`SELECT parish, COUNT(*) as count FROM users
    WHERE role='farmer' AND active=1 AND parish IS NOT NULL GROUP BY parish ORDER BY count DESC`).all();

  const productionByCategory = db.prepare(`SELECT ct.category, COUNT(DISTINCT l.farmer_id) as farmers,
    SUM(l.quantity_available) as total_quantity, COUNT(*) as listings
    FROM listings l JOIN crop_types ct ON l.crop_type_id=ct.id
    WHERE l.status='active' GROUP BY ct.category ORDER BY listings DESC`).all();

  const topCrops = db.prepare(`SELECT ct.name, ct.category, COUNT(*) as listings,
    SUM(l.quantity_available) as total_qty, AVG(l.price_per_unit) as avg_price
    FROM listings l JOIN crop_types ct ON l.crop_type_id=ct.id
    WHERE l.status='active' GROUP BY ct.name ORDER BY listings DESC LIMIT 10`).all();

  const buyerTypes = db.prepare(`SELECT buyer_type, COUNT(*) as count FROM users
    WHERE role='buyer' AND active=1 AND buyer_type IS NOT NULL GROUP BY buyer_type ORDER BY count DESC`).all();

  const monthlyOrders = db.prepare(`SELECT strftime('%Y-%m', created_at) as month,
    COUNT(*) as orders, SUM(total_amount) as revenue
    FROM orders WHERE created_at >= date('now', '-6 months')
    GROUP BY month ORDER BY month`).all();

  const subsidyStats = db.prepare(`SELECT subsidy_type, COUNT(DISTINCT s.id) as programs,
    COUNT(sa.id) as applications, SUM(CASE WHEN sa.status='approved' OR sa.status='disbursed' THEN 1 ELSE 0 END) as approved
    FROM subsidies s LEFT JOIN subsidy_applications sa ON s.id=sa.subsidy_id
    WHERE s.active=1 GROUP BY s.subsidy_type`).all();

  const certsByType = db.prepare(`SELECT cert_type, COUNT(*) as count, status FROM certifications
    GROUP BY cert_type, status ORDER BY count DESC`).all();

  res.json({
    summary: { totalFarmers, verifiedFarmers, totalBuyers, totalFarms, totalListings, totalOrders, tradeValue, totalCerts, activeAlerts },
    farmersByParish,
    productionByCategory,
    topCrops,
    buyerTypes,
    monthlyOrders,
    subsidyStats,
    certsByType
  });
});

// GET /api/reports/csv/farmers — CSV export of farmer registry
router.get('/csv/farmers', auth, requireRole('admin','extension_officer'), (req, res) => {
  const farmers = db.prepare(`SELECT u.name, u.email, u.phone, u.parish, u.rada_id, u.national_id,
    u.verification_status, u.verified, u.created_at,
    (SELECT COUNT(*) FROM farms f WHERE f.farmer_id=u.id) as farms,
    (SELECT COALESCE(SUM(f2.size_acres),0) FROM farms f2 WHERE f2.farmer_id=u.id) as total_acres,
    (SELECT COUNT(*) FROM listings l WHERE l.farmer_id=u.id AND l.status='active') as active_listings,
    (SELECT COUNT(*) FROM certifications c WHERE c.farmer_id=u.id AND c.status='active') as certifications
    FROM users u WHERE u.role='farmer' AND u.active=1 ORDER BY u.parish, u.name`).all();

  const headers = ['Name','Email','Phone','Parish','RADA ID','National ID','Verification','Verified','Registered','Farms','Total Acres','Active Listings','Certifications'];
  const rows = farmers.map(f => [
    f.name, f.email, f.phone||'', f.parish||'', f.rada_id||'', f.national_id||'',
    f.verification_status||'pending', f.verified?'Yes':'No', f.created_at?.split('T')[0]||'',
    f.farms, f.total_acres||0, f.active_listings, f.certifications
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="agrojm_farmers_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

// GET /api/reports/csv/listings — CSV export of market listings
router.get('/csv/listings', auth, requireRole('admin','extension_officer'), (req, res) => {
  const listings = db.prepare(`SELECT l.title, ct.name as crop, ct.category, l.quantity_available, l.unit,
    l.price_per_unit, l.parish, l.status, l.harvest_date, l.created_at,
    u.name as farmer, u.rada_id, u.parish as farmer_parish
    FROM listings l JOIN crop_types ct ON l.crop_type_id=ct.id JOIN users u ON l.farmer_id=u.id
    ORDER BY l.created_at DESC LIMIT 2000`).all();

  const headers = ['Title','Crop','Category','Quantity','Unit','Price (J$)','Parish','Status','Harvest Date','Listed Date','Farmer','RADA ID'];
  const rows = listings.map(l => [
    l.title, l.crop, l.category, l.quantity_available, l.unit, l.price_per_unit,
    l.parish, l.status, l.harvest_date||'', l.created_at?.split('T')[0]||'', l.farmer, l.rada_id||''
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="agrojm_listings_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

// GET /api/reports/csv/orders — CSV export of trade orders
router.get('/csv/orders', auth, requireRole('admin'), (req, res) => {
  const orders = db.prepare(`SELECT o.created_at, l.title as crop, ct.name as crop_type,
    o.quantity, o.unit, o.unit_price, o.total_amount, o.status, o.payment_status,
    buyer.name as buyer, buyer.buyer_type, buyer.parish as buyer_parish,
    farmer.name as farmer, farmer.parish as farmer_parish, farmer.rada_id
    FROM orders o
    JOIN listings l ON o.listing_id=l.id JOIN crop_types ct ON l.crop_type_id=ct.id
    JOIN users buyer ON o.buyer_id=buyer.id JOIN users farmer ON o.farmer_id=farmer.id
    ORDER BY o.created_at DESC LIMIT 5000`).all();

  const headers = ['Date','Crop','Category','Qty','Unit','Unit Price (J$)','Total (J$)','Status','Payment','Buyer','Buyer Type','Buyer Parish','Farmer','Farmer Parish','RADA ID'];
  const rows = orders.map(o => [
    o.created_at?.split('T')[0]||'', o.crop, o.crop_type, o.quantity, o.unit,
    o.unit_price, o.total_amount, o.status, o.payment_status,
    o.buyer, o.buyer_type||'', o.buyer_parish||'', o.farmer, o.farmer_parish||'', o.rada_id||''
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="agrojm_orders_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

// GET /api/reports/csv/prices — price history CSV
router.get('/csv/prices', (req, res) => {
  const prices = db.prepare(`SELECT ct.name as crop, ct.category, mp.price_per_unit, mp.unit,
    mp.parish, mp.source, mp.recorded_date
    FROM market_prices mp JOIN crop_types ct ON mp.crop_type_id=ct.id
    ORDER BY mp.recorded_date DESC, ct.name LIMIT 10000`).all();

  const headers = ['Crop','Category','Price (J$)','Unit','Parish','Source','Date'];
  const rows = prices.map(p => [p.crop, p.category, p.price_per_unit, p.unit, p.parish||'National', p.source, p.recorded_date]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="agrojm_prices_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

module.exports = router;
