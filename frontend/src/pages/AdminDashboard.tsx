import { useState, useEffect } from 'react'
import { apiFetch } from '../api'

const G = '#2d6a4f'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState<'overview'|'users'|'orders'>('overview')

  useEffect(() => {
    Promise.all([apiFetch('/admin/stats'), apiFetch('/admin/users'), apiFetch('/admin/orders')])
      .then(([s,u,o]) => { setStats(s); setUsers(u); setOrders(o) })
  }, [])

  if (!stats) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Loading...</div>

  return (
    <div style={{ padding:32 }}>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>🏛️ AgroJM Admin</h1>
      <p style={{ color:'#6b7280', marginBottom:28 }}>Platform overview and management</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:32 }}>
        {[
          { label:'Farmers', val: stats.farmers },
          { label:'Buyers', val: stats.buyers },
          { label:'Active Listings', val: stats.listings },
          { label:'Total Orders', val: stats.orders },
          { label:'Revenue (J$)', val: `J$${(stats.revenue||0).toLocaleString()}` },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:20, textAlign:'center', border:'1px solid #e5e7eb' }}>
            <div style={{ fontSize:28, fontWeight:800, color:G }}>{s.val}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {[['overview','Overview'],['users','Users'],['orders','Orders']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t as any)} style={{ padding:'9px 18px', background:tab===t?G:'#fff', color:tab===t?'#fff':'#374151', border:`1.5px solid ${tab===t?G:'#d1d5db'}`, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Top Crops Listed</h3>
            {stats.topCrops?.map((c:any) => (
              <div key={c.name} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ fontSize:14 }}>{c.name}</span>
                <span style={{ fontSize:14, fontWeight:700, color:G }}>{c.count} listings</span>
              </div>
            ))}
          </div>
          <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Listings by Parish</h3>
            {stats.parishes?.map((p:any) => (
              <div key={p.parish} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ fontSize:14 }}>{p.parish}</span>
                <span style={{ fontSize:14, fontWeight:700, color:G }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
            <thead><tr style={{ background:'#f9fafb' }}>
              {['Name','Email','Role','Parish','Verified','Actions'].map(h => <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, borderBottom:'1px solid #e5e7eb' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map((u:any, i:number) => (
                <tr key={u.id} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                  <td style={{ padding:'11px 16px', fontSize:14, fontWeight:600 }}>{u.name}</td>
                  <td style={{ padding:'11px 16px', fontSize:13, color:'#6b7280' }}>{u.email}</td>
                  <td style={{ padding:'11px 16px' }}><span style={{ fontSize:12, background:'#f0fdf4', color:G, padding:'2px 10px', borderRadius:20 }}>{u.role}</span></td>
                  <td style={{ padding:'11px 16px', fontSize:13 }}>{u.parish||'—'}</td>
                  <td style={{ padding:'11px 16px', fontSize:13 }}>{u.verified ? '✅':'⏳'}</td>
                  <td style={{ padding:'11px 16px' }}>
                    {!u.verified && <button onClick={async () => { await apiFetch(`/admin/users/${u.id}/verify`, {method:'PATCH'}); apiFetch('/admin/users').then(setUsers) }}
                      style={{ background:G, color:'#fff', border:'none', padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:12, marginRight:6 }}>Verify</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead><tr style={{ background:'#f9fafb' }}>
              {['Crop','Buyer','Farmer','Qty','Total','Status','Payment'].map(h => <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, borderBottom:'1px solid #e5e7eb' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {orders.map((o:any, i:number) => (
                <tr key={o.id} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                  <td style={{ padding:'11px 16px', fontSize:14 }}>{o.listing_title}</td>
                  <td style={{ padding:'11px 16px', fontSize:13 }}>{o.buyer_name}</td>
                  <td style={{ padding:'11px 16px', fontSize:13 }}>{o.farmer_name}</td>
                  <td style={{ padding:'11px 16px', fontSize:13 }}>{o.quantity} {o.unit}</td>
                  <td style={{ padding:'11px 16px', fontSize:14, fontWeight:700, color:G }}>J${o.total_amount?.toLocaleString()}</td>
                  <td style={{ padding:'11px 16px' }}><span style={{ fontSize:12, background:'#f3f4f6', padding:'2px 8px', borderRadius:20 }}>{o.status}</span></td>
                  <td style={{ padding:'11px 16px', fontSize:13, color: o.payment_status==='paid'?'#10b981':'#9ca3af' }}>{o.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
