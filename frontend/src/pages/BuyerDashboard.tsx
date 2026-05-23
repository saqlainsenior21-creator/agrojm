import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'

export default function BuyerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/orders').then(setOrders).finally(() => setLoading(false))
  }, [])

  const total = orders.reduce((s, o) => s + (o.payment_status === 'paid' ? o.total_amount : 0), 0)

  const statusColor = (s: string) => ({ pending:'#f59e0b', confirmed:'#3b82f6', paid:'#10b981', delivered:'#6b7280', cancelled:'#ef4444' }[s] || '#9ca3af')

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Loading...</div>

  return (
    <div style={{ padding:32 }}>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>📦 Welcome, {user?.business_name || user?.name}</h1>
      <p style={{ color:'#6b7280', marginBottom:28 }}>{user?.buyer_type} · {user?.parish}</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:32 }}>
        {[
          { label:'Total Orders', val: orders.length },
          { label:'Pending', val: orders.filter(o => o.status==='pending').length },
          { label:'Delivered', val: orders.filter(o => o.status==='delivered').length },
          { label:'Total Spent', val: `J$${total.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:20, textAlign:'center', border:'1px solid #e5e7eb' }}>
            <div style={{ fontSize:28, fontWeight:800, color:G }}>{s.val}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:24 }}>
        <button onClick={() => navigate('/marketplace')} style={{ background:G, color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>🛒 Browse Marketplace</button>
        <button onClick={() => navigate('/prices')} style={{ background:'#fff', color:G, border:`1.5px solid ${G}`, padding:'10px 24px', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>📈 View Prices</button>
      </div>

      <h2 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>My Orders</h2>
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
        {orders.length === 0
          ? <div style={{ padding:40, textAlign:'center', color:'#6b7280' }}>No orders yet. <button onClick={() => navigate('/marketplace')} style={{ color:G, background:'none', border:'none', fontWeight:600, cursor:'pointer' }}>Browse the marketplace →</button></div>
          : <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'#f9fafb' }}>
              {['Crop','Farmer','Qty','Total','Status','Payment'].map(h => <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, borderBottom:'1px solid #e5e7eb' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {orders.map((o:any, i:number) => (
                <tr key={o.id} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                  <td style={{ padding:'12px 16px', fontSize:14, fontWeight:600 }}>{o.crop_name}</td>
                  <td style={{ padding:'12px 16px', fontSize:14 }}>{o.farmer_name}<br/><span style={{ fontSize:12, color:'#9ca3af' }}>{o.farmer_phone}</span></td>
                  <td style={{ padding:'12px 16px', fontSize:14 }}>{o.quantity} {o.unit}</td>
                  <td style={{ padding:'12px 16px', fontSize:14, fontWeight:700, color:G }}>J${o.total_amount?.toLocaleString()}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:12, background:`${statusColor(o.status)}20`, color:statusColor(o.status), padding:'3px 10px', borderRadius:20, fontWeight:600 }}>{o.status}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    {o.payment_status === 'unpaid' && o.status === 'confirmed' ? (
                      <button onClick={async () => {
                        try { const r = await apiFetch('/payments/initiate', {method:'POST', body:JSON.stringify({order_id:o.id})}); window.open(r.payment_url,'_blank') }
                        catch(e:any) { alert(e.message) }
                      }} style={{ background:G, color:'#fff', border:'none', padding:'5px 12px', borderRadius:6, cursor:'pointer', fontSize:12 }}>Pay Now</button>
                    ) : <span style={{ fontSize:12, color: o.payment_status==='paid'?'#10b981':'#9ca3af' }}>{o.payment_status}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
    </div>
  )
}
