import { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'
const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

export default function OfficerDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'overview'|'farmers'|'production'|'subsidies'>('overview')
  const [stats, setStats] = useState<any>(null)
  const [farmers, setFarmers] = useState<any[]>([])
  const [production, setProduction] = useState<any>(null)
  const [subApps, setSubApps] = useState<any[]>([])
  const [filterParish, setFilterParish] = useState(user?.extension_parish || '')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [loading, setLoading] = useState(true)

  const parish = filterParish || user?.extension_parish || ''

  useEffect(() => {
    const params = new URLSearchParams()
    if (parish) params.set('parish', parish)
    Promise.all([
      apiFetch(`/officer/dashboard${parish ? `?parish=${parish}` : ''}`),
      apiFetch(`/officer/farmers?status=${filterStatus}${parish ? `&parish=${parish}` : ''}`),
      apiFetch(`/officer/production${parish ? `?parish=${parish}` : ''}`),
      apiFetch('/subsidies/applications'),
    ]).then(([s,f,p,sa]) => { setStats(s); setFarmers(f); setProduction(p); setSubApps(sa) })
      .finally(() => setLoading(false))
  }, [filterStatus, parish])

  async function verifyFarmer(id: string, status: string) {
    await apiFetch(`/officer/farmers/${id}/verify`, { method:'PATCH', body: JSON.stringify({ status }) })
    setFarmers(f => f.filter(x => x.id !== id))
  }

  async function reviewSubApp(id: string, status: string) {
    const notes = status === 'rejected' ? prompt('Reason for rejection:') || '' : ''
    await apiFetch(`/subsidies/applications/${id}`, { method:'PATCH', body: JSON.stringify({ status, review_notes: notes }) })
    setSubApps(a => a.map(x => x.id === id ? { ...x, status } : x))
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Loading...</div>

  return (
    <div style={{ padding:32 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>🏛️ Extension Officer Dashboard</h1>
          <p style={{ color:'#6b7280', margin:0 }}>
            {user?.name} · RADA Extension Officer
            {user?.extension_parish ? ` · ${user.extension_parish} Parish` : ' · All Parishes'}
          </p>
        </div>
        <select value={filterParish} onChange={e => setFilterParish(e.target.value)}
          style={{ padding:'9px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, background:'#fff' }}>
          <option value=''>All Parishes</option>
          {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:28 }}>
          {[
            { label:'Farmers in Parish', val: stats.farmers, icon:'👨‍🌾' },
            { label:'Pending Verification', val: stats.pendingVerifications, icon:'⏳', alert: stats.pendingVerifications > 0 },
            { label:'Active Listings', val: stats.activeListings, icon:'🌿' },
            { label:'Certifications', val: stats.certifications, icon:'📋' },
            { label:'Active Alerts', val: stats.activeAlerts, icon:'⚠️' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:20, textAlign:'center', border:`1px solid ${s.alert ? '#fca5a5' : '#e5e7eb'}`, background: s.alert ? '#fef2f2' : '#fff' }}>
              <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:28, fontWeight:800, color: s.alert ? '#dc2626' : G }}>{s.val}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {[['overview','📊 Overview'],['farmers','👨‍🌾 Farmer Verification'],['production','🌾 Production Data'],['subsidies','💰 Subsidy Applications']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t as any)}
            style={{ padding:'9px 18px', background: tab===t?G:'#fff', color: tab===t?'#fff':'#374151', border:`1.5px solid ${tab===t?G:'#d1d5db'}`, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>
            {l}
            {t==='farmers' && filterStatus==='pending' && farmers.length > 0 && (
              <span style={{ background:'#ef4444', color:'#fff', borderRadius:'50%', fontSize:11, padding:'1px 6px', marginLeft:6 }}>{farmers.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && production && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>🌾 Production by Crop</h3>
            {production.byParish?.slice(0,10).map((r:any) => (
              <div key={`${r.parish}-${r.crop_name}`} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{r.crop_name}</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>{r.parish}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:G }}>{r.listing_count} listings</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>avg J${Math.round(r.avg_price||0)}/unit</div>
                </div>
              </div>
            ))}
            {(!production.byParish || production.byParish.length === 0) && <p style={{ color:'#9ca3af', fontSize:13 }}>No production data yet</p>}
          </div>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>📦 Harvest Records</h3>
            {production.cropYields?.map((c:any) => (
              <div key={c.crop_name} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3f4f6' }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{c.crop_name}</div>
                <div style={{ fontSize:13, color:G, fontWeight:700 }}>{c.total_harvested?.toLocaleString()||0} units harvested</div>
              </div>
            ))}
            {(!production.cropYields || production.cropYields.length === 0) && <p style={{ color:'#9ca3af', fontSize:13 }}>No harvest data yet</p>}
          </div>
        </div>
      )}

      {/* Farmer Verification */}
      {tab === 'farmers' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            {[['pending','⏳ Pending'],['verified','✅ Verified'],['rejected','❌ Rejected']].map(([s,l]) => (
              <button key={s} onClick={() => { setFilterStatus(s); apiFetch(`/officer/farmers?status=${s}${parish?`&parish=${parish}`:''}`).then(setFarmers) }}
                style={{ padding:'7px 16px', background: filterStatus===s?G:'#fff', color: filterStatus===s?'#fff':'#374151', border:`1.5px solid ${filterStatus===s?G:'#d1d5db'}`, borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                {l}
              </button>
            ))}
          </div>
          {farmers.length === 0 ? (
            <div style={{ background:'#fff', borderRadius:12, padding:40, textAlign:'center', border:'1px solid #e5e7eb', color:'#9ca3af' }}>
              No farmers with status "{filterStatus}" in this parish
            </div>
          ) : (
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                <thead><tr style={{ background:'#f9fafb' }}>
                  {['Farmer','Parish','RADA ID','NIN','Farms','Listings','Certs','Actions'].map(h => (
                    <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6b7280', borderBottom:'1px solid #e5e7eb', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {farmers.map((f:any) => (
                    <tr key={f.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ fontSize:14, fontWeight:600 }}>{f.name}</div>
                        <div style={{ fontSize:12, color:'#9ca3af' }}>{f.email}</div>
                        {f.phone && <div style={{ fontSize:12, color:'#9ca3af' }}>{f.phone}</div>}
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:13 }}>{f.parish||'—'}</td>
                      <td style={{ padding:'12px 14px' }}>
                        {f.rada_id ? <span style={{ fontSize:12, background:'#f0fdf4', color:G, padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{f.rada_id}</span>
                          : <span style={{ fontSize:12, color:'#d1d5db' }}>Not provided</span>}
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:13 }}>{f.national_id || '—'}</td>
                      <td style={{ padding:'12px 14px', fontSize:13, textAlign:'center' }}>{f.farm_count}</td>
                      <td style={{ padding:'12px 14px', fontSize:13, textAlign:'center' }}>{f.active_listings}</td>
                      <td style={{ padding:'12px 14px', fontSize:13, textAlign:'center' }}>{f.cert_count}</td>
                      <td style={{ padding:'12px 14px' }}>
                        {filterStatus === 'pending' && (
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={() => verifyFarmer(f.id,'verified')}
                              style={{ padding:'5px 10px', background:G, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                              ✅ Verify
                            </button>
                            <button onClick={() => verifyFarmer(f.id,'rejected')}
                              style={{ padding:'5px 10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5', borderRadius:6, cursor:'pointer', fontSize:12 }}>
                              Reject
                            </button>
                          </div>
                        )}
                        {filterStatus !== 'pending' && (
                          <span style={{ fontSize:12, color:'#9ca3af' }}>{new Date(f.created_at).toLocaleDateString()}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Production Data */}
      {tab === 'production' && production && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <button onClick={() => window.open(`/api/reports/csv/listings?parish=${parish}`, '_blank')}
              style={{ padding:'9px 18px', background:G, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600 }}>
              📥 Export Listings CSV
            </button>
            <button onClick={() => window.open('/api/reports/csv/prices', '_blank')}
              style={{ padding:'9px 18px', background:'#fff', color:G, border:`1.5px solid ${G}`, borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600 }}>
              📥 Price History CSV
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Active Market Listings</h3>
              {production.byParish?.map((r:any, i:number) => (
                <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{r.crop_name} — {r.parish}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:G }}>{r.listing_count} listings</span>
                  </div>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>
                    {r.total_quantity?.toLocaleString()} units · avg J${Math.round(r.avg_price||0)}
                  </div>
                </div>
              ))}
              {(!production.byParish?.length) && <p style={{ color:'#9ca3af', fontSize:13 }}>No data</p>}
            </div>
            <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Harvest Records</h3>
              {production.cropYields?.map((c:any) => (
                <div key={c.crop_name} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{c.crop_name}</div>
                    <div style={{ fontSize:11, color:'#9ca3af' }}>{c.log_count} harvest records</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:G }}>{c.total_harvested?.toLocaleString()||0} units</div>
                </div>
              ))}
              {(!production.cropYields?.length) && <p style={{ color:'#9ca3af', fontSize:13 }}>No harvest data</p>}
            </div>
          </div>
        </div>
      )}

      {/* Subsidy Applications */}
      {tab === 'subsidies' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#374151' }}>{subApps.length} applications</span>
            <button onClick={() => window.open('/api/reports/csv/farmers','_blank')}
              style={{ marginLeft:'auto', padding:'8px 16px', background:G, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 }}>
              📥 Export Farmer Registry
            </button>
          </div>
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:750 }}>
              <thead><tr style={{ background:'#f9fafb' }}>
                {['Farmer','Parish','RADA ID','Program','Type','Amount','Status','Action'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6b7280', borderBottom:'1px solid #e5e7eb', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {subApps.map((a:any) => (
                  <tr key={a.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:600 }}>{a.farmer_name}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#6b7280' }}>{a.parish||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:G }}>{a.rada_id||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12 }}>{a.program_title}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, textTransform:'capitalize' }}>{a.subsidy_type}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, fontWeight:700, color:G }}>{a.amount_jmd > 0 ? `J$${a.amount_jmd.toLocaleString()}` : 'Free'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:600,
                        background: a.status==='approved'?'#d1fae5' : a.status==='rejected'?'#fee2e2' : a.status==='disbursed'?'#ede9fe' : '#fef9c3',
                        color: a.status==='approved'?'#065f46' : a.status==='rejected'?'#991b1b' : a.status==='disbursed'?'#5b21b6' : '#854d0e'
                      }}>{a.status.replace('_',' ')}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      {a.status === 'applied' && (
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => reviewSubApp(a.id,'approved')} style={{ padding:'4px 10px', background:G, color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontSize:12 }}>Approve</button>
                          <button onClick={() => reviewSubApp(a.id,'rejected')} style={{ padding:'4px 10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5', borderRadius:5, cursor:'pointer', fontSize:12 }}>Reject</button>
                        </div>
                      )}
                      {a.status === 'approved' && (
                        <button onClick={() => reviewSubApp(a.id,'disbursed')} style={{ padding:'4px 10px', background:'#8b5cf6', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontSize:12 }}>Mark Disbursed</button>
                      )}
                    </td>
                  </tr>
                ))}
                {subApps.length === 0 && (
                  <tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>No applications yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
