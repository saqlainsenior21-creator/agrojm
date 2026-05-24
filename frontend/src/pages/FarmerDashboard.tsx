import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'

export default function FarmerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'listings'|'orders'|'crops'|'certifications'|'new_listing'>('listings')
  const [listings, setListings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [crops, setCrops] = useState<any[]>([])
  const [cropTypes, setCropTypes] = useState<any[]>([])
  const [certs, setCerts] = useState<any[]>([])
  const [farms, setFarms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ crop_type_id:'', title:'', description:'', quantity_available:'', unit:'lb', price_per_unit:'', parish: (user as any)?.parish||'', harvest_date:'' })
  const [cropForm, setCropForm] = useState({ crop_type_id:'', stage:'planted', planting_date:'', expected_harvest:'', quantity_planted:'', notes:'' })
  const [certForm, setCertForm] = useState({ cert_type:'GAP', cert_number:'', issued_by:'', issued_date:'', expiry_date:'', notes:'' })

  useEffect(() => {
    Promise.all([
      apiFetch('/listings/my/all'),
      apiFetch('/orders'),
      apiFetch('/crops/logs'),
      apiFetch('/crops/types'),
      apiFetch('/certifications/my'),
      apiFetch('/farms'),
    ]).then(([l,o,c,ct,certs,f]) => { setListings(l); setOrders(o); setCrops(c); setCropTypes(ct); setCerts(certs); setFarms(f) })
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

  async function addCert() {
    try {
      await apiFetch('/certifications', { method:'POST', body: JSON.stringify(certForm) })
      alert('✅ Certification added!'); apiFetch('/certifications/my').then(setCerts)
      setCertForm({ cert_type:'GAP', cert_number:'', issued_by:'', issued_date:'', expiry_date:'', notes:'' })
    } catch(e:any) { alert(e.message) }
  }

  const verStatus = (user as any)?.verification_status
  const inp = { padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14, boxSizing:'border-box' as const }

  const stats = [
    { label:'Active Listings', val: listings.filter(l => l.status==='active').length },
    { label:'Total Orders', val: orders.length },
    { label:'Crops Tracked', val: crops.length },
    { label:'Certifications', val: certs.filter(c => c.status==='active').length },
  ]

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Loading...</div>

  return (
    <div style={{ padding:32 }}>
      {/* Verification banner */}
      {verStatus !== 'verified' && (
        <div style={{ background: verStatus==='rejected' ? '#fef2f2' : '#fffbeb', border:`1px solid ${verStatus==='rejected'?'#fca5a5':'#fde68a'}`, borderRadius:10, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>{verStatus==='rejected' ? '❌' : '⏳'}</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color: verStatus==='rejected'?'#991b1b':'#854d0e' }}>
              {verStatus==='rejected' ? 'Verification Rejected' : 'Pending RADA Verification'}
            </div>
            <div style={{ fontSize:13, color:'#6b7280' }}>
              {verStatus==='rejected'
                ? 'Your account was not verified. Contact your local extension officer or update your RADA ID.'
                : 'An extension officer will verify your RADA ID. You can still list produce while pending.'}
            </div>
          </div>
        </div>
      )}

      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:2 }}>👋 Welcome, {user?.name}</h1>
      <p style={{ color:'#6b7280', marginBottom:20 }}>
        Farmer · {(user as any)?.parish}
        {(user as any)?.rada_id && <span style={{ marginLeft:8, fontSize:12, background:'#f0fdf4', color:G, padding:'2px 8px', borderRadius:20, fontWeight:600 }}>RADA: {(user as any).rada_id}</span>}
        {verStatus==='verified' && <span style={{ marginLeft:8, fontSize:12, background:'#d1fae5', color:'#065f46', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>✅ RADA Verified</span>}
      </p>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:20, textAlign:'center', border:'1px solid #e5e7eb' }}>
            <div style={{ fontSize:32, fontWeight:800, color:G }}>{s.val}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
        <button onClick={() => navigate('/subsidies')} style={{ padding:'9px 18px', background:'#fff', color:G, border:`1.5px solid ${G}`, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>💰 Gov't Subsidies</button>
        <button onClick={() => navigate('/alerts')} style={{ padding:'9px 18px', background:'#fff', color:'#92400e', border:'1.5px solid #fcd34d', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>⚠️ Pest Alerts</button>
        <button onClick={() => navigate('/prices')} style={{ padding:'9px 18px', background:'#fff', color:'#374151', border:'1.5px solid #d1d5db', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>📈 Market Prices</button>
        <button onClick={() => navigate('/weather')} style={{ padding:'9px 18px', background:'#fff', color:'#374151', border:'1.5px solid #d1d5db', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>⛅ Weather</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {[['listings','My Listings'],['orders','Orders'],['crops','Crop Tracker'],['certifications','📋 Certifications'],['new_listing','+ New Listing']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t as any)}
            style={{ padding:'9px 16px', background: tab===t?G:'#fff', color: tab===t?'#fff':'#374151', border:`1.5px solid ${tab===t?G:'#d1d5db'}`, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>
            {l}
          </button>
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
              <select value={cropForm.crop_type_id} onChange={set(setCropForm,'crop_type_id')} style={inp}>
                <option value=''>Select crop...</option>
                {cropTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={cropForm.stage} onChange={set(setCropForm,'stage')} style={inp}>
                {['planted','growing','flowering','harvesting','harvested'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" placeholder="Planting date" value={cropForm.planting_date} onChange={set(setCropForm,'planting_date')} style={inp} />
              <input type="date" placeholder="Expected harvest" value={cropForm.expected_harvest} onChange={set(setCropForm,'expected_harvest')} style={inp} />
              <input type="number" placeholder="Quantity planted (lb)" value={cropForm.quantity_planted} onChange={set(setCropForm,'quantity_planted')} style={inp} />
              <input placeholder="Notes" value={cropForm.notes} onChange={set(setCropForm,'notes')} style={inp} />
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
            {crops.length === 0 && <p style={{ color:'#9ca3af', fontSize:13 }}>No crops logged yet. Start tracking your crops above!</p>}
          </div>
        </div>
      )}

      {/* Certifications Tab */}
      {tab === 'certifications' && (
        <div>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb', marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Register a Certification</h3>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>Add your farm certifications (GAP, Organic, etc.) to appear as verified to buyers and the Ministry.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <select value={certForm.cert_type} onChange={set(setCertForm,'cert_type')} style={inp}>
                {['GAP','organic','GlobalGAP','HACCP','ISO22000','RADA_approved','fair_trade'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="Certificate number" value={certForm.cert_number} onChange={set(setCertForm,'cert_number')} style={inp} />
              <input placeholder="Issued by (e.g. RADA, BSJ)" value={certForm.issued_by} onChange={set(setCertForm,'issued_by')} style={inp} />
              <input type="date" placeholder="Issue date" value={certForm.issued_date} onChange={set(setCertForm,'issued_date')} style={inp} />
              <input type="date" placeholder="Expiry date" value={certForm.expiry_date} onChange={set(setCertForm,'expiry_date')} style={inp} />
              <input placeholder="Notes" value={certForm.notes} onChange={set(setCertForm,'notes')} style={inp} />
            </div>
            <button onClick={addCert} style={{ marginTop:12, padding:'10px 24px', background:G, color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>
              Add Certification
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {certs.map((c:any) => {
              const expired = c.expiry_date && new Date(c.expiry_date) < new Date()
              return (
                <div key={c.id} style={{ background:'#fff', borderRadius:12, padding:20, border:`1px solid ${expired?'#fca5a5':'#e5e7eb'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>{c.cert_type}</span>
                    <span style={{ fontSize:12, padding:'2px 10px', borderRadius:20, fontWeight:600,
                      background: c.status==='active'&&!expired?'#d1fae5':expired?'#fef2f2':'#fef9c3',
                      color: c.status==='active'&&!expired?'#065f46':expired?'#991b1b':'#854d0e'
                    }}>{expired ? 'Expired' : c.status}</span>
                  </div>
                  {c.cert_number && <div style={{ fontSize:13, color:'#374151', marginBottom:4 }}>No: {c.cert_number}</div>}
                  {c.issued_by && <div style={{ fontSize:12, color:'#9ca3af' }}>Issued by: {c.issued_by}</div>}
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>
                    {c.issued_date && <>From: {c.issued_date}</>}
                    {c.expiry_date && <> · Expires: {c.expiry_date}</>}
                  </div>
                  {c.verified_by_name && <div style={{ fontSize:12, color:G, marginTop:6, fontWeight:600 }}>✅ Verified by {c.verified_by_name}</div>}
                </div>
              )
            })}
            {certs.length === 0 && <p style={{ color:'#9ca3af', fontSize:13 }}>No certifications yet. Add your GAP or organic certification above.</p>}
          </div>
        </div>
      )}

      {/* New Listing */}
      {tab === 'new_listing' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, border:'1px solid #e5e7eb', maxWidth:600 }}>
          <h3 style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Create New Listing</h3>
          <div style={{ display:'grid', gap:14 }}>
            <select value={form.crop_type_id} onChange={set(setForm,'crop_type_id')} style={{ ...inp, width:'100%' }}>
              <option value=''>Select crop type...</option>
              {cropTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Listing title (e.g. Fresh Grade A Yam)" value={form.title} onChange={set(setForm,'title')} style={{ ...inp, width:'100%' }} />
            <textarea placeholder="Description (optional)" value={form.description} onChange={set(setForm,'description')} rows={3}
              style={{ ...inp, width:'100%', resize:'vertical' }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <input type="number" placeholder="Quantity available" value={form.quantity_available} onChange={set(setForm,'quantity_available')} style={inp} />
              <select value={form.unit} onChange={set(setForm,'unit')} style={inp}>
                {['lb','kg','bunch','unit','bag','box','crate','oz'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input type="number" placeholder="Price per unit (J$)" value={form.price_per_unit} onChange={set(setForm,'price_per_unit')} style={inp} />
              <input type="date" placeholder="Harvest date" value={form.harvest_date} onChange={set(setForm,'harvest_date')} style={inp} />
            </div>
            <button onClick={createListing} style={{ padding:'12px', background:G, color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:15, cursor:'pointer' }}>Publish Listing →</button>
          </div>
        </div>
      )}
    </div>
  )
}
