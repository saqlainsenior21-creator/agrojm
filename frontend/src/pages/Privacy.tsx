import { useNavigate } from 'react-router-dom'
const G = '#2d6a4f'
export default function Privacy() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight:'100vh', background:'#f4f7f4', padding:'40px 20px' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:G, cursor:'pointer', fontSize:14, fontWeight:600, marginBottom:20 }}>← Back</button>
        <div style={{ background:'#fff', borderRadius:16, padding:48, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🌱</div>
            <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 8px' }}>Privacy Policy</h1>
            <p style={{ color:'#6b7280', margin:0 }}>AgroJM Agricultural Marketplace · Effective: January 1, 2026</p>
          </div>
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:16, marginBottom:28 }}>
            <div style={{ fontSize:14, fontWeight:700, color:G, marginBottom:4 }}>🏛️ Jamaica Data Protection Act 2020 Compliance</div>
            <div style={{ fontSize:13, color:'#374151' }}>AgroJM is fully compliant with the Jamaica Data Protection Act 2020 and operates in accordance with the guidelines of the Ministry of Agriculture and Food Security.</div>
          </div>
          {[
            { title: '1. Information We Collect', content: `We collect the following personal information when you register and use AgroJM:\n\n• Identity information: Full name, National Identification Number (NIN), RADA Farmer ID\n• Contact information: Email address, phone number, parish of residence\n• Business information: Business name, buyer type, farm details (size, location, land tenure)\n• Transaction data: Orders placed, listings created, market prices\n• Agricultural data: Crop logs, harvest records, certification details\n• Technical data: IP address, browser type, usage logs` },
            { title: '2. How We Use Your Information', content: `We use collected information to:\n\n• Create and manage your AgroJM account\n• Facilitate transactions between farmers and buyers\n• Verify farmer identity with RADA (Rural Agricultural Development Authority)\n• Process subsidy applications to the Ministry of Agriculture\n• Send weather alerts and pest/disease warnings\n• Generate anonymous agricultural statistics for the Ministry\n• Comply with legal obligations under Jamaican law` },
            { title: '3. RADA ID and National ID', content: `Your RADA Farmer ID and National Identification Number (NIN) are collected solely for:\n\n• Verification of your registration with the Rural Agricultural Development Authority (RADA)\n• Processing government subsidy and support program applications\n• Generating official agricultural census and production statistics\n\nThese identifiers are stored securely, encrypted at rest, and are never sold to third parties. Access is restricted to extension officers, ministry officials, and system administrators.` },
            { title: '4. Data Sharing', content: `We share your data only with:\n\n• Ministry of Agriculture and Food Security — for agricultural statistics and policy planning\n• RADA (Rural Agricultural Development Authority) — for farmer verification\n• Marketplace participants — buyers see farmer name and contact when placing orders\n• Extension Officers — for farmer verification and support\n• WiPay Payment Services — for processing card transactions (payment data only)\n• Law enforcement — when required by law or court order` },
            { title: '5. Data Security', content: `We protect your data through:\n\n• AES-256 encryption for data at rest\n• TLS 1.3 encryption for data in transit\n• JWT token authentication with 8-hour expiry\n• bcrypt password hashing\n• Railway.app secure cloud infrastructure\n• Regular security audits and penetration testing` },
            { title: '6. Your Rights (Jamaica DPA 2020)', content: `Under the Jamaica Data Protection Act 2020, you have the right to:\n\n• Access your personal data (contact us to request a copy)\n• Correct inaccurate data (update via your profile settings)\n• Delete your account (submit a request to admin@agrojm.com)\n• Object to processing for direct marketing purposes\n• Data portability — receive your data in CSV format\n• Lodge a complaint with the Office of the Information Commissioner (OIC)` },
            { title: '7. Cookies', content: `AgroJM uses only essential cookies:\n\n• Authentication tokens stored in localStorage (not cookies)\n• No tracking cookies, advertising cookies or third-party analytics\n• Session management only` },
            { title: '8. Data Retention', content: `We retain your data for:\n\n• Active accounts: For the duration of account activity\n• Transaction records: 7 years (Jamaica Companies Act requirement)\n• Agricultural statistics: Aggregated, anonymized data retained indefinitely\n• Deleted accounts: Personal data purged within 30 days of deletion request` },
            { title: '9. Children\'s Privacy', content: `AgroJM does not knowingly collect data from persons under 18 years of age. Users must be at least 18 years old to register.` },
            { title: '10. Contact Us', content: `For privacy-related requests or concerns:\n\nEmail: admin@agrojm.com\nAddress: Jamaica\nMinistry of Agriculture Reference: AgroJM Agricultural Marketplace Platform\n\nOffice of the Information Commissioner (OIC) Jamaica: https://oic.gov.jm` },
          ].map(s => (
            <div key={s.title} style={{ marginBottom:24 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#111827', marginBottom:10 }}>{s.title}</h3>
              <div style={{ fontSize:14, color:'#374151', lineHeight:1.7, whiteSpace:'pre-line' }}>{s.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
