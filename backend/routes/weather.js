const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const axios = require('axios');

// Jamaica parish coordinates
const PARISH_COORDS = {
  'Kingston':      { lat: 17.9970, lng: -76.7936 },
  'St. Andrew':    { lat: 18.0280, lng: -76.7480 },
  'St. Thomas':    { lat: 17.9200, lng: -76.3500 },
  'Portland':      { lat: 18.1750, lng: -76.4500 },
  'St. Mary':      { lat: 18.3000, lng: -76.9000 },
  'St. Ann':       { lat: 18.4300, lng: -77.2000 },
  'Trelawny':      { lat: 18.3500, lng: -77.6000 },
  'St. James':     { lat: 18.4700, lng: -77.9200 },
  'Hanover':       { lat: 18.4000, lng: -78.1300 },
  'Westmoreland':  { lat: 18.2000, lng: -78.1700 },
  'St. Elizabeth': { lat: 18.0500, lng: -77.7000 },
  'Manchester':    { lat: 18.0500, lng: -77.5000 },
  'Clarendon':     { lat: 17.9500, lng: -77.2500 },
  'St. Catherine': { lat: 17.9900, lng: -77.0000 },
};

// GET /api/weather/forecast?parish=Kingston
router.get('/forecast', async (req, res) => {
  const parish = req.query.parish || 'Kingston';
  const coords = PARISH_COORDS[parish] || PARISH_COORDS['Kingston'];
  try {
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: coords.lat, longitude: coords.lng,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode',
        timezone: 'America/Jamaica', forecast_days: 7,
      }, timeout: 5000
    });
    // Map weather codes to descriptions
    const wmoDesc = (code) => {
      if (code === 0) return 'Clear sky';
      if (code <= 3) return 'Partly cloudy';
      if (code <= 49) return 'Foggy';
      if (code <= 67) return 'Rainy';
      if (code <= 77) return 'Snowy';
      if (code <= 82) return 'Rain showers';
      if (code <= 99) return 'Thunderstorm';
      return 'Unknown';
    };
    const forecast = data.daily.time.map((date, i) => ({
      date,
      temp_max: data.daily.temperature_2m_max[i],
      temp_min: data.daily.temperature_2m_min[i],
      precipitation_mm: data.daily.precipitation_sum[i],
      wind_kmh: data.daily.windspeed_10m_max[i],
      description: wmoDesc(data.daily.weathercode[i]),
      weathercode: data.daily.weathercode[i],
    }));
    res.json({ parish, coords, forecast });
  } catch (e) {
    res.status(503).json({ error: 'Weather service unavailable', message: e.message });
  }
});

// GET /api/weather/alerts — active alerts
router.get('/alerts', (req, res) => {
  const { parish } = req.query;
  let query = "SELECT * FROM weather_alerts WHERE active=1";
  const params = [];
  if (parish) { query += " AND (parish=? OR parish IS NULL)"; params.push(parish); }
  query += " ORDER BY created_at DESC";
  res.json(db.prepare(query).all(...params));
});

// POST /api/weather/alerts — admin creates alert
router.post('/alerts', auth, requireRole('admin'), (req, res) => {
  const { parish, alert_type, severity, title, message, valid_from, valid_until } = req.body;
  if (!alert_type || !title || !message) return res.status(400).json({ error: 'alert_type, title and message required' });
  const id = uuidv4();
  db.prepare('INSERT INTO weather_alerts (id,parish,alert_type,severity,title,message,valid_from,valid_until) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, parish||null, alert_type, severity||'moderate', title, message, valid_from||null, valid_until||null);
  res.status(201).json({ id });
});

// DELETE /api/weather/alerts/:id
router.delete('/alerts/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('UPDATE weather_alerts SET active=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
