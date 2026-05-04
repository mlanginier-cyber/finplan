import { useState, useRef } from 'react'
import { t, Sel, Field, Inp, Btn } from './ui.jsx'

function FileUploader({ icon, title, subtitle, badge, fileKey, accept, data, onChange }) {
  const folderRef = useRef()
  const filesRef = useRef()
  const [drag, setDrag] = useState(false)
  const files = data[fileKey] || []
  const add = (list) => onChange({ ...data, [fileKey]: [...files, ...Array.from(list)] })
  const remove = (i) => onChange({ ...data, [fileKey]: files.filter((_, j) => j !== i) })

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files) }}
      style={{
        background: drag ? t.accent + '18' : files.length ? t.green + '0a' : t.card,
        border: '1.5px ' + (drag ? 'solid ' + t.accent : files.length ? 'solid ' + t.green + '60' : 'dashed ' + t.border),
        borderRadius: 18, padding: '18px 16px', marginBottom: 12, transition: 'all 0.2s'
      }}
    >
      <input
        ref={folderRef} type="file" accept={accept} multiple
        {...{ webkitdirectory: '' }}
        style={{ display: 'none' }}
        onChange={e => add(e.target.files)}
      />
      <input ref={filesRef} type="file" accept={accept} multiple style={{ display: 'none' }} onChange={e => add(e.target.files)} />
      
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{title}</span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
              background: badge === 'Most Important' ? t.accent + '30' : t.gold + '25',
              color: badge === 'Most Important' ? t.accent : t.gold
            }}>{badge}</span>
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 14, lineHeight: 1.6 }}>{subtitle}</div>
          
          {files.length > 0 ? (
            <div>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, flex: 1, color: t.green, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {f.name}</span>
                  <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => filesRef.current.click()} style={{ padding: '8px 14px', background: 'none', border: '1px solid ' + t.border, borderRadius: 10, color: t.muted, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Files</button>
                <button onClick={() => folderRef.current.click()} style={{ padding: '8px 14px', background: 'none', border: '1px solid ' + t.border, borderRadius: 10, color: t.muted, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Folder</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => filesRef.current.click()} style={{ padding: '11px 18px', background: t.accent, color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Upload files</button>
              <button onClick={() => folderRef.current.click()} style={{ padding: '11px 16px', background: t.dim, color: t.muted, border: '1px solid ' + t.border, borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>Upload folder</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Step1({ data, set }) {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 900, color: t.text, marginBottom: 6, letterSpacing: -0.5 }}>About You</div>
      <div style={{ fontSize: 14, color: t.muted, marginBottom: 32, lineHeight: 1.6 }}>This shapes your tax advice and financial plan. Takes about 2 minutes.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="First Name"><Inp placeholder="First name" value={data.firstName || ''} onChange={e => set('firstName', e.target.value)} /></Field>
        <Field label="Last Name"><Inp placeholder="Last name" value={data.lastName || ''} onChange={e => set('lastName', e.target.value)} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Date of Birth"><Inp type="date" value={data.dob || ''} onChange={e => set('dob', e.target.value)} /></Field>
        <Field label="Sex">
          <Sel value={data.sex} onChange={v => set('sex', v)} placeholder="Select…"
            options={[{ value: 'male', label: 'Male', emoji: '♂️' }, { value: 'female', label: 'Female', emoji: '♀️' }, { value: 'other', label: 'Other' }]} />
        </Field>
      </div>

      <Field label="Employment Status" hint="Affects pension, NI, and tax optimisation options">
        <Sel value={data.employmentStatus} onChange={v => set('employmentStatus', v)} placeholder="How do you earn?"
          options={[
            { value: 'Employed', label: 'Employed (PAYE)', emoji: '🏢' },
            { value: 'Self-Employed', label: 'Self-Employed', emoji: '💼' },
            { value: 'Director', label: 'Company Director', emoji: '🏦' },
            { value: 'Contractor', label: 'Contractor / Freelancer', emoji: '💻' },
            { value: 'Multiple Jobs', label: 'Multiple Jobs', emoji: '🔀' },
            { value: 'Unemployed', label: 'Not currently working', emoji: '⏸️' },
          ]} />
      </Field>

      {['Employed', 'Director', 'Contractor'].includes(data.employmentStatus) && (
        <Field label="Company" optional hint="Helps identify RSU schemes, employer pension contributions">
          <Inp placeholder="e.g. Google DeepMind" value={data.company || ''} onChange={e => set('company', e.target.value)} />
        </Field>
      )}

      <Field label="Housing Situation">
        <Sel value={data.housingSituation} onChange={v => set('housingSituation', v)} placeholder="Where do you live?"
          options={[
            { value: 'Renting', label: 'Renting (private)', emoji: '🏠' },
            { value: 'Own with Mortgage', label: 'Own with a mortgage', emoji: '🔑' },
            { value: 'Own Outright', label: 'Own outright', emoji: '🏡' },
            { value: 'With Parents', label: 'Living with parents', emoji: '👨‍👩‍👦' },
            { value: 'Other', label: 'Other arrangement', emoji: '🏗️' },
          ]} />
      </Field>

      {data.housingSituation === 'Renting' && (
        <Field label="Monthly Rent (£)">
          <Inp type="number" placeholder="e.g. 1800" value={data.monthlyRent || ''} onChange={e => set('monthlyRent', e.target.value)} />
        </Field>
      )}

      <Field label="Relationship Status" hint="Used for allowance transfers and joint planning">
        <Sel value={data.maritalStatus} onChange={v => set('maritalStatus', v)} placeholder="Select status…"
          options={[
            { value: 'Single', label: 'Single', emoji: '🙋' },
            { value: 'Married', label: 'Married', emoji: '💍' },
            { value: 'Civil Partner', label: 'Civil Partnership', emoji: '🤝' },
            { value: 'Cohabiting', label: 'Living with partner', emoji: '🏠' },
            { value: 'Divorced', label: 'Divorced / Separated', emoji: '📋' },
          ]} />
      </Field>

      {['Married', 'Civil Partner', 'Cohabiting'].includes(data.maritalStatus) && (
        <Field label="Partner's Tax Band" hint="For allowance transfers and CGT planning">
          <Sel value={data.partnerTaxBand} onChange={v => set('partnerTaxBand', v)} placeholder="Select…"
            options={[
              { value: 'higher', label: 'Higher rate (income > £50k)', emoji: '📈' },
              { value: 'basic', label: 'Basic rate', emoji: '📊' },
              { value: 'non_taxpayer', label: 'Non-taxpayer / low income', emoji: '📉' },
              { value: 'unknown', label: "Don't know", emoji: '❓' },
            ]} />
        </Field>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Dependants">
          <Sel value={data.dependants} onChange={v => set('dependants', v)} placeholder="Select…"
            options={['None', '1 child', '2 children', '3+ children', 'Other'].map(x => ({ value: x, label: x }))} />
        </Field>
        <Field label="Tax Residency">
          <Sel value={data.taxResidency} onChange={v => set('taxResidency', v)} placeholder="Select…"
            options={[
              { value: 'uk_resident', label: 'UK Resident & Domiciled' },
              { value: 'non_dom', label: 'UK Resident, Non-Dom' },
              { value: 'non_resident', label: 'Non-UK Resident' },
            ]} />
        </Field>
      </div>

      <Field label="Pension Type">
        <Sel value={data.pensionType} onChange={v => set('pensionType', v)} placeholder="What pension do you have?"
          options={[
            { value: 'Workplace', label: 'Workplace (auto-enrolment)', emoji: '🏢' },
            { value: 'Personal/SIPP', label: 'Personal pension / SIPP', emoji: '💰' },
            { value: 'Defined Benefit', label: 'Defined Benefit (final salary)', emoji: '🏛️' },
            { value: 'None', label: 'No pension currently', emoji: '⚠️' },
            { value: 'Multiple', label: 'Multiple pensions', emoji: '📦' },
          ]} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Hold RSUs / Shares?">
          <Sel value={data.hasShares} onChange={v => set('hasShares', v)} placeholder="Select…"
            options={[{ value: 'Yes', label: 'Yes', emoji: '📈' }, { value: 'No', label: 'No', emoji: '📊' }]} />
        </Field>
        <Field label="Self-Assessment?">
          <Sel value={data.selfAssessment} onChange={v => set('selfAssessment', v)} placeholder="Select…"
            options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }, { value: 'Unsure', label: 'Unsure' }]} />
        </Field>
      </div>

      <Field label="Anything else?" optional hint="Student loan, child benefit, rental income, foreign income…">
        <textarea value={data.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Optional context for better advice…"
          style={{ width: '100%', minHeight: 80, padding: '14px 16px', background: t.surface, color: t.text, border: '1.5px solid ' + t.dim, borderRadius: 14, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
      </Field>
    </div>
  )
}

function Step2({ data, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 900, color: t.text, marginBottom: 6, letterSpacing: -0.5 }}>Your Documents</div>
      <div style={{ fontSize: 14, color: t.muted, marginBottom: 16, lineHeight: 1.6 }}>All optional. Upload individual files or drag a whole folder.</div>
      <div style={{ padding: '12px 14px', background: t.green + '12', border: '1px solid ' + t.green + '30', borderRadius: 14, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
        <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>Documents go directly to the AI for analysis — never stored on our servers. They only exist in your browser session.</div>
      </div>

      <FileUploader icon="🏦" title="Bank Statements" badge="Most Important" fileKey="bankStatements" accept=".pdf,.csv,.txt" data={data} onChange={onChange}
        subtitle="PDF or CSV from any UK bank — Barclays, Monzo, Starling, HSBC etc. Upload multiple months or drag your whole statements folder." />

      <FileUploader icon="💰" title="PCS / Compensation Statement" badge="Optional" fileKey="pcsFiles" accept=".pdf" data={data} onChange={onChange}
        subtitle="Total compensation from your employer — salary, RSUs, bonus, pension contributions." />

      <FileUploader icon="📄" title="Payslips" badge="Optional" fileKey="payslipFiles" accept=".pdf" data={data} onChange={onChange}
        subtitle="Recent payslips — verifies take-home pay, pension deductions and NI." />

      <div style={{ background: t.card, border: '1px solid ' + t.border, borderRadius: 18, padding: '18px 16px', marginTop: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: t.text, marginBottom: 6 }}>💼 Other Income</div>
        <div style={{ fontSize: 12, color: t.muted, marginBottom: 12 }}>Freelance, rental, dividends, foreign income, side business etc.</div>
        <textarea value={data.otherIncome || ''} onChange={e => onChange({ ...data, otherIncome: e.target.value })}
          placeholder="e.g. £500/month freelance design, £800/month rental in Manchester…"
          style={{ width: '100%', minHeight: 80, padding: '14px 16px', background: t.surface, color: t.text, border: '1.5px solid ' + t.dim, borderRadius: 12, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
      </div>
    </div>
  )
}

function Step3({ data, set }) {
  const secondary = ['Travel 3-4x per year', 'Regular dating / social budget', 'Build investment portfolio', 'Maximise pension pot', 'Pay off student loan faster', 'Build a business fund']
  const toggle = g => {
    const c = data.secondaryGoals || []
    set('secondaryGoals', c.includes(g) ? c.filter(x => x !== g) : [...c, g])
  }
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 900, color: t.text, marginBottom: 6, letterSpacing: -0.5 }}>Your Goals</div>
      <div style={{ fontSize: 14, color: t.muted, marginBottom: 32, lineHeight: 1.6 }}>What are you working towards? We'll build your entire plan around these.</div>

      <Field label="Primary Goal">
        <Sel value={data.primaryGoal} onChange={v => set('primaryGoal', v)} placeholder="What's your main goal?"
          options={[
            { value: 'Buy a Property', label: 'Buy a property / home', emoji: '🏠' },
            { value: 'Emergency Fund', label: 'Build an emergency fund', emoji: '🛡️' },
            { value: 'Pay off Debt', label: 'Pay off debt faster', emoji: '💳' },
            { value: 'Retire Early', label: 'Retire early (FIRE)', emoji: '🔥' },
            { value: 'Build Wealth', label: 'Build long-term wealth', emoji: '📈' },
            { value: 'Big Purchase', label: 'Save for a big purchase', emoji: '🎯' },
            { value: 'Start a Business', label: 'Start or grow a business', emoji: '🚀' },
            { value: 'Other', label: 'Something else', emoji: '✨' },
          ]} />
      </Field>

      {data.primaryGoal === 'Buy a Property' && (
        <div style={{ background: t.accent + '10', border: '1px solid ' + t.accent + '30', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="Target Property Value (£)" style={{ marginBottom: 0 }}><Inp type="number" placeholder="450000" value={data.propertyValue || ''} onChange={e => set('propertyValue', e.target.value)} /></Field>
            <Field label="Current Savings (£)" style={{ marginBottom: 0 }}><Inp type="number" placeholder="15000" value={data.currentSavings || ''} onChange={e => set('currentSavings', e.target.value)} /></Field>
          </div>
          <Field label="City / Region" style={{ marginBottom: 12 }}>
            <Sel value={data.propertyCity} onChange={v => set('propertyCity', v)} placeholder="Where do you want to buy?"
              options={['London', 'Manchester', 'Birmingham', 'Leeds', 'Edinburgh', 'Bristol', 'Cardiff', 'Liverpool', 'Elsewhere in UK'].map(x => ({ value: x, label: x }))} />
          </Field>
          <Field label="First-time buyer?" style={{ marginBottom: 0 }}>
            <Sel value={data.firstTimeBuyer} onChange={v => set('firstTimeBuyer', v)} placeholder="Select…"
              options={[{ value: 'Yes', label: 'Yes — first-time buyer (SDLT relief applies)', emoji: '🎉' }, { value: 'No', label: 'No — I have owned before' }]} />
          </Field>
        </div>
      )}

      {data.primaryGoal && data.primaryGoal !== 'Buy a Property' && (
        <Field label="Target Amount (£)" optional>
          <Inp type="number" placeholder="e.g. 50000" value={data.targetAmount || ''} onChange={e => set('targetAmount', e.target.value)} />
        </Field>
      )}

      <Field label="Target Date" hint="When do you want to achieve this by?">
        <Inp type="date" value={data.targetDate || ''} onChange={e => set('targetDate', e.target.value)} />
      </Field>

      <Field label="Lifestyle Priorities" optional hint="Select everything that matters — we'll protect these in your plan">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {secondary.map(g => {
            const on = (data.secondaryGoals || []).includes(g)
            return (
              <button key={g} onClick={() => toggle(g)} style={{
                padding: '13px 16px', background: on ? t.accent + '20' : t.surface,
                border: '1.5px solid ' + (on ? t.accent + '80' : t.dim),
                borderRadius: 12, color: on ? t.accent : t.muted, fontSize: 14,
                fontWeight: on ? 700 : 400, cursor: 'pointer', textAlign: 'left',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'all 0.15s'
              }}>
                <span>{g}</span>
                {on && <span style={{ fontSize: 16 }}>✓</span>}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Monthly savings capacity (£)" hint="Rough estimate — we'll help you optimise this">
        <Inp type="number" placeholder="e.g. 500" value={data.monthlySavings || ''} onChange={e => set('monthlySavings', e.target.value)} />
      </Field>

      <Field label="Monthly statement reminders">
        <Sel value={data.monthlyReminder} onChange={v => set('monthlyReminder', v)} placeholder="Select preference…"
          options={[
            { value: 'yes', label: 'Yes — remind me to upload monthly', emoji: '📅' },
            { value: 'no', label: 'No thanks', emoji: '🤙' },
          ]} />
      </Field>
    </div>
  )
}

export default function Onboarding({ existing, onComplete }) {
  const [step, setStep] = useState(0)
  const [p, setP] = useState(existing?.profile || {})
  const [d, setD] = useState({})
  const [g, setG] = useState(existing?.goals || {})
  const setP2 = (k, v) => setP(x => ({ ...x, [k]: v }))
  const setG2 = (k, v) => setG(x => ({ ...x, [k]: v }))

  const canNext = [
    !!(p.firstName && p.employmentStatus && p.maritalStatus),
    true,
    !!(g.primaryGoal && g.targetDate)
  ][step]

  const next = () => {
    if (step < 2) { setStep(s => s + 1); window.scrollTo(0, 0) }
    else onComplete({ profile: p, documents: d, goals: g })
  }
  const back = () => { setStep(s => s - 1); window.scrollTo(0, 0) }

  const stepLabels = [['👤', 'Profile'], ['📁', 'Documents'], ['🎯', 'Goals']]

  return (
    <div style={{ minHeight: '100dvh', background: t.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: t.text }}>
      {/* Sticky header */}
      <div style={{ background: 'rgba(8,8,16,0.95)', borderBottom: '1px solid ' + t.border, padding: '16px 20px 14px', position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #7c6fff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💷</div>
            <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.3 }}>FinPlan AI</span>
          </div>
          <span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{step + 1} / 3</span>
        </div>
        {/* Progress track */}
        <div style={{ background: t.dim, borderRadius: 4, height: 4, overflow: 'hidden' }}>
          <div style={{ width: ((step + 1) / 3 * 100) + '%', height: '100%', background: 'linear-gradient(90deg, #7c6fff, #a855f7)', borderRadius: 4, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          {stepLabels.map(([icon, label], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: i < step ? t.green : i === step ? t.accent : t.muted, fontWeight: i === step ? 700 : 400, transition: 'color 0.3s' }}>
              <span style={{ fontSize: 13 }}>{i < step ? '✅' : icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 20px 140px', maxWidth: 520, margin: '0 auto' }}>
        {step === 0 && <Step1 data={p} set={setP2} />}
        {step === 1 && <Step2 data={d} onChange={setD} />}
        {step === 2 && <Step3 data={g} set={setG2} />}
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(8,8,16,0.97)', borderTop: '1px solid ' + t.border, padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto' }}>
          {step > 0 && (
            <button onClick={back} style={{ flex: 1, padding: '16px 0', background: 'none', color: t.muted, border: '1.5px solid ' + t.border, borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          )}
          <Btn onClick={next} disabled={!canNext} variant={step === 2 ? 'green' : undefined} style={{ flex: 3 }}>
            {step === 2 ? '✨ Start My Analysis' : 'Continue →'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
