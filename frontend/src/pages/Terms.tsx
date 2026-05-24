import { useNavigate } from 'react-router-dom'
const G = '#2d6a4f'
export default function Terms() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight:'100vh', background:'#f4f7f4', padding:'40px 20px' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:G, cursor:'pointer', fontSize:14, fontWeight:600, marginBottom:20 }}>← Back</button>
        <div style={{ background:'#fff', borderRadius:16, padding:48, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🌱</div>
            <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 8px' }}>Terms of Service</h1>
            <p style={{ color:'#6b7280', margin:0 }}>AgroJM Agricultural Marketplace · Effective: January 1, 2026</p>
          </div>
          {[
            { title: '1. About AgroJM', content: `AgroJM is a digital agricultural marketplace operated in partnership with the Jamaica Ministry of Agriculture and Food Security and the Rural Agricultural Development Authority (RADA). The platform connects Jamaican farmers with buyers including hotels, supermarkets, exporters and restaurants.\n\nBy using AgroJM, you agree to these Terms of Service and our Privacy Policy.` },
            { title: '2. Eligibility', content: `To use AgroJM you must:\n\n• Be at least 18 years of age\n• Be a resident of Jamaica or operate a business registered in Jamaica\n• Provide accurate information during registration\n• Comply with all applicable Jamaican laws and regulations\n\nFarmers are encouraged to provide their RADA Farmer ID for faster verification and access to government programs.` },
            { title: '3. Farmer Responsibilities', content: `As a registered farmer on AgroJM you agree to:\n\n• List only produce that you have grown or have legal authority to sell\n• Accurately represent the quality, quantity and availability of your produce\n• Honour confirmed orders and communicate promptly with buyers\n• Comply with the Agricultural Produce (Grading and Marking) Act\n• Follow Good Agricultural Practices (GAP) guidelines\n• Report pest and disease outbreaks to your Extension Officer\n• Maintain accurate crop logs and harvest records` },
            { title: '4. Buyer Responsibilities', content: `As a registered buyer on AgroJM you agree to:\n\n• Provide accurate business information and buyer type\n• Pay for confirmed orders in a timely manner\n• Comply with food safety and import regulations\n• Not use the platform to source produce illegally or circumvent food safety standards` },
            { title: '5. Marketplace Rules', content: `The following are prohibited on AgroJM:\n\n• Listing produce grown with prohibited pesticides or chemicals\n• False or misleading product descriptions\n• Price manipulation or anti-competitive behaviour\n• Harassment of other users\n• Creating fake accounts or impersonating others\n• Circumventing payment processing\n\nViolations may result in account suspension or termination.` },
            { title: '6. Payments', content: `• Payments are processed securely through WiPay Jamaica in Jamaican Dollars (JMD)\n• AgroJM does not store credit card information\n• Payment disputes must be reported within 7 days of transaction\n• Refunds are processed within 5-10 business days\n• A 2.5% platform fee applies to completed transactions` },
            { title: '7. Government Programs', content: `Subsidy applications and government support programs listed on AgroJM are subject to:\n\n• Eligibility verification by RADA extension officers\n• Approval at the sole discretion of the relevant government agency\n• Availability of program funds\n• AgroJM does not guarantee approval of any subsidy application` },
            { title: '8. Certifications', content: `Certifications listed on AgroJM (GAP, Organic, etc.) must be:\n\n• Currently valid and not expired\n• Issued by a recognized certification body\n• Accurately represented\n\nFalsely claiming certifications is a violation of these terms and may constitute fraud under Jamaican law.` },
            { title: '9. Data and Privacy', content: `Your use of AgroJM is governed by our Privacy Policy which complies with the Jamaica Data Protection Act 2020. Agricultural statistics may be shared with the Ministry of Agriculture in anonymized, aggregated form for policy planning purposes.` },
            { title: '10. Limitation of Liability', content: `AgroJM is provided "as is." We are not liable for:\n\n• Crop failures, weather events or other agricultural losses\n• Disputes between farmers and buyers\n• Market price fluctuations\n• Technical outages or service interruptions\n• Actions of third-party payment processors` },
            { title: '11. Governing Law', content: `These Terms are governed by the laws of Jamaica. Any disputes shall be resolved in the courts of Jamaica. The platform operates in compliance with:\n\n• Jamaica Data Protection Act 2020\n• Agricultural Produce (Grading and Marking) Act\n• Trade Act (Jamaica)\n• Consumer Protection Act (Jamaica)` },
            { title: '12. Contact', content: `AgroJM · Jamaica Agricultural Marketplace\nEmail: admin@agrojm.com\nIn partnership with: Ministry of Agriculture and Food Security, Jamaica · RADA (Rural Agricultural Development Authority)` },
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
