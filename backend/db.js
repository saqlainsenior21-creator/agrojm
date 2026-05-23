const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'agrojm.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- Users: admin, farmer, buyer, driver
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','farmer','buyer','driver')),
    phone TEXT,
    parish TEXT,
    business_name TEXT,
    buyer_type TEXT CHECK(buyer_type IN ('hotel','supermarket','exporter','restaurant','individual')),
    verified INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Farms
  CREATE TABLE IF NOT EXISTS farms (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    parish TEXT NOT NULL,
    district TEXT,
    lat REAL,
    lng REAL,
    size_acres REAL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Crop types (master list)
  CREATE TABLE IF NOT EXISTS crop_types (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('vegetable','fruit','root','herb','grain','livestock')),
    unit TEXT NOT NULL DEFAULT 'lb',
    image_url TEXT
  );

  -- Crop listings (what farmers have available NOW)
  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES users(id),
    farm_id TEXT REFERENCES farms(id),
    crop_type_id TEXT NOT NULL REFERENCES crop_types(id),
    title TEXT NOT NULL,
    description TEXT,
    quantity_available REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'lb',
    price_per_unit REAL NOT NULL,
    currency TEXT DEFAULT 'JMD',
    parish TEXT NOT NULL,
    harvest_date TEXT,
    available_from TEXT,
    available_until TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','sold_out','expired','draft')),
    images TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Crop tracking (farmer logs growth stages)
  CREATE TABLE IF NOT EXISTS crop_logs (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES users(id),
    farm_id TEXT REFERENCES farms(id),
    crop_type_id TEXT NOT NULL REFERENCES crop_types(id),
    stage TEXT NOT NULL CHECK(stage IN ('planted','growing','flowering','harvesting','harvested')),
    planting_date TEXT,
    expected_harvest TEXT,
    actual_harvest TEXT,
    quantity_planted REAL,
    quantity_harvested REAL,
    unit TEXT DEFAULT 'lb',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Orders
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL REFERENCES users(id),
    listing_id TEXT NOT NULL REFERENCES listings(id),
    farmer_id TEXT NOT NULL REFERENCES users(id),
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    unit_price REAL NOT NULL,
    total_amount REAL NOT NULL,
    currency TEXT DEFAULT 'JMD',
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','paid','ready','in_delivery','delivered','cancelled')),
    delivery_address TEXT,
    delivery_date TEXT,
    notes TEXT,
    payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid','refunded')),
    payment_ref TEXT,
    driver_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Market prices (historical + current)
  CREATE TABLE IF NOT EXISTS market_prices (
    id TEXT PRIMARY KEY,
    crop_type_id TEXT NOT NULL REFERENCES crop_types(id),
    price_per_unit REAL NOT NULL,
    unit TEXT NOT NULL,
    currency TEXT DEFAULT 'JMD',
    parish TEXT,
    source TEXT DEFAULT 'market',
    recorded_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Weather alerts
  CREATE TABLE IF NOT EXISTS weather_alerts (
    id TEXT PRIMARY KEY,
    parish TEXT,
    alert_type TEXT NOT NULL CHECK(alert_type IN ('rain','drought','hurricane','flood','frost','advisory')),
    severity TEXT DEFAULT 'moderate' CHECK(severity IN ('low','moderate','high','extreme')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    valid_from TEXT,
    valid_until TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Delivery tracking
  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id),
    driver_id TEXT REFERENCES users(id),
    pickup_address TEXT,
    delivery_address TEXT NOT NULL,
    pickup_time TEXT,
    delivery_time TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','assigned','picked_up','in_transit','delivered','failed')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_listings_farmer ON listings(farmer_id);
  CREATE INDEX IF NOT EXISTS idx_listings_crop ON listings(crop_type_id);
  CREATE INDEX IF NOT EXISTS idx_listings_parish ON listings(parish);
  CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
  CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
  CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);
  CREATE INDEX IF NOT EXISTS idx_prices_crop ON market_prices(crop_type_id);
  CREATE INDEX IF NOT EXISTS idx_prices_date ON market_prices(recorded_date);
`);

// Seed admin + crop types + sample data
function seed() {
  const existing = db.prepare("SELECT id FROM users WHERE role='admin'").get();
  if (existing) return;

  // Admin
  const adminHash = bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD || 'Admin2026!', 10);
  db.prepare("INSERT INTO users (id,name,email,password,role,verified) VALUES (?,?,?,?,?,1)")
    .run(uuidv4(), 'AgroJM Admin', process.env.SEED_ADMIN_EMAIL || 'admin@agrojm.com', adminHash, 'admin');

  // Crop types
  const crops = [
    ['Yam', 'root', 'lb'], ['Sweet Potato', 'root', 'lb'], ['Cassava', 'root', 'lb'],
    ['Callaloo', 'vegetable', 'lb'], ['Pak Choi', 'vegetable', 'lb'], ['Cabbage', 'vegetable', 'lb'],
    ['Tomato', 'vegetable', 'lb'], ['Scotch Bonnet Pepper', 'vegetable', 'lb'], ['Sweet Pepper', 'vegetable', 'lb'],
    ['Banana', 'fruit', 'bunch'], ['Plantain', 'fruit', 'bunch'], ['Mango', 'fruit', 'lb'],
    ['Breadfruit', 'fruit', 'lb'], ['Ackee', 'fruit', 'lb'], ['Coconut', 'fruit', 'unit'],
    ['Pumpkin', 'vegetable', 'lb'], ['Corn', 'grain', 'ear'], ['Gungo Peas', 'grain', 'lb'],
    ['Thyme', 'herb', 'oz'], ['Escallion', 'herb', 'bunch'], ['Ginger', 'root', 'lb'],
    ['Turmeric', 'root', 'lb'], ['Coffee', 'grain', 'lb'], ['Cocoa', 'grain', 'lb'],
  ];

  const insertCrop = db.prepare("INSERT OR IGNORE INTO crop_types (id,name,category,unit) VALUES (?,?,?,?)");
  crops.forEach(([name, cat, unit]) => insertCrop.run(uuidv4(), name, cat, unit));

  // Sample market prices (last 7 days)
  const cropRows = db.prepare("SELECT id, name FROM crop_types").all();
  const prices = { 'Yam': 180, 'Sweet Potato': 120, 'Callaloo': 80, 'Tomato': 200, 'Scotch Bonnet Pepper': 350,
    'Banana': 250, 'Plantain': 300, 'Mango': 150, 'Ackee': 400, 'Ginger': 500,
    'Cabbage': 100, 'Pumpkin': 90, 'Escallion': 60, 'Thyme': 40, 'Cassava': 130 };

  const insertPrice = db.prepare("INSERT INTO market_prices (id,crop_type_id,price_per_unit,unit,parish,recorded_date) VALUES (?,?,?,?,?,?)");
  for (let d = 6; d >= 0; d--) {
    const date = new Date(); date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    cropRows.forEach(crop => {
      const base = prices[crop.name] || 150;
      const variation = base * (0.9 + Math.random() * 0.2);
      insertPrice.run(uuidv4(), crop.id, Math.round(variation), 'lb', 'Kingston', dateStr);
    });
  }

  console.log('✅ AgroJM seeded');
}

seed();
module.exports = db;
