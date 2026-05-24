import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'
const PARISHES = ['','Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

const severityStyle = (s: string) => ({
  watch: { bg:'#fef9c3', color:'#854d0e', border:'#fde68a' },
  warning: { bg:'#fff7ed', color:'#9a3412', border:'#fed7aa' },
  emergency: { bg:'#fef2f2', color:'#991b1b', border:'#fca5a5' },
}[s] || { bg:'#f3f4f6', color:'#374151', border:'#e5e7eb' })

const alertIcon = (t: string) => ({ pest:'🐛', disease:'🦠', blight:'🍂', infestation:'🐝', advisory:'📢', quarantine:'🚫' }[t] || '⚠️')

export default function PestAlerts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<any[]>([])
  const [cropTypes, setCropTypes] = useState<any[]>([])
  const [filterParish, setFilterParish] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ parish:'', crop_type_id:'', alert_type:'pest', severity:'watch', title:'', message:'', affected_crops:'', recommended_action:'', valid_until:'' })

  const canCreate = user?.role === 'admin' || user?.role === 'extension_officer'

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterParish) params.set('parish', filterParish)
    if (filterSeverity) params.set('severity', filterSeverity)
    fetch(`/api/alerts?${params}`).then(r => r.json()).then(setAlerts).catch(() => setAlerts([]))
    fetch('/api/crops/types').then(r => r.json()).then(setCropTypes).catch(() => {})
  }, [filterParish, filterSeverity])

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submitAlert(e: any) {
    e.preventDefault()
    try {
      await apiFetch('/alerts', { method:'POST', body: JSON.stringify(form) })
      setShowForm(false)
      setForm({ parish:'', crop_type_id:'', alert_type:'pest', severity:'watch', title:'', message:'', affected_crops:'', recommended_action:'', valid_until:'' })
      const r = await fetch('/api/alerts'); setAlerts(await r.json())
    } catch(err:any) { alert(err.message) }
  }

  async function deactivate(id: string) {
    await apiFetch(`/alerts/${id}`, { method:'PATCH', body: JSON.stringify({ active: 0 }) })
    setAlerts(a => a.filter(x => x.id !== id))
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f4f7f4' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)`, color:'#fff', padding:'24px 32px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:11, opacity:0.7, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Jamaica Ministry of Agriculture</div>
              <h1 style={{ fontSize:24, fontWeight:800, margin:'0 0 4px' }}>⚠️ Pest & Disease Alert System</h1>
              <p style={{ opacity:0.8, margin:0, fontSize:13 }}>Official alerts issued by extension officers and RADA</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => navigate('/ministry')} style={{ padding:'8px 16px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', borderRadius:7, cursor:'pointer', fontSize:13 }}>📊 Ministry Portal</button>
              {canCreate && (
                <button onClick={() => setShowForm(!showForm)} style={{ padding:'8px 16px', background:'#fff', color:'#7c2d12', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700 }}>
                  + Issue Alert
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'24px' }}>
        {/* Issue Alert Form */}
        {showForm && canCreate && (
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'2px solid #fca5a5', marginBottom:24 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:'#7c2d12' }}>Issue New Alert</h3>
            <form onSubmit={submitAlert}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <select value={form.alert_type} onChange={set('alert_type')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }}>
                  {['pest','disease','blight','infestation','advisory','quarantine'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
                <select value={form.severity} onChange={set('severity')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }}>
                  <option value="watch">🟡 Watch</option>
                  <option value="warning">🟠 Warning</option>
                  <option value="emergency">🔴 Emergency</option>
                </select>
                <select value={form.parish} onChange={set('parish')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }}>
                  <option value=''>All Parishes (National)</option>
                  {PARISHES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={form.crop_type_id} onChange={set('crop_type_id')} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }}>
                  <option value=''>All crops</option>
                  {cropTypes.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <input placeholder="Alert title *" value={form.title} onChange={set('title')} required
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14, boxSizing:'border-box', marginBottom:10 }} />
              <textarea placeholder="Detailed message describing the threat *" value={form.message} onChange={set('message')} required rows={3}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14, boxSizing:'border-box', resize:'vertical', marginBottom:10 }} />
              <textarea placeholder="Affected crops (e.g. Tomato, Sweet Pepper, Callaloo)" value={form.affected_crops} onChange={set('affected_crops')} rows={2}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14, boxSizing:'border-box', resize:'vertical', marginBottom:10 }} />
              <textarea placeholder="Recommended action for farmers" value={form.recommended_action} onChange={set('recommended_action')} rows={2}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14, boxSizing:'border-box', resize:'vertical', marginBottom:10 }} />
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <label style={{ fontSize:13, color:'#374151' }}>Valid until:</label>
                <input type="date" value={form.valid_until} onChange={set('valid_until')}
                  style={{ padding:'7px 12px', border:'1.5px solid #d1d5db', borderRadius:7, fontSize:14 }} />
                <button type="submit" style={{ marginLeft:'auto', padding:'9px 24px', background:'#dc2626', color:'#fff', border:'none', borderRadius:7, fontWeight:700, cursor:'pointer' }}>
                  Issue Alert
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding:'9px 16px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:7, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <select value={filterParish} onChange={e => setFilterParish(e.target.value)} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, background:'#fff' }}>
            {PARISHES.map(p => <option key={p} value={p}>{p || 'All Parishes'}</option>)}
          </select>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={{ padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, background:'#fff' }}>
            <option value=''>All Severities</option>
            <option value='watch'>🟡 Watch</option>
            <option value='warning'>🟠 Warning</option>
            <option value='emergency'>🔴 Emergency</option>
          </select>
          <div style={{ fontSize:13, color:'#6b7280', display:'flex', alignItems:'center' }}>
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Alert Cards */}
        {alerts.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:12, padding:48, textAlign:'center', border:'1px solid #e5e7eb' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4, color:G }}>No Active Alerts</div>
            <div style={{ color:'#9ca3af' }}>No pest or disease alerts are currently active for your selected filters.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {alerts.map((a:any) => {
              const style = severityStyle(a.severity)
              return (
                <div key={a.id} style={{ background:style.bg, border:`1px solid ${style.border}`, borderRadius:12, padding:20 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:20 }}>{alertIcon(a.alert_type)}</span>
                        <span style={{ fontSize:12, background:style.color, color:'#fff', padding:'2px 10px', borderRadius:20, fontWeight:700, textTransform:'uppercase' }}>{a.severity}</span>
                        <span style={{ fontSize:12, color:style.color, fontWeight:600, textTransform:'capitalize' }}>{a.alert_type}</span>
                        {a.parish && <span style={{ fontSize:12, background:'rgba(0,0,0,0.08)', color:style.color, padding:'2px 8px', borderRadius:20 }}>📍 {a.parish}</span>}
                        {!a.parish && <span style={{ fontSize:12, background:'rgba(0,0,0,0.08)', color:style.color, padding:'2px 8px', borderRadius:20 }}>🇯🇲 National</span>}
                        {a.crop_name && <span style={{ fontSize:12, background:'rgba(0,0,0,0.08)', color:style.color, padding:'2px 8px', borderRadius:20 }}>🌿 {a.crop_name}</span>}
                      </div>
                      <h3 style={{ fontSize:16, fontWeight:700, color:style.color, margin:'0 0 8px' }}>{a.title}</h3>
                      <p style={{ fontSize:14, color:style.color, margin:'0 0 10px', opacity:0.85 }}>{a.message}</p>
                      {a.affected_crops && (
                        <div style={{ fontSize:13, color:style.color, marginBottom:6 }}>
                          <strong>Affected crops:</strong> {a.affected_crops}
                        </div>
                      )}
                      {a.recommended_action && (
                        <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:6, padding:'8px 12px', fontSize:13, color:style.color, marginBottom:8 }}>
                          <strong>⚡ Recommended Action:</strong> {a.recommended_action}
                        </div>
                      )}
                      <div style={{ fontSize:11, color:style.color, opacity:0.6 }}>
                        Issued by: {a.issued_by_name || 'Ministry of Agriculture'} · {new Date(a.created_at).toLocaleDateString('en-JM', { year:'numeric', month:'long', day:'numeric' })}
                        {a.valid_until && ` · Valid until: ${new Date(a.valid_until).toLocaleDateString()}`}
                      </div>
                    </div>
                    {canCreate && (
                      <button onClick={() => deactivate(a.id)}
                        style={{ flexShrink:0, padding:'5px 10px', background:'rgba(0,0,0,0.1)', color:style.color, border:'none', borderRadius:6, cursor:'pointer', fontSize:12 }}>
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
