import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'

export default function FarmerDashboard() {
  const { user, refreshUser } = useAuth()
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
  const [cropForm, setCropForm] = useState({ crop_type_id:'', farm_id:'', stage:'planted', planting_date:'', expected_harvest:'', quantity_planted:'', unit:'lb', notes:'' })
  const [certForm, setCertForm] = useState({ cert_type:'GAP', cert_number:'', issued_by:'', issued_date:'', expiry_date:'', notes:'' })
  const [updatingId, setUpdatingId] = useState<string|null>(null)
  const [updateForm, setUpdateForm] = useState({ stage:'growing', actual_harvest:'', quantity_harvested:'', notes:'' })
  const [radaInput, setRadaInput] = useState((user as any)?.rada_id || '')
  const [radaLoading, setRadaLoading] = useState(false)
  const [radaError, setRadaError] = useState('')

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
      alert('✅ Crop logged!')
      setCropForm({ crop_type_id:'', farm_id:'', stage:'planted', planting_date:'', expected_harvest:'', quantity_planted:'', unit:'lb', notes:'' })
      apiFetch('/crops/logs').then(setCrops)
    } catch(e:any) { alert(e.message) }
  }

  async function updateCrop(id: string) {
    try {
      await apiFetch(`/crops/logs/${id}`, { method:'PATCH', body: JSON.stringify({
        ...updateForm,
        quantity_harvested: updateForm.quantity_harvested ? Number(updateForm.quantity_harvested) : undefined
      })})
      setUpdatingId(null)
      apiFetch('/crops/logs').then(setCrops)
    } catch(e:any) { alert(e.message) }
  }

  async function verifyWithRada() {
    setRadaLoading(true); setRadaError('')
    try {
      const data = await apiFetch('/auth/verify-rada', { method:'POST', body: JSON.stringify({ rada_id: radaInput }) })
      localStorage.setItem('agrojm_token', data.token)
      await refreshUser()
    } catch(e:any) { setRadaError(e.message) }
    finally { setRadaLoading(false) }
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
      {/* Verification banner — self-verify with RADA ID */}
      {verStatus !== 'verified' && (
        <div style={{ background: verStatus==='rejected' ? '#fef2f2' : '#fffbeb', border:`1px solid ${verStatus==='rejected'?'#fca5a5':'#fde68a'}`, borderRadius:12, padding:'18px 20px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <span style={{ fontSize:22 }}>{verStatus==='rejected' ? '❌' : '🏛️'}</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color: verStatus==='rejected'?'#991b1b':'#854d0e' }}>
                {verStatus==='rejected' ? 'Verification Rejected' : 'Verify Your RADA ID'}
              </div>
              <div style={{ fontSize:12, color:'#6b7280' }}>
                {verStatus==='rejected'
                  ? 'Enter your correct RADA ID below to re-verify, or contact your local extension officer.'
                  : 'Enter your RADA Farmer ID to instantly verify your account and unlock all features.'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input
              placeholder="e.g. RADA-2024-SE-00123"
              value={radaInput}
              onChange={e => { setRadaInput(e.target.value.toUpperCase()); setRadaError('') }}
              style={{ flex:1, minWidth:200, padding:'9px 12px', border:`1.5px solid ${radaError?'#fca5a5':'#d1d5db'}`, borderRadius:8, fontSize:13, boxSizing:'border-box' as const }}
            />
            <button
              onClick={verifyWithRada}
              disabled={radaLoading || !radaInput.trim()}
              style={{ padding:'9px 20px', background:G, color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13, opacity:radaLoading||!radaInput.trim()?0.6:1, whiteSpace:'nowrap' }}>
              {radaLoading ? 'Verifying...' : '✅ Verify Now'}
            </button>
          </div>
          {radaError && <div style={{ fontSize:12, color:'#dc2626', marginTop:8 }}>⚠️ {radaError}</div>}
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:8 }}>
            Your RADA ID is on your RADA registration card. Format: RADA-YYYY-XX-NNNNN
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
          {/* Yield summary stats */}
          {(() => {
            const STAGES = ['planted','growing','flowering','harvesting','harvested']
            const harvested = crops.filter((c:any) => c.stage === 'harvested')
            const totalYield = harvested.reduce((s:number, c:any) => s + (c.quantity_harvested||0), 0)
            return (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
                {[
                  { icon:'🌾', label:'Total Logged', val: crops.length, color:G },
                  { icon:'⏳', label:'In Progress', val: crops.filter((c:any) => c.stage !== 'harvested').length, color:'#b45309' },
                  { icon:'✅', label:'Harvested', val: harvested.length, color:'#065f46' },
                  { icon:'📦', label:'Total Yield', val: `${totalYield.toFixed(0)} lb`, color:'#1d4ed8' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#fff', borderRadius:10, padding:16, textAlign:'center', border:'1px solid #e5e7eb' }}>
                    <div style={{ fontSize:22 }}>{s.icon}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Log New Crop form */}
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb', marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>🌱 Log New Crop</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <select value={cropForm.crop_type_id} onChange={set(setCropForm,'crop_type_id')} style={inp}>
                <option value=''>Select crop...</option>
                {cropTypes.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={cropForm.farm_id} onChange={set(setCropForm,'farm_id')} style={inp}>
                <option value=''>Select farm (optional)...</option>
                {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <select value={cropForm.stage} onChange={set(setCropForm,'stage')} style={inp}>
                {['planted','growing','flowering','harvesting','harvested'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
              <select value={cropForm.unit} onChange={set(setCropForm,'unit')} style={inp}>
                {['lb','kg','bunch','bag','box','crate'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input type="date" placeholder="Planting date" value={cropForm.planting_date} onChange={set(setCropForm,'planting_date')} style={inp} />
              <input type="date" placeholder="Expected harvest" value={cropForm.expected_harvest} onChange={set(setCropForm,'expected_harvest')} style={inp} />
              <input type="number" placeholder="Quantity planted" value={cropForm.quantity_planted} onChange={set(setCropForm,'quantity_planted')} style={inp} />
              <input placeholder="Notes (optional)" value={cropForm.notes} onChange={set(setCropForm,'notes')} style={inp} />
            </div>
            <button onClick={logCrop} style={{ marginTop:12, padding:'10px 24px', background:G, color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>Log Crop</button>
          </div>

          {/* Crop cards */}
          {crops.length === 0
            ? <p style={{ color:'#9ca3af', fontSize:13 }}>No crops logged yet. Start tracking above!</p>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
                {crops.map((c:any) => {
                  const STAGES = ['planted','growing','flowering','harvesting','harvested']
                  const stageColors: Record<string,string> = { planted:'#fef3c7', growing:'#d1fae5', flowering:'#ede9fe', harvesting:'#ffedd5', harvested:'#dcfce7' }
                  const stageText: Record<string,string>  = { planted:'#92400e', growing:'#065f46', flowering:'#5b21b6', harvesting:'#c2410c', harvested:'#15803d' }
                  const idx = STAGES.indexOf(c.stage)
                  const isUpdating = updatingId === c.id
                  return (
                    <div key={c.id} style={{ background:'#fff', borderRadius:12, padding:18, border:'1px solid #e5e7eb' }}>
                      {/* Header */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:15 }}>{c.crop_name}</div>
                          {c.farm_name && <div style={{ fontSize:11, color:'#9ca3af' }}>{c.farm_name}</div>}
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, background:stageColors[c.stage]||'#f3f4f6', color:stageText[c.stage]||'#374151', padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                          {c.stage.charAt(0).toUpperCase()+c.stage.slice(1)}
                        </span>
                      </div>

                      {/* Stage pipeline */}
                      <div style={{ display:'flex', alignItems:'center', marginBottom:12 }}>
                        {STAGES.map((s, i) => (
                          <div key={s} style={{ display:'flex', alignItems:'center', flex: i < STAGES.length-1 ? 1 : 'none' }}>
                            <div title={s} style={{ width:10, height:10, borderRadius:'50%', background: i<=idx ? G : '#e5e7eb', flexShrink:0 }} />
                            {i < STAGES.length-1 && <div style={{ flex:1, height:2, background: i<idx ? G : '#e5e7eb' }} />}
                          </div>
                        ))}
                      </div>

                      {/* Details */}
                      <div style={{ fontSize:12, color:'#6b7280', display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
                        {c.planting_date && <span>🌱 Planted: {c.planting_date}</span>}
                        {c.expected_harvest && <span>📅 Expected harvest: {c.expected_harvest}</span>}
                        {c.quantity_planted ? <span>⚖️ Qty planted: {c.quantity_planted} {c.unit}</span> : null}
                        {c.quantity_harvested ? (
                          <span style={{ color:G, fontWeight:700 }}>
                            📦 Harvested: {c.quantity_harvested} {c.unit}
                            {c.quantity_planted ? <span style={{ color:'#6b7280', fontWeight:400 }}> ({Math.round(c.quantity_harvested/c.quantity_planted*100)}% yield)</span> : null}
                          </span>
                        ) : null}
                        {c.actual_harvest && <span>✅ Actual harvest date: {c.actual_harvest}</span>}
                        {c.notes && <span style={{ fontStyle:'italic' }}>💬 {c.notes}</span>}
                      </div>

                      {/* Update toggle button */}
                      {!isUpdating && c.stage !== 'harvested' && (
                        <button
                          onClick={() => { setUpdatingId(c.id); setUpdateForm({ stage: STAGES[Math.min(idx+1,4)], actual_harvest:'', quantity_harvested:'', notes:'' }) }}
                          style={{ width:'100%', padding:'7px', background:'#f9fafb', color:'#374151', border:'1.5px solid #e5e7eb', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          Update Stage →
                        </button>
                      )}
                      {!isUpdating && c.stage === 'harvested' && (
                        <div style={{ fontSize:11, color:G, textAlign:'center', fontWeight:600, paddingTop:2 }}>✅ Complete</div>
                      )}

                      {/* Inline update form */}
                      {isUpdating && (
                        <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:12, marginTop:4, display:'grid', gap:8 }}>
                          <select value={updateForm.stage} onChange={e => setUpdateForm(f => ({...f, stage:e.target.value}))} style={{ ...inp, fontSize:13 }}>
                            {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                          </select>
                          {(updateForm.stage === 'harvesting' || updateForm.stage === 'harvested') && (<>
                            <input type="date" placeholder="Actual harvest date" value={updateForm.actual_harvest} onChange={e => setUpdateForm(f => ({...f, actual_harvest:e.target.value}))} style={{ ...inp, fontSize:13 }} />
                            <input type="number" placeholder={`Qty harvested (${c.unit})`} value={updateForm.quantity_harvested} onChange={e => setUpdateForm(f => ({...f, quantity_harvested:e.target.value}))} style={{ ...inp, fontSize:13 }} />
                          </>)}
                          <input placeholder="Notes (optional)" value={updateForm.notes} onChange={e => setUpdateForm(f => ({...f, notes:e.target.value}))} style={{ ...inp, fontSize:13 }} />
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => updateCrop(c.id)} style={{ flex:1, padding:'7px', background:G, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:600 }}>Save</button>
                            <button onClick={() => setUpdatingId(null)} style={{ flex:1, padding:'7px', background:'#fff', color:'#6b7280', border:'1.5px solid #e5e7eb', borderRadius:7, cursor:'pointer', fontSize:12 }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
          }
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
