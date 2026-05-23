import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'
const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'farmer', phone:'', parish:'', business_name:'', buyer_type:'hotel' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('agrojm_token', data.token)
      await login(form.email, form.password)
      navigate('/')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, #1b2d27 0%, ${G} 100%)`, padding:20 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:40, width:440, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🌱</div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 4px' }}>Join AgroJM</h1>
          <p style={{ color:'#6b7280', fontSize:14 }}>Jamaica's Agricultural Marketplace</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role */}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>I am a...</label>
            <div style={{ display:'flex', gap:10 }}>
              {[['farmer','🌾 Farmer'],['buyer','🏨 Buyer']].map(([val,label]) => (
                <button key={val} type="button" onClick={() => setForm(f => ({...f, role:val}))}
                  style={{ flex:1, padding:'10px', border:`2px solid ${form.role===val?G:'#d1d5db'}`, borderRadius:10, background:form.role===val?'#f0fdf4':'#fff', fontWeight:600, cursor:'pointer', fontSize:14 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {[['Full Name','text','name'],['Email','email','email'],['Password','password','password'],['Phone','tel','phone']].map(([label,type,key]) => (
            <div key={key} style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>{label}</label>
              <input type={type} value={(form as any)[key]} onChange={set(key)} required={['name','email','password'].includes(key)}
                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Parish</label>
            <select value={form.parish} onChange={set('parish')} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }}>
              <option value=''>Select parish...</option>
              {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {form.role === 'buyer' && (
            <>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Business Name</label>
                <input value={form.business_name} onChange={set('business_name')} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Buyer Type</label>
                <select value={form.buyer_type} onChange={set('buyer_type')} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }}>
                  {['hotel','supermarket','exporter','restaurant','individual'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
            </>
          )}

          {error && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13, marginBottom:14 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width:'100%', padding:12, background:G, color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading?0.7:1 }}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:16, fontSize:14, color:'#6b7280' }}>
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} style={{ background:'none', border:'none', color:G, fontWeight:600, cursor:'pointer', fontSize:14 }}>Sign in</button>
        </p>
      </div>
    </div>
  )
}
