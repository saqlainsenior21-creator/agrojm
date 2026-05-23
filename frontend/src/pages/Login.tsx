import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await login(email, password); navigate('/') }
    catch (err: any) { setError(err.message || 'Invalid credentials') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, #1b2d27 0%, ${G} 100%)` }}>
      <div style={{ background:'#fff', borderRadius:16, padding:40, width:380, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🌱</div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 4px' }}>AgroJM</h1>
          <p style={{ color:'#6b7280', fontSize:14 }}>Jamaica Agricultural Marketplace</p>
        </div>
        <form onSubmit={handleSubmit}>
          {[['Email', 'email', email, setEmail], ['Password', 'password', password, setPassword]].map(([label, type, val, set]: any) => (
            <div key={label} style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>{label}</label>
              <input type={type} value={val} onChange={e => set(e.target.value)} required
                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
            </div>
          ))}
          {error && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13, marginBottom:16 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:12, background:G, color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading?0.7:1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'#6b7280' }}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} style={{ background:'none', border:'none', color:G, fontWeight:600, cursor:'pointer', fontSize:14 }}>Register</button>
        </p>
      </div>
    </div>
  )
}
