import { useState, useRef, useEffect } from 'react'
import { t, fmt, safeJSON, Card, StatBox } from './ui.jsx'

async function pdfToImages(file) {
  const lib = window.pdfjsLib
  if (!lib) throw new Error('PDF.js not loaded — please refresh')
  lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise
  const imgs = []
  for (let i = 1; i <= Math.min(pdf.numPages, 12); i++) {
    const page = await pdf.getPage(i)
    const vp = page.getViewport({ scale: 1.4 })
    const canvas = document.createElement('canvas')
    canvas.width = vp.width; canvas.height = vp.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
    imgs.push(canvas.toDataURL('image/jpeg', 0.75).split(',')[1])
  }
  return imgs
}

function Chat({ ctx, title, hints }) {
  const [msgs, setMsgs] = useState([])
  const [val, setVal] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const endRef = useRef()
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async (text) => {
    const q = (text || val).trim()
    if (!q || busy) return
    setVal(''); setBusy(true); setOpen(true)
    const history = [...msgs, { role: 'user', content: q }]
    setMsgs([...history, { role: 'assistant', content: '…' }])
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': window.__KEY__ },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 500,
          system: 'UK financial adviser. Concise, practical answers. Guidance only. Tax year 2024/25.\nContext: ' + ctx,
          messages: history })
      })
      const d = await res.json()
      setMsgs([...history, { role: 'assistant', content: (d.content||[]).map(b=>b.text||'').join('') || 'No response.' }])
    } catch(e) { setMsgs([...history, { role: 'assistant', content: '❌ ' + e.message }]) }
    setBusy(false)
  }

  return (
    <div style={{ marginTop:16, borderRadius:14, overflow:'hidden', background:t.surface, border:'1px solid '+t.border }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:'100%', padding:'13px 16px', background:'none', border:'none', color:t.text, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:t.accent+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>💬</div>
          <span style={{ fontSize:14, fontWeight:600 }}>Ask about {title}</span>
        </div>
        <span style={{ color:t.muted, fontSize:11, fontWeight:600 }}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div style={{ borderTop:'1px solid '+t.border }}>
          {msgs.length===0 && hints && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'12px 14px' }}>
              {hints.map(h=><button key={h} onClick={()=>send(h)} style={{ fontSize:12, padding:'7px 13px', background:t.dim, border:'1px solid '+t.border, borderRadius:20, color:t.muted, cursor:'pointer' }}>{h}</button>)}
            </div>
          )}
          {msgs.length>0 && (
            <div style={{ maxHeight:280, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
              {msgs.map((m,i)=>(
                <div key={i} style={{ maxWidth:'85%', padding:'10px 13px', borderRadius:12, fontSize:13, lineHeight:1.65, alignSelf:m.role==='user'?'flex-end':'flex-start', background:m.role==='user'?t.accent:t.card, color:m.role==='user'?'#fff':t.text, border:m.role==='assistant'?'1px solid '+t.border:'none', opacity:m.content==='…'?0.5:1 }}>{m.content}</div>
              ))}
              <div ref={endRef} />
            </div>
          )}
          <div style={{ display:'flex', gap:8, padding:'12px 14px', borderTop:'1px solid '+t.border }}>
            <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask a question…" style={{ flex:1, background:t.card, border:'1px solid '+t.border, borderRadius:10, padding:'11px 13px', color:t.text, fontSize:13, fontFamily:'inherit' }} />
            <button onClick={()=>send()} disabled={busy||!val.trim()} style={{ background:t.accent, border:'none', borderRadius:10, padding:'11px 16px', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:16, opacity:busy||!val.trim()?0.4:1 }}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}

function DocsPanel({ docs, profile, onAnalysisDone, alreadyAnalysed }) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const allFiles = [...(docs?.bankStatements||[]), ...(docs?.pcsFiles||[]), ...(docs?.payslipFiles||[])]

  if (!allFiles.length) return (
    <div style={{ background:t.card, border:'1.5px dashed '+t.border, borderRadius:18, padding:'32px 20px', textAlign:'center', marginBottom:16 }}>
      <div style={{ fontSize:36, marginBottom:12 }}>📂</div>
      <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:6 }}>No documents yet</div>
      <div style={{ fontSize:13, color:t.muted, marginBottom:20, lineHeight:1.6 }}>Upload bank statements in your profile to get a full analysis — spending, income and tax all auto-populated.</div>
    </div>
  )

  const analyse = async () => {
    const key = window.__KEY__
    if (!key) { setErr('No API key.'); return }
    setBusy(true); setErr('')

    // Build profile context for smarter analysis
    const profileCtx = profile ? [
      'Monthly rent: £' + (profile.monthlyRent || 0),
      'Employment: ' + profile.employmentStatus,
      'Company: ' + (profile.company || 'unknown'),
      'Pension type: ' + (profile.pensionType || 'unknown'),
      'Marital status: ' + (profile.maritalStatus || 'unknown'),
      'Has RSUs: ' + (profile.hasShares || 'unknown'),
    ].join('. ') : ''

    try {
      // ── Step 1: Analyse bank statements ──────────────────────────
      const banks = docs?.bankStatements || []
      if (banks.length > 0) {
        setStatus('Processing bank statements…')
        const content = []
        for (const file of banks) {
          if (file.name.toLowerCase().endsWith('.pdf')) {
            setStatus('Converting ' + file.name + '…')
            const imgs = await pdfToImages(file)
            imgs.forEach(img => content.push({ type:'image', source:{ type:'base64', media_type:'image/jpeg', data:img } }))
          } else {
            const text = await file.text()
            content.push({ type:'text', text:'CSV from '+file.name+':\n'+text.slice(0,7000) })
          }
        }
        content.push({ type:'text', text: [
          'Analyse these UK bank statements. User profile: ' + profileCtx,
          '',
          'IMPORTANT RULES for accuracy:',
          '- Transfers between the user and flatmates/family that offset shared bills (e.g. rent contributions) should NOT count as income',
          '- If the user pays rent of £' + (profile?.monthlyRent||0) + ' but receives £' + (profile?.monthlyRent||0) + ' from a flatmate, the NET rent cost is £0 — exclude the transfer from income',
          '- Only count genuine income: salary credits, freelance payments, BACS from employer, dividends, rental income from properties',
          '- Exclude: internal transfers, refunds, cashback, flatmate splits, savings pot movements',
          '',
          'Return ONLY valid JSON — no markdown, no backticks:',
          '{"summary":{"totalSpend":number,"totalIncome":number,"netIncome":number,"months":number},"categories":[{"name":string,"total":number,"pct":number,"transactions":number,"icon":string,"colour":string}],"merchants":[{"name":string,"category":string,"total":number,"visits":number,"icon":string}],"insights":[string,string,string],"monthlyAvgSpend":number,"monthlyAvgIncome":number,"detectedIncome":{"salary":number,"freelance":number,"rental":number,"other":number},"flags":{"flatmateTransfers":number,"internalTransfers":number}}',
          'Categories: Housing, Groceries, Eating Out, Travel, Entertainment, Shopping, Health, Dates/Social, Subscriptions, Tax & NI, Other.',
          'Use distinct hex colours. Sort merchants by total desc. Return raw JSON only.'
        ].join('\n') })

        setStatus('Analysing spending & income…')
        const r1 = await fetch('/api/claude', {
          method:'POST', headers:{'Content-Type':'application/json','x-api-key':key},
          body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:2500,
            system:'UK financial analyst. Return valid JSON only — no markdown, no backticks.',
            messages:[{ role:'user', content }] })
        })
        if (!r1.ok) throw new Error('API error ' + r1.status)
        const d1 = await r1.json()
        if (d1.error) throw new Error(d1.error.message || 'API error')
        const spending = JSON.parse((d1.content||[]).map(b=>b.text||'').join('').replace(/```json|```/g,'').trim())

        // ── Step 2: Auto-populate income from statements + profile ──
        setStatus('Calculating take-home pay…')
        const incomePrompt = [
          'Based on this UK bank statement analysis and user profile, calculate accurate take-home pay.',
          'Profile: ' + profileCtx,
          'Detected income from statements: ' + JSON.stringify(spending.detectedIncome || {}),
          'Monthly avg income from statements: £' + spending.monthlyAvgIncome,
          '',
          'Return ONLY valid JSON — no markdown:',
          '{"grossAnnual":number,"netMonthly":number,"netAnnual":number,"estimatedPension":number,"estimatedNI":number,"estimatedTax":number,"breakdown":[{"label":string,"amount":number,"type":"income"|"deduction"}],"tips":[string,string]}',
          'Work backwards from the net income to estimate gross. Account for pension (profile says '+profile?.pensionType+').',
          'If salary credits visible in statements, use those. Return raw JSON only.'
        ].join('\n')

        const r2 = await fetch('/api/claude', {
          method:'POST', headers:{'Content-Type':'application/json','x-api-key':key},
          body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:1000,
            system:'UK tax expert 2024/25. Return valid JSON only — no markdown.',
            messages:[{ role:'user', content: incomePrompt }] })
        })
        if (!r2.ok) throw new Error('API error ' + r2.status)
        const d2 = await r2.json()
        const income = JSON.parse((d2.content||[]).map(b=>b.text||'').join('').replace(/```json|```/g,'').trim())

        // ── Step 3: Auto-populate tax if PCS/payslips provided ──────
        let taxData = null
        const hasTaxDocs = (docs?.pcsFiles||[]).length > 0 || (docs?.payslipFiles||[]).length > 0
        if (hasTaxDocs) {
          setStatus('Extracting tax & RSU data…')
          const taxContent = []
          for (const file of [...(docs?.pcsFiles||[]), ...(docs?.payslipFiles||[])]) {
            if (file.name.toLowerCase().endsWith('.pdf')) {
              const imgs = await pdfToImages(file)
              imgs.forEach(img => taxContent.push({ type:'image', source:{ type:'base64', media_type:'image/jpeg', data:img } }))
            }
          }
          taxContent.push({ type:'text', text: [
            'Extract tax and RSU data from these documents. Profile: ' + profileCtx,
            'Return ONLY valid JSON — no markdown:',
            '{"totalTaxBill":number,"summary":string,"hmrcDeadlines":[{"event":string,"deadline":string,"action":string}],"optimisations":[{"strategy":string,"potentialSaving":number,"description":string}],"selfAssessmentRequired":boolean,"rsuVestingValue":number,"cgtDue":number}',
            'Return raw JSON only.'
          ].join('\n') })

          const r3 = await fetch('/api/claude', {
            method:'POST', headers:{'Content-Type':'application/json','x-api-key':key},
            body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:1000,
              system:'UK HMRC tax specialist. Return valid JSON only — no markdown.',
              messages:[{ role:'user', content: taxContent }] })
          })
          if (!r3.ok) throw new Error('API error ' + r3.status)
          const d3 = await r3.json()
          try { taxData = JSON.parse((d3.content||[]).map(b=>b.text||'').join('').replace(/```json|```/g,'').trim()) } catch(e) { console.warn('Tax parse failed', e) }
        }

        onAnalysisDone({ spending, income, tax: taxData })
      }

    } catch(e) { setErr('Analysis failed: ' + e.message) }
    setBusy(false); setStatus('')
  }

  return (
    <div style={{ background:t.card, border:'1px solid '+t.border, borderRadius:18, padding:'18px 16px', marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:t.text, marginBottom:2 }}>📂 Documents Ready</div>
          <div style={{ fontSize:13, color:t.muted }}>{allFiles.length} file{allFiles.length!==1?'s':''} · Analysis auto-populates all tabs</div>
        </div>
        {alreadyAnalysed && <span style={{ fontSize:10, padding:'3px 9px', background:t.green+'20', color:t.green, borderRadius:20, fontWeight:700 }}>✓ Analysed</span>}
      </div>

      {[['🏦','Bank Statements',docs?.bankStatements],['💰','PCS',docs?.pcsFiles],['📄','Payslips',docs?.payslipFiles]]
        .filter(([,,f])=>f?.length)
        .map(([icon,label,files])=>(
          <div key={label} style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, color:t.muted, marginBottom:4, fontWeight:600 }}>{icon} {label}</div>
            {files.map((f,i)=><div key={i} style={{ fontSize:12, color:t.green, marginBottom:2 }}>✓ {f.name}</div>)}
          </div>
        ))}

      {err && <div style={{ color:t.red, fontSize:13, padding:'11px 13px', background:t.red+'15', borderRadius:10, marginBottom:12, lineHeight:1.5 }}>{err}</div>}

      {busy ? (
        <div style={{ textAlign:'center', padding:'24px 0' }}>
          <div style={{ fontSize:28, display:'inline-block', animation:'spin 1.5s linear infinite', marginBottom:10 }}>⚙️</div>
          <div style={{ fontSize:13, color:t.muted }}>{status||'Analysing…'}</div>
        </div>
      ) : (
        <button onClick={analyse} style={{
          width:'100%', padding:'14px', marginTop:8,
          background: alreadyAnalysed ? t.dim : 'linear-gradient(135deg,'+t.accent+',#a855f7)',
          color: alreadyAnalysed ? t.muted : '#fff',
          border: alreadyAnalysed ? '1px solid '+t.border : 'none',
          borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer'
        }}>
          {alreadyAnalysed ? '↺ Re-analyse Documents' : '🔍 Analyse All Documents'}
        </button>
      )}
    </div>
  )
}

