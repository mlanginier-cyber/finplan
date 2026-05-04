import { useState } from 'react'
import { t, fmt, Sel, Field, Inp, Card, StatBox } from './ui.jsx'

export default function TaxTab({ saved, onSave, profile }) {
  const [showManual, setShowManual] = useState(false)
  const [form, setForm] = useState(saved?.form || { shares:'', vestprice:'', saleprice:'', salary:'', prevvest:'', taxRate:'higher' })
  const [result, setResult] = useState(saved?.result || null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const s = (k,v) => setForm(f=>({...f,[k]:v}))

  const autoData = saved?.result || saved
  const hasAutoData = autoData?.totalTaxBill != null

  const run = async () => {
    if (!form.shares || !form.vestprice) { setErr('Please enter shares vested and vest price.'); return }
    setErr(''); setBusy(true)
    const key = window.__KEY__
    if (!key) { setErr('No API key.'); setBusy(false); return }
    try {
      const res = await fetch('/api/claude', {
        method:'POST', headers:{'Content-Type':'application/json','x-api-key':key},
        body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:1500,
          system:'UK HMRC tax specialist 2024/25. Respond ONLY with valid JSON — no markdown, no backticks.',
          messages:[{ role:'user', content:[
            'Calculate UK RSU/share tax. Return ONLY this JSON:',
            '{"vestingTaxEvent":{"sharesVested":number,"marketValueAtVest":number,"incomeTaxDue":number,"niDue":number,"totalDueAtVest":number,"paidThroughPayroll":boolean},"saleTaxEvent":{"saleProceeds":number,"acquisitionCost":number,"gain":number,"annualExemption":number,"taxableGain":number,"cgtDue":number,"rate":number},"totalTaxBill":number,"hmrcDeadlines":[{"event":string,"deadline":string,"action":string}],"optimisations":[{"strategy":string,"potentialSaving":number,"description":string}],"selfAssessmentRequired":boolean,"summary":string}',
            'Shares: '+form.shares+', Vest price: £'+form.vestprice+', Sale: £'+(form.saleprice||form.vestprice),
            'Salary: £'+(form.salary||0)+', Prev RSU: £'+(form.prevvest||0)+', Band: '+form.taxRate,
            'Profile: '+(profile?profile.maritalStatus+', partner: '+(profile.partnerTaxBand||'unknown'):''),
            '2024/25: CGT exemption £3k. CGT: 18% basic, 24% higher.'
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
      <div style={{ fontSize:24, fontWeight:900, color:t.text, marginBottom:4, letterSpacing:-0.4 }}>🏛️ Tax & RSUs</div>
      <div style={{ fontSize:14, color:t.muted, marginBottom:20, lineHeight:1.6 }}>Auto-populated from your PCS and payslips.</div>

      <div style={{ padding:'10px 14px', background:t.green+'12', border:'1px solid '+t.green+'30', borderRadius:12, marginBottom:16, fontSize:12, color:t.muted }}>
        ✓ Extracted automatically from your uploaded documents
      </div>

      <div style={{ padding:'20px', background:t.red+'10', border:'1px solid '+t.red+'30', borderRadius:18, marginBottom:14 }}>
        <div style={{ fontSize:10, color:t.red, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:0.7 }}>Total HMRC Tax Bill</div>
        <div style={{ fontSize:38, fontWeight:900, color:t.red, marginBottom:6 }}>{fmt(autoData.totalTaxBill)}</div>
        {autoData.summary && <div style={{ fontSize:13, color:t.muted, lineHeight:1.6 }}>{autoData.summary}</div>}
      </div>

      {(autoData.hmrcDeadlines||[]).map((d,i)=>(
        <Card key={i} style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, flexWrap:'wrap', gap:6 }}>
            <span style={{ fontSize:14, fontWeight:600 }}>{d.event}</span>
            <span style={{ fontSize:11, padding:'3px 10px', background:t.gold+'20', color:t.gold, borderRadius:20, fontWeight:700 }}>{d.deadline}</span>
          </div>
          <div style={{ fontSize:12, color:t.muted, lineHeight:1.5 }}>{d.action}</div>
        </Card>
      ))}

      {(autoData.optimisations||[]).map((o,i)=>(
        <div key={i} style={{ padding:'12px 14px', background:t.green+'08', border:'1px solid '+t.green+'20', borderRadius:12, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, flexWrap:'wrap', gap:4 }}>
            <span style={{ fontSize:14, fontWeight:700, color:t.green }}>{o.strategy}</span>
            {o.potentialSaving>0 && <span style={{ fontSize:13, color:t.green, fontWeight:600 }}>Save {fmt(o.potentialSaving)}</span>}
          </div>
          <div style={{ fontSize:12, color:t.muted, lineHeight:1.5 }}>{o.description}</div>
        </div>
      ))}

      <button onClick={()=>setShowManual(true)} style={{ width:'100%', padding:'13px', background:'none', color:t.muted, border:'1.5px solid '+t.border, borderRadius:14, fontSize:13, fontWeight:600, cursor:'pointer', marginTop:8 }}>
        Calculate RSU tax manually instead →
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth:600, margin:'0 auto' }}>
      <div style={{ fontSize:24, fontWeight:900, color:t.text, marginBottom:4, letterSpacing:-0.4 }}>🏛️ RSU & CGT Calculator</div>
      <div style={{ fontSize:14, color:t.muted, marginBottom:24, lineHeight:1.6 }}>Calculate your HMRC obligations when RSUs vest or shares are sold.</div>
      {hasAutoData && <button onClick={()=>setShowManual(false)} style={{ padding:'8px 14px', background:t.accent+'20', color:t.accent, border:'1px solid '+t.accent+'40', borderRadius:10, fontSize:12, cursor:'pointer', marginBottom:16 }}>← Back to auto-populated data</button>}
      <Card style={{ marginBottom:16 }}>
        <Field label="Number of Shares Vested"><Inp type="number" placeholder="e.g. 500" value={form.shares} onChange={e=>s('shares',e.target.value)} /></Field>
        <Field label="Market Value Per Share at Vest (£)"><Inp type="number" placeholder="e.g. 45.00" value={form.vestprice} onChange={e=>s('vestprice',e.target.value)} /></Field>
        <Field label="Sale Price Per Share (£)" optional hint="Leave blank if not yet sold"><Inp type="number" placeholder="e.g. 52.00" value={form.saleprice} onChange={e=>s('saleprice',e.target.value)} /></Field>
        <Field label="Gross Salary This Tax Year (£)"><Inp type="number" placeholder="e.g. 85000" value={form.salary} onChange={e=>s('salary',e.target.value)} /></Field>
        <Field label="Previous RSU Already Taxed via Payroll (£)" optional><Inp type="number" placeholder="e.g. 12000" value={form.prevvest} onChange={e=>s('prevvest',e.target.value)} /></Field>
        <Field label="Tax Band">
          <Sel value={form.taxRate} onChange={v=>s('taxRate',v)} placeholder="Select…" options={[{value:'basic',label:'Basic rate — 20% (under £50,270)',emoji:'📊'},{value:'higher',label:'Higher rate — 40% (£50,270–£125,140)',emoji:'📈'},{value:'additional',label:'Additional rate — 45% (over £125,140)',emoji:'💹'}]} />
        </Field>
      </Card>
      {err && <div style={{ color:t.red, fontSize:13, padding:'12px 16px', background:t.red+'12', borderRadius:14, marginBottom:16, lineHeight:1.5 }}>{err}</div>}
      {busy
        ? <div style={{ textAlign:'center', padding:'32px 0', color:t.muted }}><div style={{ fontSize:28, display:'inline-block', animation:'spin 1.5s linear infinite', marginBottom:10 }}>⚙️</div><div>Calculating…</div></div>
        : <button onClick={run} style={{ width:'100%', padding:'16px', background:t.gold, color:'#0a0800', border:'none', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer' }}>Calculate HMRC Liability →</button>
      }
      {result && (
        <div style={{ marginTop:24, animation:'fadeUp 0.35s ease both' }}>
          <div style={{ padding:'20px', background:t.red+'10', border:'1px solid '+t.red+'30', borderRadius:18, marginBottom:14 }}>
            <div style={{ fontSize:10, color:t.red, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:0.7 }}>Total Tax Bill</div>
            <div style={{ fontSize:38, fontWeight:900, color:t.red }}>{fmt(result.totalTaxBill)}</div>
            {result.summary && <div style={{ fontSize:13, color:t.muted, marginTop:6, lineHeight:1.6 }}>{result.summary}</div>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <Card><div style={{ fontSize:11, color:t.muted, marginBottom:8, fontWeight:700 }}>AT VESTING</div><div style={{ fontSize:13, marginBottom:5 }}>Income Tax: <span style={{ color:t.red, fontWeight:700 }}>{fmt(result.vestingTaxEvent?.incomeTaxDue)}</span></div><div style={{ fontSize:13 }}>NI: <span style={{ color:t.red, fontWeight:700 }}>{fmt(result.vestingTaxEvent?.niDue)}</span></div></Card>
            <Card><div style={{ fontSize:11, color:t.muted, marginBottom:8, fontWeight:700 }}>ON SALE (CGT)</div><div style={{ fontSize:13, marginBottom:5 }}>Gain: <span style={{ fontWeight:700 }}>{fmt(result.saleTaxEvent?.gain)}</span></div><div style={{ fontSize:13 }}>CGT Due: <span style={{ color:t.red, fontWeight:700 }}>{fmt(result.saleTaxEvent?.cgtDue)}</span></div></Card>
          </div>
          {(result.hmrcDeadlines||[]).length>0 && <Card style={{ marginBottom:12 }}><div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:12 }}>🗓️ HMRC Deadlines</div>{result.hmrcDeadlines.map((d,i)=><div key={i} style={{ padding:'9px 0', borderTop:i>0?'1px solid '+t.border:'none' }}><div style={{ display:'flex', justifyContent:'space-between', marginBottom:3, flexWrap:'wrap', gap:4 }}><span style={{ fontSize:13, fontWeight:600 }}>{d.event}</span><span style={{ fontSize:11, padding:'2px 9px', background:t.gold+'20', color:t.gold, borderRadius:20, fontWeight:700 }}>{d.deadline}</span></div><div style={{ fontSize:12, color:t.muted, lineHeight:1.5 }}>{d.action}</div></div>)}</Card>}
          {result.selfAssessmentRequired && <div style={{ padding:'13px 16px', background:t.gold+'12', border:'1px solid '+t.gold+'30', borderRadius:14 }}><div style={{ color:t.gold, fontWeight:700, fontSize:14, marginBottom:6 }}>⚠️ Self-Assessment Required</div><div style={{ color:t.muted, fontSize:13, lineHeight:1.6 }}>Register at gov.uk/self-assessment by 5 October. Online deadline: 31 January.</div></div>}
        </div>
      )}
    </div>
  )
}
