import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

const G = '#2d6a4f'

export default function PriceTracker() {
  const navigate = useNavigate()
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiFetch('/prices/latest').then(setPrices).finally(() => setLoading(false))
  }, [])

  const filtered = prices.filter(p => p.crop_name?.toLowerCase().includes(search.toLowerCase()))
  const categories = [...new Set(filtered.map((p:any) => p.category))].filter(Boolean)

  return (
    <div style={{ minHeight:'100vh', background:'#f4f7f4' }}>
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={() => navigate('/')} style={{ fontWeight:800, fontSize:18, background:'none', border:'none', cursor:'pointer' }}>🌱 AgroJM</button>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => navigate('/marketplace')} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151', fontSize:14 }}>🛒 Marketplace</button>
          <button onClick={() => navigate('/weather')} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151', fontSize:14 }}>⛅ Weather</button>
        </div>
      </nav>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 24px' }}>
        <h1 style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>📈 Market Price Tracker</h1>
        <p style={{ color:'#6b7280', marginBottom:24 }}>Live crop prices across Jamaica — updated daily from market data.</p>

        <input placeholder="Search crop..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', maxWidth:400, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, marginBottom:28, boxSizing:'border-box' }} />

        {loading ? <div style={{ textAlign:'center', padding:60, color:'#6b7280' }}>Loading prices...</div>
        : categories.map(cat => (
          <div key={cat} style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:G, textTransform:'capitalize', marginBottom:14 }}>{cat}s</h2>
            <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #e5e7eb' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {['Crop','Price per Unit','Unit','Last Updated'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'#374151', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.filter((p:any) => p.category === cat).map((p:any, i:number) => (
                    <tr key={p.crop_type_id} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                      <td style={{ padding:'12px 16px', fontSize:14, fontWeight:600 }}>{p.crop_name}</td>
                      <td style={{ padding:'12px 16px', fontSize:14, color:G, fontWeight:700 }}>J${p.price_per_unit?.toFixed(0)}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'#6b7280' }}>per {p.unit}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'#9ca3af' }}>{p.recorded_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
