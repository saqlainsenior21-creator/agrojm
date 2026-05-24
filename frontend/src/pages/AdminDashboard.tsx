import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

const G = '#2d6a4f'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [certs, setCerts] = useState<any[]>([])
  const [tab, setTab] = useState<'overview'|'users'|'orders'|'certifications'|'reports'>('overview')
  const [userFilter, setUserFilter] = useState({ role:'', parish:'', verification_status:'' })
  const [newOfficer, setNewOfficer] = useState({ name:'', email:'', password:'', phone:'', parish:'', extension_parish:'' })
  const [showOfficerForm, setShowOfficerForm] = useState(false)

  const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/stats'),
      apiFetch('/admin/users'),
      apiFetch('/admin/orders'),
      apiFetch('/admin/certifications'),
    ]).then(([s,u,o,c]) => { setStats(s); setUsers(u); setOrders(o); setCerts(c) })
  }, [])

  const filteredUsers = users.filter(u =>
    (!userFilter.role || u.role === userFilter.role) &&
    (!userFilter.parish || u.parish === userFilter.parish) &&
    (!userFilter.verification_status || u.verification_status === userFilter.verification_status)
  )

  async function verifyUser(id: string) {
    await apiFetch(`/admin/users/${id}/verify`, {method:'PATCH'})
    setUsers(u => u.map(x => x.id===id ? {...x, verified:1, verification_status:'verified'} : x))
  }

  async function createOfficer() {
    try {
      await apiFetch('/admin/users', { method:'POST', body: JSON.stringify({ ...newOfficer, role:'extension_officer' }) })
      alert('✅ Extension officer created!'); setShowOfficerForm(false)
      apiFetch('/admin/users').then(setUsers)
    } catch(e:any) { alert(e.message) }
  }

  if (!stats) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Loading...</div>

  return (
    <div style={{ padding:32 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:0 }}>🏛️ AgroJM Admin — Ministry Dashboard</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/ministry')} style={{ padding:'8px 16px', background:'#fff', color:G, border:`1.5px solid ${G}`, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>🌐 Ministry Portal</button>
          <button onClick={() => navigate('/officer')} style={{ padding:'8px 16px', background:G, color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>🏛️ Officer View</button>
        </div>
      </div>
      <p style={{ color:'#6b7280', marginBottom:28 }}>Real-time agricultural marketplace overview · Ministry of Agriculture</p>

      {/* Summary Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:14, marginBottom:28 }}>
        {[
          { label:'Total Farmers', val: stats.farmers, sub:`${stats.verifiedFarmers} RADA verified`, icon:'👨‍🌾' },
          { label:'Buyers', val: stats.buyers, sub:'hotels, supers, exporters', icon:'🏨' },
          { label:'Active Listings', val: stats.listings, sub:'crops on market', icon:'🌿' },
          { label:'Total Orders', val: stats.orders, sub:`J$${(stats.revenue||0).toLocaleString()} revenue`, icon:'📦' },
          { label:'Pending Verify', val: stats.pendingVerifications, sub:'need RADA review', icon:'⏳', alert: stats.pendingVerifications > 0 },
          { label:'Certifications', val: stats.totalCerts, sub:'active certs', icon:'📋' },
          { label:'Active Alerts', val: stats.activeAlerts, sub:'pest & disease', icon:'⚠️' },
          { label:'Subsidy Apps', val: stats.subsidyApps, sub:'awaiting review', icon:'💰' },
        ].map(s => (
          <div key={s.label} style={{ background: s.alert ? '#fef2f2' : '#fff', borderRadius:12, padding:16, textAlign:'center', border:`1px solid ${s.alert?'#fca5a5':'#e5e7eb'}` }}>
            <div style={{ fontSize:22, marginBottom:2 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color: s.alert ? '#dc2626' : G }}>{s.val}</div>
            <div style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{s.label}</div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {[['overview','📊 Overview'],['users','👥 Users'],['orders','📦 Orders'],['certifications','📋 Certifications'],['reports','📥 Reports']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t as any)}
            style={{ padding:'9px 16px', background:tab===t?G:'#fff', color:tab===t?'#fff':'#374151', border:`1.5px solid ${tab===t?G:'#d1d5db'}`, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>
            {l}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>🌿 Top Crops Listed</h3>
            {stats.topCrops?.map((c:any) => (
              <div key={c.name} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ fontSize:13 }}>{c.name}</span>
                <span style={{ fontSize:13, fontWeight:700, color:G }}>{c.count} listings</span>
              </div>
            ))}
            {stats.topCrops?.length === 0 && <p style={{ color:'#9ca3af', fontSize:13 }}>No listings yet</p>}
          </div>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>📍 Farmers by Parish</h3>
            {stats.farmersByParish?.map((p:any) => (
              <div key={p.parish} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ fontSize:13 }}>{p.parish}</span>
                <span style={{ fontSize:13, fontWeight:700, color:G }}>{p.count} farmers</span>
              </div>
            ))}
            {!stats.farmersByParish?.length && <p style={{ color:'#9ca3af', fontSize:13 }}>No farmers registered yet</p>}
          </div>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>📦 Listings by Parish</h3>
            {stats.parishes?.map((p:any) => (
              <div key={p.parish} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ fontSize:13 }}>{p.parish}</span>
                <span style={{ fontSize:13, fontWeight:700, color:G }}>{p.count}</span>
              </div>
            ))}
            {!stats.parishes?.length && <p style={{ color:'#9ca3af', fontSize:13 }}>No active listings yet</p>}
          </div>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>📈 Recent Orders (30 days)</h3>
            {stats.recentOrders?.slice(0,8).map((r:any) => (
              <div key={r.date} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>{r.date}</span>
                <span style={{ fontSize:12 }}>{r.orders} orders · J${Number(r.revenue||0).toLocaleString()}</span>
              </div>
            ))}
            {!stats.recentOrders?.length && <p style={{ color:'#9ca3af', fontSize:13 }}>No orders yet</p>}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          {/* Filters + Create Officer */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <select value={userFilter.role} onChange={e => setUserFilter(f=>({...f,role:e.target.value}))} style={{ padding:'8px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:13 }}>
              <option value=''>All Roles</option>
              {['farmer','buyer','extension_officer','driver','admin'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={userFilter.parish} onChange={e => setUserFilter(f=>({...f,parish:e.target.value}))} style={{ padding:'8px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:13 }}>
              <option value=''>All Parishes</option>
              {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={userFilter.verification_status} onChange={e => setUserFilter(f=>({...f,verification_status:e.target.value}))} style={{ padding:'8px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:13 }}>
              <option value=''>All Statuses</option>
              <option value='pending'>Pending</option>
              <option value='verified'>Verified</option>
              <option value='rejected'>Rejected</option>
            </select>
            <span style={{ fontSize:13, color:'#6b7280' }}>{filteredUsers.length} users</span>
            <button onClick={() => setShowOfficerForm(!showOfficerForm)} style={{ marginLeft:'auto', padding:'8px 16px', background:G, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 }}>
              + Add Extension Officer
            </button>
          </div>

          {showOfficerForm && (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:20, marginBottom:16 }}>
              <h4 style={{ fontSize:14, fontWeight:700, color:G, marginBottom:12 }}>Create Extension Officer Account</h4>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[['Full Name','name'],['Email','email'],['Password','password'],['Phone','phone'],['Home Parish','parish'],['Assigned Parish','extension_parish']].map(([l,k]) => (
                  <div key={k}>
                    <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>{l}</label>
                    <input value={(newOfficer as any)[k]} onChange={e => setNewOfficer(f => ({...f,[k]:e.target.value}))}
                      type={k==='password'?'password':'text'}
                      style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #d1d5db', borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, marginTop:12 }}>
                <button onClick={createOfficer} style={{ padding:'8px 20px', background:G, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:13 }}>Create Officer</button>
                <button onClick={() => setShowOfficerForm(false)} style={{ padding:'8px 14px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:7, cursor:'pointer', fontSize:13 }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:750 }}>
              <thead><tr style={{ background:'#f9fafb' }}>
                {['Name','Role','Parish','RADA ID','Verify Status','Actions'].map(h => <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6b7280', borderBottom:'1px solid #e5e7eb', textTransform:'uppercase' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredUsers.map((u:any) => (
                  <tr key={u.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{u.name}</div>
                      <div style={{ fontSize:12, color:'#9ca3af' }}>{u.email}</div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:12, background:'#f0fdf4', color:G, padding:'2px 8px', borderRadius:20 }}>{u.role}</span>
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:13 }}>{u.parish||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:G, fontWeight:600 }}>{u.rada_id||'—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:12, padding:'2px 8px', borderRadius:20, fontWeight:600,
                        background: u.verification_status==='verified'?'#d1fae5':u.verification_status==='rejected'?'#fee2e2':'#fef9c3',
                        color: u.verification_status==='verified'?'#065f46':u.verification_status==='rejected'?'#991b1b':'#854d0e'
                      }}>{u.verification_status||'pending'}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      {u.verification_status !== 'verified' && u.role === 'farmer' && (
                        <button onClick={() => verifyUser(u.id)} style={{ background:G, color:'#fff', border:'none', padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600, marginRight:6 }}>✅ Verify</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div>
          <div style={{ marginBottom:14 }}>
            <button onClick={() => window.open('/api/reports/csv/orders','_blank')} style={{ padding:'9px 18px', background:G, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>📥 Export CSV</button>
          </div>
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
              <thead><tr style={{ background:'#f9fafb' }}>
                {['Crop','Buyer','Farmer','Parish','Qty','Total','Status','Payment'].map(h => <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6b7280', borderBottom:'1px solid #e5e7eb', textTransform:'uppercase' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {orders.map((o:any, i:number) => (
                  <tr key={o.id} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                    <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600 }}>{o.crop_name}</td>
                    <td style={{ padding:'10px 14px', fontSize:12 }}>{o.buyer_name}<br/><span style={{ color:'#9ca3af' }}>{o.buyer_type}</span></td>
                    <td style={{ padding:'10px 14px', fontSize:12 }}>{o.farmer_name}</td>
                    <td style={{ padding:'10px 14px', fontSize:12 }}>{o.farmer_parish||'—'}</td>
                    <td style={{ padding:'10px 14px', fontSize:12 }}>{o.quantity} {o.unit}</td>
                    <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:G }}>J${o.total_amount?.toLocaleString()}</td>
                    <td style={{ padding:'10px 14px' }}><span style={{ fontSize:11, background:'#f3f4f6', padding:'2px 8px', borderRadius:20 }}>{o.status}</span></td>
                    <td style={{ padding:'10px 14px', fontSize:12, color: o.payment_status==='paid'?'#10b981':'#9ca3af' }}>{o.payment_status}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Certifications */}
      {tab === 'certifications' && (
        <div>
          <div style={{ marginBottom:14, display:'flex', gap:10 }}>
            <span style={{ fontSize:14, color:'#6b7280', display:'flex', alignItems:'center' }}>{certs.length} total certifications</span>
          </div>
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:750 }}>
              <thead><tr style={{ background:'#f9fafb' }}>
                {['Farmer','Parish','RADA ID','Cert Type','Cert No.','Issued By','Expiry','Status','Verified By'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6b7280', borderBottom:'1px solid #e5e7eb', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {certs.map((c:any, i:number) => {
                  const expired = c.expiry_date && new Date(c.expiry_date) < new Date()
                  return (
                    <tr key={c.id} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                      <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600 }}>{c.farmer_name}</td>
                      <td style={{ padding:'10px 14px', fontSize:12 }}>{c.parish||'—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:12, color:G }}>{c.rada_id||'—'}</td>
                      <td style={{ padding:'10px 14px' }}><span style={{ fontSize:12, background:'#f0fdf4', color:G, padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{c.cert_type}</span></td>
                      <td style={{ padding:'10px 14px', fontSize:12 }}>{c.cert_number||'—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:12 }}>{c.issued_by||'—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:12, color: expired?'#dc2626':'#374151' }}>{c.expiry_date||'—'}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:600,
                          background: c.status==='active'&&!expired?'#d1fae5':expired?'#fee2e2':'#fef9c3',
                          color: c.status==='active'&&!expired?'#065f46':expired?'#991b1b':'#854d0e'
                        }}>{expired?'expired':c.status}</span>
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, color:'#9ca3af' }}>{c.verified_by_name||'—'}</td>
                    </tr>
                  )
                })}
                {certs.length === 0 && <tr><td colSpan={9} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>No certifications yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div>
          <p style={{ color:'#6b7280', marginBottom:20 }}>Download data exports for ministry reporting and agricultural census purposes.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {[
              { title:'Farmer Registry CSV', desc:'Full list of registered farmers with RADA IDs, parishes, farms and certifications', url:'/api/reports/csv/farmers', icon:'👨‍🌾', badge:'Admin Only' },
              { title:'Market Listings CSV', desc:'All active crop listings with farmer details, prices, quantities and parishes', url:'/api/reports/csv/listings', icon:'🌿', badge:'Admin Only' },
              { title:'Trade Orders CSV', desc:'All orders with buyer, farmer, crop, prices and payment status', url:'/api/reports/csv/orders', icon:'📦', badge:'Admin Only' },
              { title:'Price History CSV', desc:'Full market price history for all 24 crops — publicly available', url:'/api/reports/csv/prices', icon:'📈', badge:'Public' },
            ].map(r => (
              <div key={r.title} style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
                <div style={{ fontSize:32, marginBottom:10 }}>{r.icon}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div style={{ fontSize:15, fontWeight:700 }}>{r.title}</div>
                  <span style={{ fontSize:11, background: r.badge==='Public'?'#d1fae5':'#fef9c3', color: r.badge==='Public'?'#065f46':'#854d0e', padding:'1px 8px', borderRadius:20, fontWeight:600 }}>{r.badge}</span>
                </div>
                <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 16px', lineHeight:1.5 }}>{r.desc}</p>
                <button onClick={() => window.open(r.url,'_blank')} style={{ padding:'9px 20px', background:G, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  📥 Download CSV
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop:24, background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>🌐 Ministry Public Statistics Portal</h3>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>Share this link with ministry officials — publicly accessible statistics dashboard.</p>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ flex:1, padding:'10px 14px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, color:'#374151', fontFamily:'monospace' }}>
                {window.location.origin}/ministry
              </div>
              <button onClick={() => navigate('/ministry')} style={{ padding:'10px 18px', background:G, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 }}>View Portal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
