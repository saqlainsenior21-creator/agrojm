import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()

  const farmerLinks = [
    { path: '/farmer',    label: '📊 Dashboard' },
    { path: '/marketplace', label: '🛒 Marketplace' },
    { path: '/subsidies', label: '💰 Subsidies' },
    { path: '/prices',    label: '📈 Prices' },
    { path: '/alerts',    label: '⚠️ Pest Alerts' },
    { path: '/weather',   label: '⛅ Weather' },
    { path: '/ministry',  label: '🏛️ Ministry Portal' },
  ]
  const buyerLinks = [
    { path: '/buyer',       label: '📦 My Orders' },
    { path: '/marketplace', label: '🛒 Browse Crops' },
    { path: '/prices',      label: '📈 Market Prices' },
    { path: '/alerts',      label: '⚠️ Pest Alerts' },
    { path: '/weather',     label: '⛅ Weather' },
    { path: '/ministry',    label: '🏛️ Ministry Portal' },
  ]
  const adminLinks = [
    { path: '/admin',     label: '📊 Admin Dashboard' },
    { path: '/officer',   label: '🏛️ Officer View' },
    { path: '/subsidies', label: '💰 Subsidies' },
    { path: '/alerts',    label: '⚠️ Pest Alerts' },
    { path: '/marketplace', label: '🛒 Marketplace' },
    { path: '/prices',    label: '📈 Prices' },
    { path: '/ministry',  label: '🌐 Ministry Portal' },
  ]
  const officerLinks = [
    { path: '/officer',   label: '🏛️ Dashboard' },
    { path: '/alerts',    label: '⚠️ Issue Alerts' },
    { path: '/subsidies', label: '💰 Subsidy Review' },
    { path: '/marketplace', label: '🛒 Marketplace' },
    { path: '/prices',    label: '📈 Prices' },
    { path: '/weather',   label: '⛅ Weather' },
    { path: '/ministry',  label: '📊 Ministry Portal' },
  ]

  const links = user?.role === 'farmer' ? farmerLinks
    : user?.role === 'buyer' ? buyerLinks
    : user?.role === 'extension_officer' ? officerLinks
    : adminLinks

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f4' }}>
      {/* Sidebar */}
      <aside style={{ width: 230, background: G, color: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 18px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>🌱 AgroJM</div>
          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 6 }}>Ministry of Agriculture</div>
          <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {user?.role === 'extension_officer' ? 'Extension Officer' : user?.role}
            {user?.extension_parish ? ` · ${user.extension_parish}` : ''}
          </div>
          {user?.role === 'farmer' && (
            <div style={{ marginTop: 8 }}>
              {(user as any).verification_status === 'verified'
                ? <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 8px' }}>✅ RADA Verified</span>
                : <span style={{ fontSize: 11, background: 'rgba(255,200,0,0.25)', borderRadius: 20, padding: '2px 8px' }}>⏳ Pending Verification</span>
              }
            </div>
          )}
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {links.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '9px 18px', background: loc.pathname === l.path ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13,
              borderLeft: loc.pathname === l.path ? '3px solid #95d5b2' : '3px solid transparent',
              opacity: loc.pathname === l.path ? 1 : 0.85
            }}>{l.label}</button>
          ))}
        </nav>
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => { logout(); navigate('/'); }} style={{
            width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
            cursor: 'pointer', fontSize: 12
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
