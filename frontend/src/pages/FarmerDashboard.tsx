import { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'

export default function FarmerDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'listings'|'orders'|'crops'|'new_listing'>('listings')
  const [listings, setListings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [crops, setCrops] = useState<any[]>([])
  const [cropTypes, setCropTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ crop_type_id:'', title:'', description:'', quantity_available:'', unit:'lb', price_per_unit:'', parish: user?.parish||'', harvest_date:'' })
  const [cropForm, setCropForm] = useState({ crop_type_id:'', stage:'planted', planting_date:'', expected_harvest:'', quantity_planted:'', notes:'' })

  useEffect(() => {
    Promise.all([
      apiFetch('/listings/my/all'),
      apiFetch('/orders'),
      apiFetch('/crops/logs'),
      apiFetch('/crops/types'),
    ]).then(([l,o,c,ct]) => { setListings(l); setOrders(o); setCrops(c); setCropTypes(ct) })
      .finally(() => setLoading(false))
  }, [])

  const set = (s: any, k: string) => (e: any) => s((f: any) => ({...f, [k]: e.target.value}))

  async function createListing() {
    try {
      await apiFetch('/listings', { method:'POST', body: JSON.stringify({...form, quantity_available: Number(form.quantity_available), price_per_unit: Number(form.price_per_unit)}) })
      alert('✅ Listing created!'); setTab('listings')
      apiFetch('/listings/my/all').then(setListings)
    } catch(e:any) { alert(e.message) }
  }

  async function logCrop() {
    try {
      await apiFetch('/crops/logs', { method:'POST', body: JSON.stringify({...cropForm, quantity_planted: Number(cropForm.quantity_planted)}) })
      alert('✅ Crop logged!'); apiFetch('/crops/logs').then(setCrops)
    } catch(e:any) { alert(e.message) }
  }

  const stats = [
    { label:'Active Listings', val: listings.filter(l => l.status==='active').length },
    { label:'Total Orders', val: orders.length },
    { label:'Pending Orders', val: orders.filter(o => o.status==='pending').length },
    { label:'Crops Tracked', val: crops.length },
  ]

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Loading...</div>

  return (
    <div style={{ padding:32 }}>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>👋 Welcome, {user?.name}</h1>
      <p style={{ color:'#6b7280', marginBottom:28 }}>Farmer Dashboard · {user?.parish}</p>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:20, textAlign:'center', border:'1px solid #e5e7eb' }}>
            <div style={{ fontSize:32, fontWeight:800, color:G }}>{s.val}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {[['listings','My Listings'],['orders','Orders'],['crops','Crop Tracker'],['new_listing','+ New Listing']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t as any)} style={{ padding:'9px 18px', background: tab===t?G:'#fff', color: tab===t?'#fff':'#374151', border:`1.5px solid ${tab===t?G:'#d1d5db'}`, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>{l}</button>
        ))}
      </div>

      {/* Listings Tab */}
      {tab === 'listings' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {listings.length === 0 ? <p style={{ color:'#6b7280' }}>No listings yet. Create your first listing!</p>
          : listings.map(l => (
            <div key={l.id} style={{ background:'#fff', borderRadius:12, padding:20, border:'1px solid #e5e7eb' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontWeight:700 }}>{l.crop_name}</span>
                <span style={{ fontSize:12, background: l.status==='active'?'#d1fae5':'#f3f4f6', color: l.status==='active'?'#065f46':'#6b7280', padding:'2px 10px', borderRadius:20 }}>{l.status}</span>
              </div>
              <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 10px' }}>{l.title}</p>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                <span style={{ color:G, fontWeight:700 }}>J${l.price_per_unit}/{l.unit}</span>
                <span style={{ color:'#374151' }}>{l.quantity_available} {l.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
          {orders.length === 0 ? <p style={{ padding:24, color:'#6b7280' }}>No orders yet.</p>
          : <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'#f9fafb' }}>
              {['Crop','Buyer','Qty','Total','Status','Action'].map(h => <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, borderBottom:'1px solid #e5e7eb' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {orders.map((o:any) => (
                <tr key={o.id}>
                  <td style={{ padding:'12px 16px', fontSize:14 }}>{o.crop_name}</td>
                  <td style={{ padding:'12px 16px', fontSize:14 }}>{o.buyer_name}</td>
                  <td style={{ padding:'12px 16px', fontSize:14 }}>{o.quantity} {o.unit}</td>
                  <td style={{ padding:'12px 16px', fontSize:14, fontWeight:700, color:G }}>J${o.total_amount?.toLocaleString()}</td>
                  <td style={{ padding:'12px 16px' }}><span style={{ fontSize:12, background:'#f3f4f6', padding:'3px 10px', borderRadius:20 }}>{o.status}</span></td>
                  <td style={{ padding:'12px 16px' }}>
                    {o.status === 'pending' && (
                      <button onClick={async () => { await apiFetch(`/orders/${o.id}/status`, {method:'PATCH', body:JSON.stringify({status:'confirmed'})}); apiFetch('/orders').then(setOrders) }}
                        style={{ background:G, color:'#fff', border:'none', padding:'5px 12px', borderRadius:6, cursor:'pointer', fontSize:12 }}>Confirm</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      )}

      {/* Crop Tracker */}
      {tab === 'crops' && (
        <div>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb', marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Log New Crop</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <select value={cropForm.crop_type_id} onChange={set(setCropForm,'crop_type_id')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }}>
                <option value=''>Select crop...</option>
                {cropTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={cropForm.stage} onChange={set(setCropForm,'stage')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }}>
                {['planted','growing','flowering','harvesting','harvested'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" placeholder="Planting date" value={cropForm.planting_date} onChange={set(setCropForm,'planting_date')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }} />
              <input type="date" placeholder="Expected harvest" value={cropForm.expected_harvest} onChange={set(setCropForm,'expected_harvest')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }} />
              <input type="number" placeholder="Quantity planted (lb)" value={cropForm.quantity_planted} onChange={set(setCropForm,'quantity_planted')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }} />
              <input placeholder="Notes" value={cropForm.notes} onChange={set(setCropForm,'notes')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }} />
            </div>
            <button onClick={logCrop} style={{ marginTop:12, padding:'10px 24px', background:G, color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>Log Crop</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
            {crops.map((c:any) => (
              <div key={c.id} style={{ background:'#fff', borderRadius:12, padding:18, border:'1px solid #e5e7eb' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontWeight:700 }}>{c.crop_name}</span>
                  <span style={{ fontSize:12, background:'#f0fdf4', color:G, padding:'2px 10px', borderRadius:20 }}>{c.stage}</span>
                </div>
                {c.farm_name && <div style={{ fontSize:12, color:'#9ca3af', marginBottom:6 }}>Farm: {c.farm_name}</div>}
                {c.planting_date && <div style={{ fontSize:13, color:'#6b7280' }}>🌱 Planted: {c.planting_date}</div>}
                {c.expected_harvest && <div style={{ fontSize:13, color:'#6b7280' }}>🌾 Expected: {c.expected_harvest}</div>}
                {c.quantity_planted && <div style={{ fontSize:13, color:G, fontWeight:600 }}>{c.quantity_planted} {c.unit}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Listing */}
      {tab === 'new_listing' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, border:'1px solid #e5e7eb', maxWidth:600 }}>
          <h3 style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Create New Listing</h3>
          <div style={{ display:'grid', gap:14 }}>
            <select value={form.crop_type_id} onChange={set(setForm,'crop_type_id')} style={{ padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14 }}>
              <option value=''>Select crop type...</option>
              {cropTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Listing title (e.g. Fresh Grade A Yam)" value={form.title} onChange={set(setForm,'title')} style={{ padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14 }} />
            <textarea placeholder="Description (optional)" value={form.description} onChange={set(setForm,'description')} rows={3} style={{ padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, resize:'vertical' }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <input type="number" placeholder="Quantity available" value={form.quantity_available} onChange={set(setForm,'quantity_available')} style={{ padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14 }} />
              <select value={form.unit} onChange={set(setForm,'unit')} style={{ padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14 }}>
                {['lb','kg','bunch','unit','bag','box','crate'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input type="number" placeholder="Price per unit (J$)" value={form.price_per_unit} onChange={set(setForm,'price_per_unit')} style={{ padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14 }} />
              <input type="date" placeholder="Harvest date" value={form.harvest_date} onChange={set(setForm,'harvest_date')} style={{ padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14 }} />
            </div>
            <button onClick={createListing} style={{ padding:'12px', background:G, color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:15, cursor:'pointer' }}>Publish Listing →</button>
          </div>
        </div>
      )}
    </div>
  )
}