function SpendSection({ data, profile }) {
  const [view, setView] = useState('categories')
  return (
    <Card style={{ marginBottom:14, animation:'fadeUp 0.35s ease both' }}>
      <div style={{ fontSize:16, fontWeight:800, color:t.text, marginBottom:14 }}>📊 Spending</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <StatBox label="Monthly Spend" value={fmt(data.monthlyAvgSpend)} color={t.red} />
        <StatBox label="Monthly Income" value={fmt(data.monthlyAvgIncome)} color={t.green} />
      </div>
      {data.flags?.flatmateTransfers > 0 && (
        <div style={{ fontSize:12, color:t.gold, padding:'9px 12px', background:t.gold+'12', borderRadius:10, marginBottom:12, lineHeight:1.5 }}>
          ℹ️ Detected £{fmt(data.flags.flatmateTransfers)} in flatmate/shared transfers — excluded from income calculations
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['categories','merchants'].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, borderRadius:10, cursor:'pointer', background:view===v?t.accent:t.surface, color:view===v?'#fff':t.muted, border:'1px solid '+(view===v?t.accent:t.border), transition:'all 0.15s' }}>
            {v==='categories'?'Categories':'Merchants'}
          </button>
        ))}
      </div>
      {view==='categories' && (data.categories||[]).map(c=>(
        <div key={c.name} style={{ marginBottom:13 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:14 }}>{c.icon} {c.name} <span style={{ color:t.muted, fontSize:11 }}>({c.transactions})</span></span>
            <span style={{ fontSize:14, fontWeight:700 }}>{fmt(c.total)}</span>
          </div>
          <div style={{ background:t.dim, borderRadius:4, height:6, overflow:'hidden' }}>
            <div style={{ width:Math.min(c.pct||0,100)+'%', height:'100%', background:c.colour||t.accent, borderRadius:4 }} />
          </div>
        </div>
      ))}
      {view==='merchants' && (data.merchants||[]).slice(0,20).map((m,i)=>(
        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderTop:'1px solid '+t.border }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:t.dim, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{m.icon||'🏪'}</div>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>{m.name}</div>
              <div style={{ fontSize:11, color:t.muted }}>{m.category} · {m.visits}x</div>
            </div>
          </div>
          <span style={{ fontSize:15, fontWeight:700 }}>{fmt(m.total)}</span>
        </div>
      ))}
      {(data.insights||[]).map((ins,i)=>(
        <div key={i} style={{ display:'flex', gap:10, marginTop:12, fontSize:13, color:t.muted, lineHeight:1.6, padding:'10px 12px', background:t.surface, borderRadius:10 }}>
          <span style={{ color:t.accent, fontSize:16 }}>›</span><span>{ins}</span>
        </div>
      ))}
      <Chat ctx={'Spending: '+safeJSON(data,1500)+'\nProfile: '+safeJSON(profile,400)} title="your spending"
        hints={['Where am I overspending?','What should I cut first?','Am I spending too much on eating out?','What are my biggest cost categories?']} />
    </Card>
  )
}

