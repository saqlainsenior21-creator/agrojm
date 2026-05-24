import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const G = '#2d6a4f'
const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name:'', email:'', password:'', role:'farmer', phone:'', parish:'',
    business_name:'', buyer_type:'hotel', rada_id:'', national_id:''
  })
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

  const inp = { padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' as const, width:'100%' }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, #1b2d27 0%, ${G} 100%)`, padding:20 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:40, width:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🌱</div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 4px' }}>Join AgroJM</h1>
          <p style={{ color:'#6b7280', fontSize:13, margin:0 }}>Jamaica's Agricultural Marketplace · Ministry of Agriculture</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role */}
          <div style={{ marginBottom:18 }}>
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

          {/* Basic fields */}
          {[['Full Name','text','name',true],['Email','email','email',true],['Password','password','password',true],['Phone Number','tel','phone',false]].map(([label,type,key,req]) => (
            <div key={key as string} style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>{label as string}</label>
              <input type={type as string} value={(form as any)[key as string]} onChange={set(key as string)} required={req as boolean} style={inp} />
            </div>
          ))}

          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Parish</label>
            <select value={form.parish} onChange={set('parish')} style={inp}>
              <option value=''>Select parish...</option>
              {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Farmer-specific: RADA ID + NIN */}
          {form.role === 'farmer' && (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:G, marginBottom:12 }}>🏛️ RADA Registration (Optional)</div>
              <div style={{ marginBottom:10 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>
                  RADA Farmer ID
                  <span style={{ fontWeight:400, color:'#9ca3af', marginLeft:6 }}>— from your RADA registration card</span>
                </label>
                <input placeholder="e.g. RADA-2024-00123" value={form.rada_id} onChange={set('rada_id')} style={{ ...inp, background:'#fff' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>
                  National Identification Number (NIN)
                  <span style={{ fontWeight:400, color:'#9ca3af', marginLeft:6 }}>— for identity verification</span>
                </label>
                <input placeholder="e.g. 1234567890" value={form.national_id} onChange={set('national_id')} style={{ ...inp, background:'#fff' }} />
              </div>
              <p style={{ fontSize:11, color:'#6b7280', margin:'10px 0 0' }}>
                Your RADA ID enables faster verification and access to government subsidy programs. Protected under Jamaica Data Protection Act 2020.
              </p>
            </div>
          )}

          {/* Buyer-specific fields */}
          {form.role === 'buyer' && (
            <>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Business Name</label>
                <input value={form.business_name} onChange={set('business_name')} style={inp} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Buyer Type</label>
                <select value={form.buyer_type} onChange={set('buyer_type')} style={inp}>
                  {[['hotel','🏨 Hotel'],['supermarket','🛒 Supermarket'],['exporter','🚢 Exporter'],['restaurant','🍽️ Restaurant'],['individual','👤 Individual']].map(([v,l]) => (
                    <option key={v as string} value={v as string}>{l as string}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13, marginBottom:14 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width:'100%', padding:12, background:G, color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading?0.7:1, marginBottom:14 }}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>

          <p style={{ fontSize:11, color:'#9ca3af', textAlign:'center', margin:0 }}>
            By registering you agree to our{' '}
            <button type="button" onClick={() => navigate('/terms')} style={{ background:'none', border:'none', color:G, cursor:'pointer', fontSize:11, textDecoration:'underline' }}>Terms</button>
            {' and '}
            <button type="button" onClick={() => navigate('/privacy')} style={{ background:'none', border:'none', color:G, cursor:'pointer', fontSize:11, textDecoration:'underline' }}>Privacy Policy</button>
          </p>
        </form>

        <p style={{ textAlign:'center', marginTop:14, fontSize:14, color:'#6b7280' }}>
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} style={{ background:'none', border:'none', color:G, fontWeight:600, cursor:'pointer', fontSize:14 }}>Sign in</button>
        </p>
      </div>
    </div>
  )
}
