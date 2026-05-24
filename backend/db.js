const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'agrojm.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- Users: admin, farmer, buyer, driver, extension_officer
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','farmer','buyer','driver','extension_officer')),
    phone TEXT,
    parish TEXT,
    business_name TEXT,
    buyer_type TEXT CHECK(buyer_type IN ('hotel','supermarket','exporter','restaurant','individual')),
    rada_id TEXT,
    national_id TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','rejected')),
    verified_by TEXT,
    verified_at TEXT,
    extension_parish TEXT,
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
    land_tenure TEXT CHECK(land_tenure IN ('owned','leased','family_land','sharecropped','government_lease')),
    irrigation TEXT CHECK(irrigation IN ('none','drip','sprinkler','flood','rainfall_only')),
    soil_type TEXT,
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

  -- Crop listings
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

  -- Crop tracking
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

  -- Market prices
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

  -- Pest & Disease Alerts (Ministry-issued)
  CREATE TABLE IF NOT EXISTS pest_alerts (
    id TEXT PRIMARY KEY,
    parish TEXT,
    crop_type_id TEXT REFERENCES crop_types(id),
    alert_type TEXT NOT NULL CHECK(alert_type IN ('pest','disease','blight','infestation','advisory','quarantine')),
    severity TEXT DEFAULT 'moderate' CHECK(severity IN ('watch','warning','emergency')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    affected_crops TEXT,
    recommended_action TEXT,
    issued_by TEXT REFERENCES users(id),
    valid_from TEXT,
    valid_until TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Farm Certifications
  CREATE TABLE IF NOT EXISTS certifications (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES users(id),
    farm_id TEXT REFERENCES farms(id),
    cert_type TEXT NOT NULL CHECK(cert_type IN ('GAP','organic','GlobalGAP','HACCP','ISO22000','RADA_approved','fair_trade')),
    cert_number TEXT,
    issued_by TEXT,
    issued_date TEXT,
    expiry_date TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','pending','revoked')),
    verified_by TEXT REFERENCES users(id),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Government Subsidy Programs
  CREATE TABLE IF NOT EXISTS subsidies (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'Ministry of Agriculture',
    subsidy_type TEXT NOT NULL CHECK(subsidy_type IN ('seed','fertilizer','equipment','loan','training','insurance','land','other')),
    amount_jmd REAL,
    eligibility TEXT,
    application_deadline TEXT,
    program_start TEXT,
    program_end TEXT,
    max_applicants INTEGER,
    current_applicants INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Subsidy Applications
  CREATE TABLE IF NOT EXISTS subsidy_applications (
    id TEXT PRIMARY KEY,
    subsidy_id TEXT NOT NULL REFERENCES subsidies(id),
    farmer_id TEXT NOT NULL REFERENCES users(id),
    farm_id TEXT REFERENCES farms(id),
    status TEXT DEFAULT 'applied' CHECK(status IN ('applied','under_review','approved','rejected','disbursed')),
    justification TEXT,
    reviewed_by TEXT REFERENCES users(id),
    reviewed_at TEXT,
    review_notes TEXT,
    disbursed_at TEXT,
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
  CREATE INDEX IF NOT EXISTS idx_pest_alerts_active ON pest_alerts(active);
  CREATE INDEX IF NOT EXISTS idx_certs_farmer ON certifications(farmer_id);
  CREATE INDEX IF NOT EXISTS idx_sub_apps_farmer ON subsidy_applications(farmer_id);
`);

// Safe column migration for existing DBs
function addColumnIfMissing(table, column, definition) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (e) { /* column already exists */ }
}

addColumnIfMissing('users', 'rada_id', 'TEXT');
addColumnIfMissing('users', 'national_id', 'TEXT');
addColumnIfMissing('users', 'verification_status', "TEXT DEFAULT 'pending'");
addColumnIfMissing('users', 'verified_by', 'TEXT');
addColumnIfMissing('users', 'verified_at', 'TEXT');
addColumnIfMissing('users', 'extension_parish', 'TEXT');
addColumnIfMissing('farms', 'land_tenure', 'TEXT');
addColumnIfMissing('farms', 'irrigation', 'TEXT');
addColumnIfMissing('farms', 'soil_type', 'TEXT');

// Seed admin + crop types + market prices
function seed() {
  const existing = db.prepare("SELECT id FROM users WHERE role='admin'").get();
  if (existing) return;

  // Admin
  const adminHash = bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD || 'Admin2026!', 10);
  db.prepare("INSERT INTO users (id,name,email,password,role,verified,verification_status) VALUES (?,?,?,?,?,1,'verified')")
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

  // Seed sample subsidy programs
  const subsidyPrograms = [
    {
      title: 'RADA Seed Subsidy Programme 2025-2026',
      description: 'Subsidized certified seeds for registered farmers across all 14 parishes. Priority crops include yam, callaloo, tomato and sweet pepper.',
      subsidy_type: 'seed',
      amount_jmd: 25000,
      eligibility: 'Registered RADA farmer with at least 0.5 acres of cultivated land',
      application_deadline: '2026-08-31',
      max_applicants: 500
    },
    {
      title: 'Fertilizer Input Support Program',
      description: 'Government-subsidized fertilizer at 50% cost to qualifying small farmers. Available at RADA offices and participating agro-dealers.',
      subsidy_type: 'fertilizer',
      amount_jmd: 15000,
      eligibility: 'Farmers with less than 5 acres of cultivated land',
      application_deadline: '2026-09-15',
      max_applicants: 1000
    },
    {
      title: 'Small Farmer Equipment Loan Fund',
      description: 'Low-interest equipment loans for small farmers to purchase tractors, irrigation equipment and post-harvest technology.',
      subsidy_type: 'equipment',
      amount_jmd: 500000,
      eligibility: 'RADA-verified farmer, minimum 2 years farming history',
      application_deadline: '2026-10-31',
      max_applicants: 150
    },
    {
      title: 'Good Agricultural Practices (GAP) Training',
      description: 'Free GAP certification training and assessment for farmers seeking to export or supply hotels and supermarkets. Includes certification exam fee.',
      subsidy_type: 'training',
      amount_jmd: 0,
      eligibility: 'All registered farmers',
      application_deadline: '2026-12-31',
      max_applicants: 300
    },
    {
      title: 'Agricultural Insurance Subsidy (JAMPRO)',
      description: 'Government co-payment of 40% of crop insurance premiums for qualifying farmers. Covers hurricane, drought and flood losses.',
      subsidy_type: 'insurance',
      amount_jmd: 30000,
      eligibility: 'Farmers with cultivated area between 1-20 acres',
      application_deadline: '2026-07-31',
      max_applicants: 800
    }
  ];

  const insertSubsidy = db.prepare(`INSERT INTO subsidies
    (id,title,description,subsidy_type,amount_jmd,eligibility,application_deadline,max_applicants,active)
    VALUES (?,?,?,?,?,?,?,?,1)`);
  subsidyPrograms.forEach(s => insertSubsidy.run(uuidv4(), s.title, s.description, s.subsidy_type, s.amount_jmd, s.eligibility, s.application_deadline, s.max_applicants));

  console.log('✅ AgroJM seeded with ministry data');
}

seed();
module.exports = db;
