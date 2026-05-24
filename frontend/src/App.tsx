import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Marketplace from './pages/Marketplace'
import FarmerDashboard from './pages/FarmerDashboard'
import BuyerDashboard from './pages/BuyerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import OfficerDashboard from './pages/OfficerDashboard'
import PriceTracker from './pages/PriceTracker'
import WeatherPage from './pages/WeatherPage'
import MinistryPortal from './pages/MinistryPortal'
import PestAlerts from './pages/PestAlerts'
import Subsidies from './pages/Subsidies'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Layout from './components/Layout'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <LandingPage />
  if (user.role === 'farmer') return <Navigate to="/farmer" replace />
  if (user.role === 'buyer')  return <Navigate to="/buyer" replace />
  if (user.role === 'admin')  return <Navigate to="/admin" replace />
  if (user.role === 'extension_officer') return <Navigate to="/officer" replace />
  return <Navigate to="/marketplace" replace />
}

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:18 }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/prices" element={<PriceTracker />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/ministry" element={<MinistryPortal />} />
          <Route path="/alerts" element={<PestAlerts />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* Protected — with sidebar Layout */}
          <Route element={<Layout />}>
            <Route path="/farmer"   element={<RequireAuth roles={['farmer']}><FarmerDashboard /></RequireAuth>} />
            <Route path="/buyer"    element={<RequireAuth roles={['buyer']}><BuyerDashboard /></RequireAuth>} />
            <Route path="/admin"    element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
            <Route path="/officer"  element={<RequireAuth roles={['extension_officer','admin']}><OfficerDashboard /></RequireAuth>} />
            <Route path="/subsidies" element={<RequireAuth><Subsidies /></RequireAuth>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
