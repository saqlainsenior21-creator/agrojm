import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Marketplace from './pages/Marketplace'
import FarmerDashboard from './pages/FarmerDashboard'
import BuyerDashboard from './pages/BuyerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import PriceTracker from './pages/PriceTracker'
import WeatherPage from './pages/WeatherPage'
import Layout from './components/Layout'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <LandingPage />
  if (user.role === 'farmer') return <Navigate to="/farmer" replace />
  if (user.role === 'buyer')  return <Navigate to="/buyer" replace />
  if (user.role === 'admin')  return <Navigate to="/admin" replace />
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
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/prices" element={<PriceTracker />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route element={<Layout />}>
            <Route path="/farmer" element={<RequireAuth roles={['farmer']}><FarmerDashboard /></RequireAuth>} />
            <Route path="/buyer"  element={<RequireAuth roles={['buyer']}><BuyerDashboard /></RequireAuth>} />
            <Route path="/admin"  element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
