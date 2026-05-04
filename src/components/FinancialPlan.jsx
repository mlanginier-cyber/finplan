import { useState } from 'react'
import { t, fmt, safeJSON, Card, StatBox, Btn } from './ui.jsx'

export default function FinancialPlan({ spending, income, tax, profile, goals, saved, onSave }) {
  const [plan, setPlan] = useState(saved || null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const generate = async () => {
    setBusy(true); setErr('')
    const key = window.__KEY__
    if (!key) { setErr('No API key. Tap Edit Profile in the header.'); setBusy(false); return }

    // Keep context strings SHORT to avoid JSON truncation
    const pCtx = profile ? [
      (profile.firstName || '') + ' ' + (profile.lastName || ''),
      profile.employmentStatus, profile.company,
      profile.housingSituation,
      profile.monthlyRent ? 'rent:£' + profile.monthlyRent : null,
      profile.maritalStatus,
      profile.dependants !== 'None' ? profile.dependants : null,
      profile.pensionType,
      profile.hasShares === 'Yes' ? 'has RSUs' : null,
    ].filter(Boolean).join(', ') : 'not provided'

    const gCtx = goals ? [
      goals.primaryGoal,
      goals.propertyValue ? '£' + goals.propertyValue + ' property in ' + goals.propertyCity : null,
      goals.firstTimeBuyer === 'Yes' ? 'FTB' : null,
      goals.currentSavings ? 'saved:£' + goals.currentSavings : null,
      goals.targetDate ? 'by:' + goals.targetDate : null,
      goals.monthlySavings ? '£' + goals.monthlySavings + '/mo capacity' : null,
      (goals.secondaryGoals || []).slice(0, 3).join(', '),
    ].filter(Boolean).join(', ') : 'not provided'

    // Compact spending summary - avoid sending full merchant list
    const spendCtx = spending ? JSON.stringify({
      monthlyAvgSpend: spending.monthlyAvgSpend,
      monthlyAvgIncome: spending.monthlyAvgIncome,
      topCategories: (spending.categories || []).slice(0, 6).map(c => ({ name: c.name, total: c.total, pct: c.pct }))
    }) : 'not provided'

    const incCtx = income ? JSON.stringify({
      netMonthly: income.netMonthly || income.result?.netMonthly,
      grossAnnual: income.grossAnnual || income.result?.grossAnnual
    }) : 'not provided'

    const schema = '{"readinessScore":number,"summary":string,"timeToGoal":string,"monthlyBudget":{"netIncome":number,"essentials":{"housing":number,"groceries":number,"utilities":number,"transport":number},"lifestyle":{"eatingOut":number,"entertainment":number,"subscriptions":number,"shopping":number,"dates":number,"travel":number},"savings":{"emergencyFund":number,"isaContribution":number,"pensionTopUp":number,"goalSavings":number}},"reallocationAdvice":[{"from":string,"to":string,"amount":number,"reason":string,"flag":boolean}],"savingsAllocation":[{"bucket":string,"amount":number,"pct":number,"rationale":string,"priority":"essential"|"high"|"medium"}],"milestones":[{"date":string,"milestone":string,"amount":number,"action":string}],"optimisations":[{"title":string,"description":string,"monthlyImpact":number,"effort":"low"|"medium"|"high"}],"monthlyAnalysis":{"currentSurplus":number,"recommendedSurplus":number,"gap":number,"verdict":string},"warnings":[string],"nextSteps":[string]}'

    const prompt = [
      'Create a UK financial plan. Return ONLY valid JSON — no markdown, no text before or after:',
      schema, '',
      'PROFILE: ' + pCtx,
      'GOALS: ' + gCtx,
      'SPENDING (monthly avgs + top categories): ' + spendCtx,
      'INCOME: ' + incCtx,
      'TAX: ' + safeJSON(tax, 300), '',
      'Rules: honest about overspending (flag:true if significant). Budget must sum to netIncome.',
      'Priority: emergency fund > ISA > pension > goal. No specific fund names.',
      'Keep all strings under 120 chars. Keep arrays max 5 items each.'
    ].join('\n')

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5', max_tokens: 2500,
          system: 'UK personal finance coach. Return ONLY valid JSON. Keep all string values concise (under 120 chars). No markdown.',
          messages: [{ role: 'user', content: prompt }]
        })
      })
      if (!res.ok) throw new Error('API error ' + res.status)
      const d = await res.json()
      if (d.error) throw new Error(d.error.message || 'API error')
      const raw = (d.content || []).map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
      // Validate JSON before setting
      const result = JSON.parse(raw)
      setPlan(result)
      if (onSave) onSave(result)
    } catch (e) {
      if (e instanceof SyntaxError) {
        setErr('The AI response was too long and got cut off. Please try again — it usually works on the second attempt.')
      } else {
        setErr('Failed: ' + e.message)
      }
    }
    setBusy(false)
  }

  if (busy) return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,' + t.accent + ',#a855f7)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, animation: 'spin 3s linear infinite' }}>✨</div>
      <div style={{ fontSize: 18, color: t.text, fontWeight: 700, marginBottom: 8 }}>Building your plan…</div>
      <div style={{ fontSize: 14, color: t.muted }}>Analysing your profile, spending and goals</div>
    </div>
  )

  if (!plan) return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: t.text, marginBottom: 6, letterSpacing: -0.4 }}>Financial Plan</div>
      <div style={{ fontSize: 14, color: t.muted, marginBottom: 24, lineHeight: 1.6 }}>Your personalised monthly budget, savings strategy and honest reallocation advice — generated from your profile and documents.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[['📊','Monthly budget','Every pound accounted for'],['💰','Savings buckets','Emergency, ISA, pension, goal'],['🔄','Reallocation','Honest — what to move and where'],['⚡','Optimisations','Tax-efficient improvements']].map(([icon,title,desc])=>(
          <div key={title} style={{ background:t.card, border:'1px solid '+t.border, borderRadius:14, padding:'14px' }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:t.text, marginBottom:3 }}>{title}</div>
            <div style={{ fontSize:11, color:t.muted }}>{desc}</div>
          </div>
        ))}
      </div>
      {err && <div style={{ color:t.red, fontSize:13, padding:'12px 16px', background:t.red+'12', borderRadius:14, marginBottom:16, lineHeight:1.5 }}>{err}</div>}
      <Btn onClick={generate}>✨ Generate My Financial Plan</Btn>
    </div>
  )

  const budget = plan.monthlyBudget || {}
  const rcColor = plan.readinessScore > 66 ? t.green : plan.readinessScore > 33 ? t.gold : t.red

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, color:t.text, letterSpacing:-0.3 }}>📋 Your Plan</div>
            <div style={{ fontSize:12, color:t.muted, marginTop:3 }}>{plan.timeToGoal}</div>
          </div>
          <div style={{ textAlign:'center', background:t.surface, borderRadius:14, padding:'10px 16px' }}>
            <div style={{ fontSize:9, color:t.muted, marginBottom:2, textTransform:'uppercase', letterSpacing:0.7 }}>Readiness</div>
            <div style={{ fontSize:28, fontWeight:900, color:rcColor }}>{plan.readinessScore}<span style={{ fontSize:13, color:t.muted }}>/100</span></div>
          </div>
        </div>
        {plan.summary && <div style={{ fontSize:13, color:t.muted, lineHeight:1.7, padding:'12px 14px', background:t.surface, borderRadius:12, borderLeft:'3px solid '+t.accent }}>{plan.summary}</div>}
      </Card>

      {plan.monthlyAnalysis && (
        <div style={{ background:plan.monthlyAnalysis.gap>0?t.red+'10':t.green+'10', border:'1px solid '+(plan.monthlyAnalysis.gap>0?t.red:t.green)+'30', borderRadius:16, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
            {[['Current',fmt(plan.monthlyAnalysis.currentSurplus),t.text],['Recommended',fmt(plan.monthlyAnalysis.recommendedSurplus),t.green],['Gap',fmt(Math.abs(plan.monthlyAnalysis.gap)),plan.monthlyAnalysis.gap>0?t.red:t.green]].map(([l,v,c])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:9, color:t.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:0.5 }}>{l} surplus</div>
                <div style={{ fontSize:17, fontWeight:900, color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, color:t.muted, lineHeight:1.5 }}>{plan.monthlyAnalysis.verdict}</div>
        </div>
      )}

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:12 }}>💰 Monthly Budget</div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', marginBottom:4 }}>
          <span style={{ fontSize:15, fontWeight:700, color:t.green }}>Net Income</span>
          <span style={{ fontSize:17, fontWeight:900, color:t.green }}>{fmt(budget.netIncome)}</span>
        </div>
        {[['Essentials',budget.essentials,t.text],['Lifestyle',budget.lifestyle,t.text],['Savings & Investments',budget.savings,t.gold]].map(([section,obj,color])=>
          obj && Object.keys(obj).length > 0 && (
            <div key={section}>
              <div style={{ fontSize:10, fontWeight:700, color:section==='Savings & Investments'?t.gold:t.muted, textTransform:'uppercase', letterSpacing:0.7, marginTop:14, marginBottom:6 }}>{section}</div>
              {Object.entries(obj).filter(([,v])=>v>0).map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderTop:'1px solid '+t.border, fontSize:14 }}>
                  <span style={{ color:t.muted, textTransform:'capitalize' }}>{k.replace(/([A-Z])/g,' $1').trim()}</span>
                  <span style={{ fontWeight:600, color }}>{fmt(v)}</span>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      {(plan.reallocationAdvice||[]).length>0 && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:6 }}>🔄 Reallocation Advice</div>
          <div style={{ fontSize:12, color:t.muted, marginBottom:14 }}>Honest recommendations to reach your goals faster:</div>
          {plan.reallocationAdvice.map((r,i)=>(
            <div key={i} style={{ padding:'13px', borderRadius:12, marginBottom:10, background:r.flag?t.red+'10':t.accent+'08', border:'1px solid '+(r.flag?t.red+'30':t.accent+'25') }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:14, fontWeight:700, color:t.text }}>{r.from} → {r.to}</span>
                <span style={{ fontSize:15, fontWeight:900, color:r.flag?t.red:t.accent }}>{fmt(r.amount)}/mo</span>
              </div>
              <div style={{ fontSize:12, color:t.muted, lineHeight:1.5 }}>{r.reason}</div>
            </div>
          ))}
        </Card>
      )}

      {(plan.savingsAllocation||[]).length>0 && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:14 }}>🪣 Savings Buckets</div>
          {plan.savingsAllocation.map((s,i)=>(
            <div key={i} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:t.text }}>{s.bucket}</span>
                  <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, fontWeight:700, background:s.priority==='essential'?t.red+'22':s.priority==='high'?t.gold+'22':t.dim, color:s.priority==='essential'?t.red:s.priority==='high'?t.gold:t.muted }}>{s.priority}</span>
                </div>
                <span style={{ fontSize:14, fontWeight:700, color:t.gold }}>{fmt(s.amount)}/mo</span>
              </div>
              <div style={{ background:t.dim, borderRadius:4, height:5, marginBottom:6, overflow:'hidden' }}>
                <div style={{ width:Math.min(s.pct||0,100)+'%', height:'100%', background:t.gold, borderRadius:4 }} />
              </div>
              <div style={{ fontSize:11, color:t.muted, lineHeight:1.5 }}>{s.rationale}</div>
            </div>
          ))}
        </Card>
      )}

      {(plan.milestones||[]).length>0 && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:14 }}>🎯 Milestones</div>
          {plan.milestones.map((m,i)=>(
            <div key={i} style={{ display:'flex', gap:14, marginBottom:16, alignItems:'flex-start' }}>
              <div style={{ width:32, height:32, borderRadius:10, background:t.accent+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:t.accent, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:t.text }}>{m.milestone}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:t.gold }}>{fmt(m.amount)}</span>
                </div>
                <div style={{ fontSize:11, color:t.muted, marginBottom:3 }}>{m.date}</div>
                <div style={{ fontSize:12, color:t.muted, lineHeight:1.5 }}>{m.action}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {(plan.optimisations||[]).length>0 && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:14 }}>⚡ Optimisations</div>
          {plan.optimisations.map((o,i)=>(
            <div key={i} style={{ padding:'12px 14px', background:t.green+'08', border:'1px solid '+t.green+'20', borderRadius:12, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, flexWrap:'wrap', gap:6 }}>
                <span style={{ fontSize:14, fontWeight:700, color:t.green }}>{o.title}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {o.monthlyImpact>0 && <span style={{ fontSize:12, color:t.green, fontWeight:600 }}>{fmt(o.monthlyImpact)}/mo</span>}
                  <span style={{ fontSize:10, padding:'2px 8px', background:t.dim, borderRadius:10, color:t.muted }}>{o.effort}</span>
                </div>
              </div>
              <div style={{ fontSize:12, color:t.muted, lineHeight:1.5 }}>{o.description}</div>
            </div>
          ))}
        </Card>
      )}

      {(plan.warnings||[]).length>0 && (
        <div style={{ background:t.red+'08', border:'1px solid '+t.red+'25', borderRadius:16, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.red, marginBottom:10 }}>⚠️ Watch Out For</div>
          {plan.warnings.map((w,i)=>(
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8, fontSize:13, color:t.muted, lineHeight:1.5 }}>
              <span style={{ color:t.red, flexShrink:0 }}>!</span><span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {(plan.nextSteps||[]).length>0 && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:12 }}>✅ Your Next Steps</div>
          {plan.nextSteps.map((s,i)=>(
            <div key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:t.green+'20', color:t.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, flexShrink:0 }}>{i+1}</div>
              <span style={{ fontSize:13, color:t.muted, lineHeight:1.6 }}>{s}</span>
            </div>
          ))}
        </Card>
      )}

      <div style={{ padding:'12px 14px', background:t.gold+'08', border:'1px solid '+t.gold+'20', borderRadius:12, marginBottom:16, textAlign:'center' }}>
        <div style={{ color:t.gold, fontSize:11, lineHeight:1.6 }}>⚠️ AI guidance only — not regulated financial advice. Consult a qualified IFA for personalised regulated advice.</div>
      </div>

      <button onClick={generate} style={{ width:'100%', padding:'15px', background:t.dim, color:t.muted, border:'1.5px solid '+t.border, borderRadius:14, fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:24 }}>
        ↺ Regenerate Plan
      </button>
    </div>
  )
}
