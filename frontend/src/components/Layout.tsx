import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()

  const farmerLinks = [
    { path: '/farmer', label: '📊 Dashboard' },
    { path: '/marketplace', label: '🛒 Marketplace' },
    { path: '/prices', label: '📈 Prices' },
    { path: '/weather', label: '⛅ Weather' },
  ]
  const buyerLinks = [
    { path: '/buyer', label: '📦 My Orders' },
    { path: '/marketplace', label: '🛒 Browse Crops' },
    { path: '/prices', label: '📈 Market Prices' },
    { path: '/weather', label: '⛅ Weather' },
  ]
  const adminLinks = [
    { path: '/admin', label: '📊 Dashboard' },
    { path: '/marketplace', label: '🛒 Marketplace' },
    { path: '/prices', label: '📈 Prices' },
    { path: '/weather', label: '⛅ Weather' },
  ]

  const links = user?.role === 'farmer' ? farmerLinks : user?.role === 'buyer' ? buyerLinks : adminLinks

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f4' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: G, color: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>🌱 AgroJM</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{user?.name}</div>
          <div style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase' }}>{user?.role}</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {links.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 20px', background: loc.pathname === l.path ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14,
              borderLeft: loc.pathname === l.path ? '3px solid #95d5b2' : '3px solid transparent'
            }}>{l.label}</button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => { logout(); navigate('/'); }} style={{
            width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
            cursor: 'pointer', fontSize: 13
          }}>Sign Out</button>
        </div>
      </aside>
      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
