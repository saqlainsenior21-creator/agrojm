import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

const G = '#2d6a4f'
const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

function weatherIcon(code: number) {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 49) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  if (code <= 99) return '⛈️'
  return '🌡️'
}

export default function WeatherPage() {
  const navigate = useNavigate()
  const [parish, setParish] = useState('Kingston')
  const [forecast, setForecast] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch(`/weather/forecast?parish=${encodeURIComponent(parish)}`),
      apiFetch(`/weather/alerts?parish=${encodeURIComponent(parish)}`),
    ]).then(([f, a]) => { setForecast(f.forecast || []); setAlerts(a || []) })
      .finally(() => setLoading(false))
  }, [parish])

  return (
    <div style={{ minHeight:'100vh', background:'#f4f7f4' }}>
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={() => navigate('/')} style={{ fontWeight:800, fontSize:18, background:'none', border:'none', cursor:'pointer' }}>🌱 AgroJM</button>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => navigate('/marketplace')} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151', fontSize:14 }}>🛒 Marketplace</button>
          <button onClick={() => navigate('/prices')} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151', fontSize:14 }}>📈 Prices</button>
        </div>
      </nav>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
        <h1 style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>⛅ Weather Forecast</h1>
        <p style={{ color:'#6b7280', marginBottom:24 }}>7-day weather forecast by parish — plan your planting and harvesting.</p>

        <select value={parish} onChange={e => setParish(e.target.value)}
          style={{ padding:'10px 16px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:15, marginBottom:28, fontWeight:600 }}>
          {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={{ marginBottom:24 }}>
            {alerts.map((a:any) => (
              <div key={a.id} style={{ background: a.severity==='extreme'?'#fef2f2':a.severity==='high'?'#fff7ed':'#fefce8',
                border:`1px solid ${a.severity==='extreme'?'#fca5a5':a.severity==='high'?'#fdba74':'#fde047'}`,
                borderRadius:10, padding:'14px 18px', marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>⚠️ {a.title}</div>
                <div style={{ fontSize:13, color:'#374151' }}>{a.message}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? <div style={{ textAlign:'center', padding:60, color:'#6b7280' }}>Loading forecast...</div>
        : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(115px,1fr))', gap:14 }}>
            {forecast.map((day:any, i:number) => (
              <div key={day.date} style={{ background:'#fff', borderRadius:14, padding:16, textAlign:'center', border:'1px solid #e5e7eb', borderTop:`3px solid ${i===0?G:'#e5e7eb'}` }}>
                <div style={{ fontSize:12, color:'#9ca3af', marginBottom:6 }}>{i===0?'Today':new Date(day.date+'T12:00:00').toLocaleDateString('en-JM',{weekday:'short'})}</div>
                <div style={{ fontSize:36, marginBottom:8 }}>{weatherIcon(day.weathercode)}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:4 }}>{day.description}</div>
                <div style={{ fontSize:15, fontWeight:800, color:G }}>{Math.round(day.temp_max)}°C</div>
                <div style={{ fontSize:12, color:'#9ca3af' }}>{Math.round(day.temp_min)}°C</div>
                {day.precipitation_mm > 0 && <div style={{ fontSize:12, color:'#3b82f6', marginTop:6 }}>🌧 {day.precipitation_mm}mm</div>}
                {day.wind_kmh > 20 && <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>💨 {Math.round(day.wind_kmh)}km/h</div>}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop:24, padding:16, background:'#f0fdf4', borderRadius:10, fontSize:13, color:'#6b7280' }}>
          🌾 <strong>Farming tip:</strong> Rain forecasts above 20mm indicate good planting conditions for most root crops. Avoid harvest during heavy rain to prevent spoilage.
        </div>
      </div>
    </div>
  )
}
