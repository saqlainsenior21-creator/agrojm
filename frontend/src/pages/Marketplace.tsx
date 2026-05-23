import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'
const PARISHES = ['','Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']
const CATEGORIES = ['','vegetable','fruit','root','herb','grain']

export default function Marketplace() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<any[]>([])
  const [parish, setParish] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState<string|null>(null)
  const [orderForm, setOrderForm] = useState({ quantity:'', delivery_address:'', notes:'' })

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (parish) params.set('parish', parish)
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    apiFetch(`/listings?${params}`).then(setListings).finally(() => setLoading(false))
  }, [parish, category, search])

  async function placeOrder(listing: any) {
    if (!user) return navigate('/login')
    if (user.role !== 'buyer') return alert('Only buyers can place orders. Please register as a buyer.')
    try {
      await apiFetch('/orders', { method:'POST', body: JSON.stringify({
        listing_id: listing.id,
        quantity: Number(orderForm.quantity),
        delivery_address: orderForm.delivery_address,
        notes: orderForm.notes,
      })})
      alert('✅ Order placed! The farmer will confirm shortly.')
      setOrdering(null)
    } catch (e: any) { alert(e.message) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f4f7f4' }}>
      {/* Nav */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={() => navigate('/')} style={{ fontWeight:800, fontSize:18, background:'none', border:'none', cursor:'pointer' }}>🌱 AgroJM</button>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => navigate('/prices')} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151', fontSize:14 }}>📈 Prices</button>
          <button onClick={() => navigate('/weather')} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151', fontSize:14 }}>⛅ Weather</button>
          {user ? <button onClick={() => navigate('/')} style={{ background:G, color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Dashboard</button>
                : <button onClick={() => navigate('/login')} style={{ background:G, color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Login</button>}
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>
        <h1 style={{ fontSize:28, fontWeight:800, marginBottom:24 }}>🛒 Fresh Crop Marketplace</h1>

        {/* Filters */}
        <div style={{ display:'flex', gap:12, marginBottom:28, flexWrap:'wrap' }}>
          <input placeholder="Search crops..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex:1, minWidth:200, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14 }} />
          <select value={parish} onChange={e => setParish(e.target.value)} style={{ padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14 }}>
            {PARISHES.map(p => <option key={p} value={p}>{p || 'All Parishes'}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14 }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
          </select>
        </div>

        {loading ? <div style={{ textAlign:'center', padding:60, color:'#6b7280' }}>Loading listings...</div>
        : listings.length === 0 ? <div style={{ textAlign:'center', padding:60, color:'#6b7280' }}>No listings found. Try adjusting your filters.</div>
        : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
            {listings.map(l => (
              <div key={l.id} style={{ background:'#fff', borderRadius:14, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #e5e7eb' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ background:'#f0fdf4', color:G, fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{l.category}</span>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>{l.parish}</span>
                </div>
                <h3 style={{ fontSize:17, fontWeight:700, margin:'0 0 6px' }}>{l.crop_name}</h3>
                <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 12px' }}>{l.title}</p>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                  <div><span style={{ fontSize:22, fontWeight:800, color:G }}>J${l.price_per_unit}</span><span style={{ fontSize:13, color:'#9ca3af' }}>/{l.unit}</span></div>
                  <div style={{ fontSize:13, color:'#374151' }}>{l.quantity_available} {l.unit} available</div>
                </div>
                <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>Farmer: {l.farmer_name} · {l.farmer_parish}</div>
                {l.harvest_date && <div style={{ fontSize:12, color:'#6b7280', marginBottom:16 }}>🌾 Harvest: {l.harvest_date}</div>}

                {ordering === l.id ? (
                  <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:16 }}>
                    <input placeholder={`Quantity (${l.unit})`} type="number" value={orderForm.quantity}
                      onChange={e => setOrderForm(f => ({...f, quantity:e.target.value}))}
                      style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14, marginBottom:8, boxSizing:'border-box' }} />
                    <input placeholder="Delivery address" value={orderForm.delivery_address}
                      onChange={e => setOrderForm(f => ({...f, delivery_address:e.target.value}))}
                      style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14, marginBottom:8, boxSizing:'border-box' }} />
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => placeOrder(l)} style={{ flex:1, padding:'9px', background:G, color:'#fff', border:'none', borderRadius:7, fontWeight:600, cursor:'pointer', fontSize:13 }}>Confirm Order</button>
                      <button onClick={() => setOrdering(null)} style={{ padding:'9px 14px', background:'#f4f6f9', border:'none', borderRadius:7, cursor:'pointer', fontSize:13 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setOrdering(l.id); setOrderForm({ quantity:'', delivery_address:'', notes:'' }) }}
                    style={{ width:'100%', padding:'10px', background:G, color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>
                    Order Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