function IncomeSection({ data, profile }) {
  const r = data?.result || data || {}
  return (
    <Card style={{ marginBottom:14, animation:'fadeUp 0.35s ease both' }}>
      <div style={{ fontSize:16, fontWeight:800, color:t.text, marginBottom:4 }}>💼 Income & Take-Home</div>
      <div style={{ fontSize:11, color:t.muted, marginBottom:14 }}>Auto-populated from your bank statements</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        <StatBox label="Net Monthly" value={fmt(r.netMonthly)} color={t.green} />
        <StatBox label="Gross Annual (est.)" value={fmt(r.grossAnnual)} color={t.text} />
      </div>
      {(r.breakdown||[]).map((b,i)=>(
        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderTop:'1px solid '+t.border, fontSize:14 }}>
          <span style={{ color:t.muted }}>{b.label}</span>
          <span style={{ fontWeight:700, color:b.type==='deduction'?t.red:t.green }}>{b.type==='deduction'?'−':'+'} {fmt(b.amount)}</span>
        </div>
      ))}
      {(r.tips||[]).map((tip,i)=>(
        <div key={i} style={{ display:'flex', gap:10, marginTop:10, fontSize:13, color:t.muted, lineHeight:1.6, padding:'10px 12px', background:t.surface, borderRadius:10 }}>
          <span style={{ color:t.gold }}>✦</span><span>{tip}</span>
        </div>
      ))}
      <Chat ctx={'Income: '+safeJSON(r,1000)+'\nProfile: '+safeJSON(profile,400)} title="income & tax"
        hints={['When is my PAYE deadline?','How can I reduce my income tax?','Should I increase my pension contributions?','What is my personal allowance?']} />
    </Card>
  )
}

