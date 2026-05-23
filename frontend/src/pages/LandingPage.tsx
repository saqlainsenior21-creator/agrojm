import { useNavigate } from 'react-router-dom'

const G = '#2d6a4f'
const GOLD = '#f4a261'
const DARK = '#1b2d27'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: DARK }}>
      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 40px', background:'#fff', borderBottom:'1px solid #e5e7eb', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontWeight:800, fontSize:20 }}>🌱 AgroJM</div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <button onClick={() => navigate('/marketplace')} style={{ background:'transparent', border:'none', fontSize:14, color:'#374151', cursor:'pointer' }}>Marketplace</button>
          <button onClick={() => navigate('/prices')} style={{ background:'transparent', border:'none', fontSize:14, color:'#374151', cursor:'pointer' }}>Prices</button>
          <button onClick={() => navigate('/weather')} style={{ background:'transparent', border:'none', fontSize:14, color:'#374151', cursor:'pointer' }}>Weather</button>
          <button onClick={() => navigate('/login')} style={{ background:'transparent', border:`1.5px solid ${G}`, color:G, padding:'7px 16px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>Login</button>
          <button onClick={() => navigate('/register')} style={{ background:G, color:'#fff', border:'none', padding:'8px 18px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>Join Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background:`linear-gradient(135deg, ${DARK} 0%, #1e4035 50%, ${G} 100%)`, padding:'100px 40px 90px', textAlign:'center', color:'#fff' }}>
        <div style={{ display:'inline-block', background:'rgba(244,162,97,0.2)', border:'1px solid rgba(244,162,97,0.4)', borderRadius:20, padding:'6px 18px', fontSize:13, color:GOLD, marginBottom:24, fontWeight:600 }}>
          🇯🇲 Jamaica's Agricultural Marketplace
        </div>
        <h1 style={{ fontSize:'clamp(32px,5vw,60px)', fontWeight:800, margin:'0 0 20px', lineHeight:1.15 }}>
          Fresh from the Farm.<br /><span style={{ color:GOLD }}>Direct to Your Door.</span>
        </h1>
        <p style={{ fontSize:18, color:'rgba(255,255,255,0.8)', maxWidth:580, margin:'0 auto 40px', lineHeight:1.6 }}>
          AgroJM connects Jamaican farmers directly with hotels, supermarkets, and exporters.
          Real-time crop availability, market prices, and weather alerts — all in one place.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/register')} style={{ background:GOLD, color:DARK, padding:'14px 32px', borderRadius:10, fontWeight:700, fontSize:16, border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(244,162,97,0.4)' }}>
            Start Selling →
          </button>
          <button onClick={() => navigate('/marketplace')} style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.3)', padding:'14px 32px', borderRadius:10, fontWeight:600, fontSize:16, cursor:'pointer' }}>
            Browse Crops
          </button>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background:G, padding:'28px 40px' }}>
        <div style={{ display:'flex', justifyContent:'center', gap:60, flexWrap:'wrap', color:'#fff', textAlign:'center' }}>
          {[['24 Crops','Listed on the platform'],['14 Parishes','Island-wide coverage'],['Free','To join as a farmer'],['Live Prices','Updated daily']].map(([n,l]) => (
            <div key={n}><div style={{ fontSize:28, fontWeight:800, color:GOLD }}>{n}</div><div style={{ fontSize:13, opacity:0.8 }}>{l}</div></div>
          ))}
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section style={{ padding:'80px 40px', background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <h2 style={{ fontSize:34, fontWeight:800, textAlign:'center', marginBottom:50 }}>Built for Everyone in the Food Chain</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:24 }}>
            {[
              { icon:'🌾', title:'Farmers', desc:'List your crops, set your price, track orders and get paid directly. No middlemen.', cta:'Join as Farmer', path:'/register' },
              { icon:'🏨', title:'Hotels', desc:'Source fresh produce directly from local farmers. Browse by crop, parish, and quantity.', cta:'Join as Buyer', path:'/register' },
              { icon:'🏪', title:'Supermarkets', desc:'Secure consistent supply from multiple farms. Place bulk orders with delivery coordination.', cta:'Join as Buyer', path:'/register' },
              { icon:'✈️', title:'Exporters', desc:'Access verified Jamaican produce at competitive prices. Browse export-grade listings.', cta:'Join as Buyer', path:'/register' },
            ].map(c => (
              <div key={c.title} style={{ background:'#f4f7f4', borderRadius:16, padding:28, borderTop:`4px solid ${G}` }}>
                <div style={{ fontSize:40, marginBottom:16 }}>{c.icon}</div>
                <h3 style={{ fontSize:18, fontWeight:700, margin:'0 0 10px' }}>{c.title}</h3>
                <p style={{ color:'#6b7280', fontSize:15, lineHeight:1.6, margin:'0 0 20px' }}>{c.desc}</p>
                <button onClick={() => navigate(c.path)} style={{ background:G, color:'#fff', border:'none', padding:'9px 20px', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer' }}>{c.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:'80px 40px', background:'#f4f7f4' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:34, fontWeight:800, marginBottom:50 }}>Everything You Need</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {[
              { icon:'🛒', title:'Crop Marketplace', desc:'Browse real-time crop availability from farms across all 14 parishes.' },
              { icon:'📈', title:'Market Price Tracker', desc:'Live and historical prices for yam, callaloo, tomato, scotch bonnet and 20+ crops.' },
              { icon:'⛅', title:'Weather Alerts', desc:'7-day parish-by-parish forecasts and hurricane/drought alerts from Jamaica Met.' },
              { icon:'🚚', title:'Delivery Coordination', desc:'Request pickup and delivery between farm and your location. Track in real time.' },
              { icon:'🌱', title:'Crop Tracking', desc:'Farmers log planting, growing stages, and harvest dates to predict supply.' },
              { icon:'🏛️', title:'RADA Dashboard', desc:'Government oversight of national crop supply, demand, and pricing trends.' },
            ].map(f => (
              <div key={f.title} style={{ background:'#fff', borderRadius:14, padding:24, textAlign:'left' }}>
                <div style={{ fontSize:32, marginBottom:12 }}>{f.icon}</div>
                <h3 style={{ fontSize:16, fontWeight:700, margin:'0 0 8px' }}>{f.title}</h3>
                <p style={{ color:'#6b7280', fontSize:14, lineHeight:1.6, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:G, padding:'80px 40px', textAlign:'center', color:'#fff' }}>
        <h2 style={{ fontSize:36, fontWeight:800, margin:'0 0 16px' }}>Ready to Transform Jamaican Agriculture?</h2>
        <p style={{ fontSize:17, opacity:0.85, margin:'0 0 36px' }}>Join free today. No credit card required.</p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/register')} style={{ background:GOLD, color:DARK, padding:'14px 36px', borderRadius:10, fontWeight:700, fontSize:16, border:'none', cursor:'pointer' }}>Get Started Free →</button>
          <a href="mailto:saqlain@schooltrackjm.com?subject=AgroJM Partnership Inquiry" style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.3)', padding:'14px 32px', borderRadius:10, fontWeight:600, fontSize:16, textDecoration:'none', display:'inline-block' }}>Contact Us</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:DARK, color:'rgba(255,255,255,0.5)', padding:'28px 40px', textAlign:'center', fontSize:13 }}>
        <div style={{ marginBottom:8 }}><span style={{ fontWeight:700, color:'#fff' }}>AgroJM</span> — Jamaica Agricultural Marketplace · SchoolTrack JM Ltd</div>
        <div style={{ display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/marketplace')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, padding:0 }}>Marketplace</button>
          <button onClick={() => navigate('/prices')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, padding:0 }}>Market Prices</button>
          <button onClick={() => navigate('/weather')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, padding:0 }}>Weather</button>
          <button onClick={() => navigate('/login')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, padding:0 }}>Login</button>
        </div>
      </footer>
    </div>
  )
}
