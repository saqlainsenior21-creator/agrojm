import { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'

const typeIcon: Record<string,string> = { seed:'🌱', fertilizer:'🧪', equipment:'🚜', loan:'💳', training:'📚', insurance:'🛡️', land:'🏞️', other:'📦' }
const typeColor: Record<string,string> = { seed:'#10b981', fertilizer:'#3b82f6', equipment:'#f59e0b', loan:'#8b5cf6', training:'#06b6d4', insurance:'#ef4444', land:'#6b7280', other:'#9ca3af' }

export default function Subsidies() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState<any[]>([])
  const [myApps, setMyApps] = useState<any[]>([])
  const [tab, setTab] = useState<'programs'|'my_apps'>('programs')
  const [applying, setApplying] = useState<string|null>(null)
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/subsidies').then(r => r.json()).catch(() => []),
      user?.role === 'farmer' ? apiFetch('/subsidies/my').catch(() => []) : Promise.resolve([])
    ]).then(([p, a]) => { setPrograms(p); setMyApps(a) })
      .finally(() => setLoading(false))
  }, [user])

  function hasApplied(id: string) {
    return myApps.some(a => a.subsidy_id === id)
  }

  async function apply(id: string) {
    try {
      await apiFetch(`/subsidies/${id}/apply`, { method:'POST', body: JSON.stringify({ justification }) })
      alert('✅ Application submitted successfully!')
      setApplying(null); setJustification('')
      const a = await apiFetch('/subsidies/my'); setMyApps(a)
    } catch(e:any) { alert(e.message) }
  }

  const statusColors: Record<string,string> = { applied:'#3b82f6', under_review:'#f59e0b', approved:'#10b981', rejected:'#ef4444', disbursed:'#8b5cf6' }
  const statusIcons: Record<string,string> = { applied:'📤', under_review:'🔍', approved:'✅', rejected:'❌', disbursed:'💰' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Loading...</div>

  return (
    <div style={{ padding:32 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>💰 Government Agricultural Programs</h1>
        <p style={{ color:'#6b7280' }}>Ministry of Agriculture subsidies and support programs for Jamaican farmers</p>
      </div>

      {user?.role === 'farmer' && (
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {[['programs','Available Programs'],['my_apps','My Applications']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              style={{ padding:'9px 18px', background: tab===t?G:'#fff', color: tab===t?'#fff':'#374151', border:`1.5px solid ${tab===t?G:'#d1d5db'}`, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>
              {l} {t==='my_apps' && myApps.length > 0 && <span style={{ background:'#ef4444', color:'#fff', borderRadius:'50%', fontSize:11, padding:'1px 6px', marginLeft:6 }}>{myApps.length}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Programs Grid */}
      {tab === 'programs' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:20 }}>
          {programs.map((p:any) => {
            const applied = hasApplied(p.id)
            const pct = p.max_applicants ? Math.round((p.applicant_count/p.max_applicants)*100) : 0
            const deadline = p.application_deadline ? new Date(p.application_deadline) : null
            const expired = deadline && deadline < new Date()
            return (
              <div key={p.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden', display:'flex', flexDirection:'column' }}>
                <div style={{ background:`${typeColor[p.subsidy_type]}15`, borderBottom:`2px solid ${typeColor[p.subsidy_type]}`, padding:'16px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <span style={{ fontSize:24 }}>{typeIcon[p.subsidy_type]}</span>
                    <span style={{ fontSize:12, background:typeColor[p.subsidy_type], color:'#fff', padding:'2px 10px', borderRadius:20, fontWeight:700, textTransform:'uppercase' }}>
                      {p.subsidy_type}
                    </span>
                    {expired && <span style={{ fontSize:11, background:'#fef2f2', color:'#ef4444', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>Closed</span>}
                  </div>
                  <h3 style={{ fontSize:15, fontWeight:700, margin:0, color:'#111827' }}>{p.title}</h3>
                </div>
                <div style={{ padding:'16px 20px', flex:1 }}>
                  <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 14px', lineHeight:1.6 }}>{p.description}</p>
                  {p.amount_jmd > 0 && (
                    <div style={{ fontSize:18, fontWeight:800, color:G, marginBottom:10 }}>
                      J${p.amount_jmd.toLocaleString()} <span style={{ fontSize:13, fontWeight:400, color:'#9ca3af' }}>benefit value</span>
                    </div>
                  )}
                  {p.eligibility && (
                    <div style={{ background:'#f9fafb', borderRadius:6, padding:'8px 12px', fontSize:12, color:'#374151', marginBottom:12 }}>
                      <strong>Eligibility:</strong> {p.eligibility}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:16, fontSize:12, color:'#9ca3af', marginBottom:p.max_applicants ? 10 : 0 }}>
                    {p.application_deadline && (
                      <span>📅 Deadline: {new Date(p.application_deadline).toLocaleDateString()}</span>
                    )}
                    <span>👥 {p.applicant_count} applied</span>
                    {p.max_applicants && <span>Max: {p.max_applicants}</span>}
                  </div>
                  {p.max_applicants && (
                    <div style={{ background:'#f3f4f6', borderRadius:4, height:6, overflow:'hidden', marginBottom:12 }}>
                      <div style={{ width:`${Math.min(pct,100)}%`, background:pct > 80 ? '#ef4444' : G, height:'100%' }} />
                    </div>
                  )}
                </div>
                {user?.role === 'farmer' && (
                  <div style={{ padding:'0 20px 16px' }}>
                    {applied ? (
                      <div style={{ padding:'8px 14px', background:'#f0fdf4', borderRadius:7, fontSize:13, color:G, fontWeight:600, textAlign:'center', border:'1px solid #bbf7d0' }}>
                        ✅ Application Submitted
                      </div>
                    ) : expired ? (
                      <div style={{ padding:'8px 14px', background:'#fef2f2', borderRadius:7, fontSize:13, color:'#9ca3af', textAlign:'center' }}>
                        Application period closed
                      </div>
                    ) : (
                      <>
                        {applying === p.id ? (
                          <div>
                            <textarea placeholder="Why are you applying? Describe your farming situation..." value={justification} onChange={e => setJustification(e.target.value)}
                              rows={3} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #d1d5db', borderRadius:6, fontSize:13, boxSizing:'border-box', resize:'vertical', marginBottom:8 }} />
                            <div style={{ display:'flex', gap:8 }}>
                              <button onClick={() => apply(p.id)} style={{ flex:1, padding:'8px', background:G, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:13 }}>Submit Application</button>
                              <button onClick={() => setApplying(null)} style={{ padding:'8px 14px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:6, cursor:'pointer', fontSize:13 }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setApplying(p.id)} style={{ width:'100%', padding:'9px', background:G, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:14 }}>
                            Apply Now →
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {programs.length === 0 && (
            <div style={{ gridColumn:'1/-1', background:'#fff', borderRadius:12, padding:48, textAlign:'center', border:'1px solid #e5e7eb', color:'#9ca3af' }}>
              No programs available at this time
            </div>
          )}
        </div>
      )}

      {/* My Applications */}
      {tab === 'my_apps' && user?.role === 'farmer' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {myApps.length === 0 ? (
            <div style={{ background:'#fff', borderRadius:12, padding:48, textAlign:'center', border:'1px solid #e5e7eb', color:'#9ca3af' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>No Applications Yet</div>
              <div>Browse available programs and apply for support</div>
            </div>
          ) : myApps.map((a:any) => {
            const sc = statusColors[a.status] || '#9ca3af'
            return (
              <div key={a.id} style={{ background:'#fff', borderRadius:12, border:`1px solid ${sc}40`, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <span style={{ fontSize:16 }}>{typeIcon[a.subsidy_type]}</span>
                      <span style={{ fontSize:14, fontWeight:700 }}>{a.program_title}</span>
                    </div>
                    {a.amount_jmd > 0 && <div style={{ fontSize:13, color:G, fontWeight:600 }}>J${a.amount_jmd.toLocaleString()} benefit</div>}
                    <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Applied: {new Date(a.created_at).toLocaleDateString()}</div>
                    {a.review_notes && <div style={{ fontSize:13, color:'#374151', marginTop:8, padding:'8px 12px', background:'#f9fafb', borderRadius:6 }}><strong>Review notes:</strong> {a.review_notes}</div>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{statusIcons[a.status]}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:sc, textTransform:'capitalize' }}>{a.status.replace('_',' ')}</div>
                    {a.reviewed_by_name && <div style={{ fontSize:11, color:'#9ca3af' }}>by {a.reviewed_by_name}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