function TaxSection({ data, profile }) {
  return (
    <Card style={{ marginBottom:14, animation:'fadeUp 0.35s ease both' }}>
      <div style={{ fontSize:16, fontWeight:800, color:t.text, marginBottom:4 }}>🏛️ Tax & RSUs</div>
      <div style={{ fontSize:11, color:t.muted, marginBottom:14 }}>Auto-populated from your PCS / payslips</div>
      <div style={{ padding:'16px', background:t.red+'12', border:'1px solid '+t.red+'30', borderRadius:14, marginBottom:14 }}>
        <div style={{ fontSize:10, color:t.red, fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:0.7 }}>Total HMRC Bill</div>
        <div style={{ fontSize:32, fontWeight:900, color:t.red }}>{fmt(data.totalTaxBill)}</div>
        {data.summary && <div style={{ fontSize:12, color:t.muted, marginTop:8, lineHeight:1.6 }}>{data.summary}</div>}
      </div>
      {(data.hmrcDeadlines||[]).map((d,i)=>(
        <div key={i} style={{ padding:'10px 0', borderTop:'1px solid '+t.border }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, flexWrap:'wrap', gap:6 }}>
            <span style={{ fontSize:14, fontWeight:600 }}>{d.event}</span>
            <span style={{ fontSize:11, padding:'3px 10px', background:t.gold+'20', color:t.gold, borderRadius:20, fontWeight:700 }}>{d.deadline}</span>
          </div>
          <div style={{ fontSize:12, color:t.muted, lineHeight:1.5 }}>{d.action}</div>
        </div>
      ))}
      {(data.optimisations||[]).map((o,i)=>(
        <div key={i} style={{ padding:'12px 13px', background:t.green+'08', border:'1px solid '+t.green+'22', borderRadius:12, marginTop:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, flexWrap:'wrap', gap:4 }}>
            <span style={{ fontSize:14, fontWeight:700, color:t.green }}>{o.strategy}</span>
            {o.potentialSaving>0 && <span style={{ fontSize:12, color:t.green, fontWeight:600 }}>Save {fmt(o.potentialSaving)}</span>}
          </div>
          <div style={{ fontSize:12, color:t.muted, lineHeight:1.5 }}>{o.description}</div>
        </div>
      ))}
      <Chat ctx={'Tax: '+safeJSON(data,1000)+'\nProfile: '+safeJSON(profile,400)} title="tax & RSUs"
        hints={['When do I need Self Assessment?','How do I reduce my CGT?','What is Bed & ISA?','Should I transfer shares to my partner?']} />
    </Card>
  )
}

export default function AnalysisHub({ spending, income, tax, profile, goals, docs, onAnalysisDone, onPlan }) {
  const has = spending || income || tax
  return (
    <div style={{ maxWidth:600, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:24, fontWeight:900, color:t.text, marginBottom:4, letterSpacing:-0.4 }}>Your Analysis</div>
        <div style={{ fontSize:14, color:t.muted, lineHeight:1.6 }}>Upload your documents once — we auto-populate spending, income and tax across all tabs. Ask questions in each section.</div>
      </div>
      <DocsPanel docs={docs} profile={profile} onAnalysisDone={onAnalysisDone} alreadyAnalysed={!!spending} />
      {spending && <SpendSection data={spending} profile={profile} />}
      {income && <IncomeSection data={income} profile={profile} />}
      {tax && <TaxSection data={tax} profile={profile} />}
      {has && (
        <button onClick={onPlan} style={{ width:'100%', padding:'17px', marginTop:8, background:'linear-gradient(135deg,'+t.accent+',#a855f7)', color:'#fff', border:'none', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', letterSpacing:-0.2 }}>
          ✨ Generate My Financial Plan →
        </button>
      )}
    </div>
  )
}
