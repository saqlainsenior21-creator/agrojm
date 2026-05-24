require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const path = require('path');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://agrojm.com', 'https://www.agrojm.com', /\.railway\.app$/]
    : ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));
app.use(pinoHttp({ logger, autoLogging: { ignore: r => r.url === '/api/health' } }));
app.use(express.json({ limit: '2mb' }));

// Rate limiting
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20, message: { error: 'Too many attempts' } }));
app.use('/api/', rateLimit({ windowMs: 60*1000, max: 300, message: { error: 'Too many requests' } }));

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/listings',      require('./routes/listings'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/farms',         require('./routes/farms'));
app.use('/api/crops',         require('./routes/crops'));
app.use('/api/prices',        require('./routes/prices'));
app.use('/api/weather',       require('./routes/weather'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/delivery',      require('./routes/delivery'));
app.use('/api/alerts',        require('./routes/alerts'));
app.use('/api/subsidies',     require('./routes/subsidies'));
app.use('/api/certifications',require('./routes/certifications'));
app.use('/api/officer',       require('./routes/officer'));
app.use('/api/reports',       require('./routes/reports'));

// Health
app.get('/api/health', (req, res) => {
  try {
    const db = require('./db');
    const { listings } = db.prepare("SELECT COUNT(*) as listings FROM listings WHERE status='active'").get();
    const { farmers } = db.prepare("SELECT COUNT(*) as farmers FROM users WHERE role='farmer'").get();
    const { farmers_verified } = db.prepare("SELECT COUNT(*) as farmers_verified FROM users WHERE role='farmer' AND verification_status='verified'").get();
    res.json({ status: 'ok', listings, farmers, farmers_verified, ts: new Date().toISOString(), version: '2.0.0-ministry' });
  } catch (e) {
    res.status(503).json({ status: 'error', message: e.message });
  }
});

// Serve frontend
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(dist, { maxAge: '1d' }));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => logger.info(`🌱 AgroJM v2 Ministry Edition running on port ${PORT}`));
