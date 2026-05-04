import { useState } from 'react'
import { t, fmt, safeJSON, Sel, Field, Inp, Card, StatBox } from './ui.jsx'

export default function IncomeTab({ saved, onSave, profile }) {
  const [showManual, setShowManual] = useState(false)
  const [form, setForm] = useState(saved?.form || { gross:'', bonus:'', rsuValue:'', pensionPct:'5', studentLoan:'none', other:'' })
  const [result, setResult] = useState(saved?.result || null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const s = (k,v) => setForm(f=>({...f,[k]:v}))

  // If auto-populated from documents, show that
  const autoData = saved?.result || saved
  const hasAutoData = autoData?.netMonthly

  const run = async () => {
    if (!form.gross) { setErr('Please enter your gross salary.'); return }
    setErr(''); setBusy(true)
    const key = window.__KEY__
    if (!key) { setErr('No API key.'); setBusy(false); return }
    try {
      const res = await fetch('/api/claude', {
        method:'POST', headers:{'Content-Type':'application/json','x-api-key':key},
        body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:1500,
          system:'UK tax expert 2024/25. Respond ONLY with valid JSON — no markdown, no backticks.',
          messages:[{ role:'user', content:[
            'Calculate UK take-home pay. Return ONLY this JSON:',
            '{"grossAnnual":number,"netMonthly":number,"netAnnual":number,"breakdown":[{"label":string,"amount":number,"type":"income"|"deduction"}],"tips":[string,string]}',
            'Gross: £'+form.gross+'/yr, Bonus: £'+(form.bonus||0)+', RSU: £'+(form.rsuValue||0),
            'Pension: '+form.pensionPct+'% salary sacrifice, Student loan: '+form.studentLoan,
            'Profile: '+(profile?'Employment: '+profile.employmentStatus+', Pension: '+profile.pensionType:''),
            '2024/25: allowance £12,570, basic 20% to £50,270, higher 40% to £125,140, additional 45%. NI: 8% on £12,570-£50,270, 2% above.'
          ].join('\n') }] })
      })
      if (!res.ok) throw new Error('API error '+res.status)
      const d = await res.json()
      if (d.error) throw new Error(d.error.message||'API error')
      const r = JSON.parse((d.content||[]).map(b=>b.text||'').join('').replace(/```json|```/g,'').trim())
      setResult(r); if (onSave) onSave({ form, result:r })
    } catch(e) { setErr(e.message||'Failed') }
    setBusy(false)
  }

  if (hasAutoData && !showManual) return (
    <div style={{ maxWidth:600, margin:'0 auto' }}>
      <div style={{ fontSize:24, fontWeight:900, color:t.text, marginBottom:4, letterSpacing:-0.4 }}>💼 Income & Take-Home</div>
      <div style={{ fontSize:14, color:t.muted, marginBottom:20, lineHeight:1.6 }}>Auto-populated from your bank statements and documents.</div>

      <div style={{ padding:'10px 14px', background:t.green+'12', border:'1px solid '+t.green+'30', borderRadius:12, marginBottom:16, fontSize:12, color:t.muted }}>
        ✓ This data was automatically extracted from your uploaded documents
      </div>

      <Card style={{ marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <StatBox label="Net Monthly" value={fmt(autoData.netMonthly)} color={t.green} size={26} />
          <StatBox label="Gross Annual (est.)" value={fmt(autoData.grossAnnual)} color={t.text} size={26} />
        </div>
        {(autoData.breakdown||[]).map((b,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderTop:'1px solid '+t.border, fontSize:14 }}>
            <span style={{ color:t.muted }}>{b.label}</span>
            <span style={{ fontWeight:700, color:b.type==='deduction'?t.red:t.green }}>{b.type==='deduction'?'−':'+'} {fmt(b.amount)}</span>
          </div>
        ))}
      </Card>

      {(autoData.tips||[]).map((tip,i)=>(
        <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:t.muted, lineHeight:1.6, padding:'10px 12px', background:t.card, borderRadius:10, border:'1px solid '+t.border }}>
          <span style={{ color:t.gold }}>✦</span><span>{tip}</span>
        </div>
      ))}

      <button onClick={()=>setShowManual(true)} style={{ width:'100%', padding:'13px', background:'none', color:t.muted, border:'1.5px solid '+t.border, borderRadius:14, fontSize:13, fontWeight:600, cursor:'pointer', marginTop:8 }}>
        Enter details manually instead →
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth:600, margin:'0 auto' }}>
      <div style={{ fontSize:24, fontWeight:900, color:t.text, marginBottom:4, letterSpacing:-0.4 }}>💼 Income Calculator</div>
      <div style={{ fontSize:14, color:t.muted, marginBottom:24, lineHeight:1.6 }}>Enter your salary details for a precise 2024/25 calculation.</div>
      {hasAutoData && <button onClick={()=>setShowManual(false)} style={{ padding:'8px 14px', background:t.accent+'20', color:t.accent, border:'1px solid '+t.accent+'40', borderRadius:10, fontSize:12, cursor:'pointer', marginBottom:16 }}>← Back to auto-populated data</button>}
      <Card style={{ marginBottom:16 }}>
        <Field label="Gross Annual Salary (£)"><Inp type="number" placeholder="e.g. 85000" value={form.gross} onChange={e=>s('gross',e.target.value)} /></Field>
        <Field label="Annual Bonus (£)" optional><Inp type="number" placeholder="e.g. 10000" value={form.bonus} onChange={e=>s('bonus',e.target.value)} /></Field>
        <Field label="RSU Vesting Value This Year (£)" optional><Inp type="number" placeholder="e.g. 25000" value={form.rsuValue} onChange={e=>s('rsuValue',e.target.value)} /></Field>
        <Field label="Pension Contribution" hint="Salary sacrifice reduces both income tax and NI">
          <Sel value={form.pensionPct} onChange={v=>s('pensionPct',v)} placeholder="Select %…" options={['0','3','4','5','6','7','8','10','12','15','20'].map(x=>({value:x,label:x+'% salary sacrifice'}))} />
        </Field>
        <Field label="Student Loan">
          <Sel value={form.studentLoan} onChange={v=>s('studentLoan',v)} placeholder="Select plan…" options={[{value:'none',label:'No student loan'},{value:'Plan 1',label:'Plan 1 (pre-2012 / Scotland)'},{value:'Plan 2',label:'Plan 2 (post-2012 England/Wales)'},{value:'Plan 5',label:'Plan 5 (post-Aug 2023)'},{value:'Postgraduate',label:'Postgraduate Loan'}]} />
        </Field>
        <Field label="Other Income" optional><Inp placeholder="e.g. £500/month freelance" value={form.other} onChange={e=>s('other',e.target.value)} /></Field>
      </Card>
      {err && <div style={{ color:t.red, fontSize:13, padding:'12px 16px', background:t.red+'12', borderRadius:14, marginBottom:16, lineHeight:1.5 }}>{err}</div>}
      {busy
        ? <div style={{ textAlign:'center', padding:'32px 0', color:t.muted }}><div style={{ fontSize:28, display:'inline-block', animation:'spin 1.5s linear infinite', marginBottom:10 }}>⚙️</div><div>Calculating…</div></div>
        : <button onClick={run} style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg,'+t.accent+',#a855f7)', color:'#fff', border:'none', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer' }}>Calculate Take-Home Pay →</button>
      }
      {result && (
        <div style={{ marginTop:24, animation:'fadeUp 0.35s ease both' }}>
          <Card style={{ marginBottom:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <StatBox label="Net Monthly" value={fmt(result.netMonthly)} color={t.green} size={26} />
              <StatBox label="Net Annual" value={fmt(result.netAnnual)} color={t.green} size={26} />
            </div>
            {(result.breakdown||[]).map((b,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderTop:'1px solid '+t.border, fontSize:14 }}>
                <span style={{ color:t.muted }}>{b.label}</span>
                <span style={{ fontWeight:700, color:b.type==='deduction'?t.red:t.green }}>{b.type==='deduction'?'−':'+'} {fmt(b.amount)}</span>
              </div>
            ))}
          </Card>
          {(result.tips||[]).map((tip,i)=>(
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:t.muted, lineHeight:1.6, padding:'10px 12px', background:t.card, borderRadius:10, border:'1px solid '+t.border }}>
              <span style={{ color:t.gold }}>✦</span><span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
