import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const G = '#2d6a4f'
const GOLD = '#f59f00'

export default function MinistryPortal() {
  const [data, setData] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/reports/ministry')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [])

  const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

  const catColors: Record<string,string> = { vegetable:'#10b981', fruit:'#f59e0b', root:'#8b5cf6', herb:'#06b6d4', grain:'#f97316', livestock:'#ef4444' }

  return (
    <div style={{ minHeight:'100vh', background:'#f4f7f4' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${G} 0%, #1b4332 100%)`, color:'#fff', padding:'32px 40px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                <span style={{ fontSize:36 }}>🇯🇲</span>
                <div>
                  <div style={{ fontSize:11, opacity:0.7, textTransform:'uppercase', letterSpacing:1 }}>Jamaica Ministry of Agriculture & Food Security</div>
                  <h1 style={{ fontSize:28, fontWeight:800, margin:0 }}>AgroJM Agricultural Statistics Portal</h1>
                </div>
              </div>
              <p style={{ opacity:0.8, margin:0, fontSize:14 }}>Real-time data on Jamaica's agricultural marketplace · Updated live</p>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={() => window.open('/api/reports/csv/prices','_blank')}
                style={{ padding:'9px 18px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                📥 Price Data CSV
              </button>
              <button onClick={() => navigate('/alerts')}
                style={{ padding:'9px 18px', background:GOLD, color:'#000', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                ⚠️ Pest Alerts
              </button>
              <button onClick={() => navigate('/marketplace')}
                style={{ padding:'9px 18px', background:'#fff', color:G, border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                🛒 Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>
        {!data ? (
          <div style={{ textAlign:'center', padding:60, color:'#6b7280' }}>Loading ministry statistics...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:32 }}>
              {[
                { icon:'👨‍🌾', label:'Registered Farmers', val: data.summary.totalFarmers, sub: `${data.summary.verifiedFarmers} RADA verified` },
                { icon:'🏭', label:'Active Farms', val: data.summary.totalFarms, sub:'across all parishes' },
                { icon:'🌿', label:'Active Listings', val: data.summary.totalListings, sub:'crops on market' },
                { icon:'🏨', label:'Registered Buyers', val: data.summary.totalBuyers, sub:'hotels, supermarkets & more' },
                { icon:'💰', label:'Trade Value (J$)', val: `J$${(data.summary.tradeValue||0).toLocaleString()}`, sub:'total transactions' },
                { icon:'📋', label:'Certifications', val: data.summary.totalCerts, sub:'GAP & organic' },
                { icon:'⚠️', label:'Active Alerts', val: data.summary.activeAlerts, sub:'pest & disease' },
              ].map(s => (
                <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:20, textAlign:'center', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize:28, marginBottom:4 }}>{s.icon}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:G }}>{s.val}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
              {/* Farmers by Parish */}
              <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, display:'flex', justifyContent:'space-between' }}>
                  👨‍🌾 Farmers by Parish
                  <span style={{ fontSize:12, color:'#9ca3af', fontWeight:400 }}>{data.summary.totalFarmers} total</span>
                </h3>
                {PARISHES.map(parish => {
                  const p = data.farmersByParish.find((x:any) => x.parish === parish) || { count: 0 }
                  const max = Math.max(...data.farmersByParish.map((x:any) => x.count), 1)
                  return (
                    <div key={parish} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <div style={{ fontSize:12, color:'#374151', width:120, flexShrink:0 }}>{parish}</div>
                      <div style={{ flex:1, background:'#f3f4f6', borderRadius:4, height:16, overflow:'hidden' }}>
                        <div style={{ width:`${(p.count/max)*100}%`, background:G, height:'100%', minWidth: p.count ? 8 : 0, borderRadius:4, transition:'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:G, width:24, textAlign:'right' }}>{p.count}</div>
                    </div>
                  )
                })}
              </div>

              {/* Top Crops */}
              <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>🌾 Top Crops on Market</h3>
                {data.topCrops.length === 0 ? (
                  <p style={{ color:'#9ca3af', fontSize:13 }}>No listings yet</p>
                ) : data.topCrops.map((c:any, i:number) => (
                  <div key={c.crop_name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#9ca3af', width:20 }}>#{i+1}</span>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600 }}>{c.crop_name}</div>
                        <div style={{ fontSize:11, color:'#9ca3af' }}>
                          {c.total_qty?.toLocaleString()} units available · avg J${Math.round(c.avg_price||0)}/unit
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontSize:11, background:`${catColors[c.category]}20`, color:catColors[c.category], padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{c.category}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:G }}>{c.listings}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
              {/* Production by Category */}
              <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>📊 Production by Category</h3>
                {data.productionByCategory.map((c:any) => (
                  <div key={c.category} style={{ padding:'12px 0', borderBottom:'1px solid #f3f4f6' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:'#374151', textTransform:'capitalize' }}>{c.category}</span>
                      <span style={{ fontSize:13, color:G, fontWeight:700 }}>{c.listings} listings</span>
                    </div>
                    <div style={{ display:'flex', gap:16, fontSize:12, color:'#9ca3af' }}>
                      <span>{c.farmers} farmers</span>
                      <span>{c.total_quantity?.toLocaleString()} units available</span>
                    </div>
                  </div>
                ))}
                {data.productionByCategory.length === 0 && <p style={{ color:'#9ca3af', fontSize:13 }}>No data yet</p>}
              </div>

              {/* Buyer Types */}
              <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>🏨 Registered Buyers</h3>
                {data.buyerTypes.map((b:any) => (
                  <div key={b.buyer_type} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
                    <span style={{ fontSize:14, textTransform:'capitalize', fontWeight:500 }}>
                      {b.buyer_type === 'hotel' && '🏨 '}
                      {b.buyer_type === 'supermarket' && '🛒 '}
                      {b.buyer_type === 'exporter' && '🚢 '}
                      {b.buyer_type === 'restaurant' && '🍽️ '}
                      {b.buyer_type === 'individual' && '👤 '}
                      {b.buyer_type.charAt(0).toUpperCase()+b.buyer_type.slice(1)}
                    </span>
                    <span style={{ fontSize:14, fontWeight:700, color:G }}>{b.count}</span>
                  </div>
                ))}
                {data.buyerTypes.length === 0 && <p style={{ color:'#9ca3af', fontSize:13 }}>No buyers registered yet</p>}

                <div style={{ marginTop:20, padding:16, background:'#f0fdf4', borderRadius:8, border:'1px solid #bbf7d0' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:G, marginBottom:4 }}>🎯 Verification Rate</div>
                  <div style={{ fontSize:24, fontWeight:800, color:G }}>
                    {data.summary.totalFarmers > 0 ? Math.round((data.summary.verifiedFarmers/data.summary.totalFarmers)*100) : 0}%
                  </div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>of farmers are RADA-verified</div>
                </div>
              </div>
            </div>

            {/* Subsidy Programs */}
            <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb', marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={{ fontSize:16, fontWeight:700, margin:0 }}>💰 Government Subsidy Programs</h3>
                <button onClick={() => navigate('/subsidies')}
                  style={{ padding:'7px 16px', background:G, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  View All Programs →
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
                {data.subsidyStats.map((s:any) => (
                  <div key={s.subsidy_type} style={{ background:'#f9fafb', borderRadius:8, padding:16, border:'1px solid #e5e7eb' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#374151', textTransform:'uppercase', marginBottom:8 }}>{s.subsidy_type}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, textAlign:'center' }}>
                      <div><div style={{ fontSize:18, fontWeight:800, color:G }}>{s.programs}</div><div style={{ fontSize:10, color:'#9ca3af' }}>Programs</div></div>
                      <div><div style={{ fontSize:18, fontWeight:800, color:'#f59e0b' }}>{s.applications||0}</div><div style={{ fontSize:10, color:'#9ca3af' }}>Applied</div></div>
                      <div><div style={{ fontSize:18, fontWeight:800, color:'#10b981' }}>{s.approved||0}</div><div style={{ fontSize:10, color:'#9ca3af' }}>Approved</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Exports */}
            <div style={{ background:'#fff', borderRadius:12, padding:24, border:'1px solid #e5e7eb' }}>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>📥 Data Exports</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
                {[
                  { label:'Market Price History', desc:'All crop prices, all parishes, full history', url:'/api/reports/csv/prices', icon:'📈' },
                ].map(e => (
                  <div key={e.label} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:16 }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>{e.icon}</div>
                    <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{e.label}</div>
                    <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>{e.desc}</div>
                    <button onClick={() => window.open(e.url,'_blank')}
                      style={{ padding:'7px 14px', background:G, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                      Download CSV
                    </button>
                  </div>
                ))}
                <div style={{ border:'1px dashed #d1d5db', borderRadius:8, padding:16, background:'#f9fafb' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>🔐</div>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Farmer Registry</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>Admin access required</div>
                  <button onClick={() => navigate('/login')}
                    style={{ padding:'7px 14px', background:'#e5e7eb', color:'#374151', border:'none', borderRadius:6, cursor:'pointer', fontSize:12 }}>
                    Login to Download
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign:'center', marginTop:32, color:'#9ca3af', fontSize:12 }}>
              <p>AgroJM Agricultural Marketplace · Jamaica Ministry of Agriculture & Food Security</p>
              <p>Data is updated in real-time. All transactions comply with Jamaica Data Protection Act 2020.</p>
              <p style={{ marginTop:8 }}>
                <button onClick={() => navigate('/privacy')} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:12, textDecoration:'underline' }}>Privacy Policy</button>
                {' · '}
                <button onClick={() => navigate('/terms')} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:12, textDecoration:'underline' }}>Terms of Service</button>
                {' · '}
                <button onClick={() => navigate('/alerts')} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:12, textDecoration:'underline' }}>Pest & Disease Alerts</button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
