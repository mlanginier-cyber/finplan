import { useState, useEffect } from 'react'
import { supabase, signInWithGoogle, signOut, getSession, ensureProfile, loadData, saveData } from './supabase.js'
import Onboarding from './components/Onboarding.jsx'
import AnalysisHub from './components/AnalysisHub.jsx'
import FinancialPlan from './components/FinancialPlan.jsx'
import IncomeTab from './components/IncomeTab.jsx'
import TaxTab from './components/TaxTab.jsx'
import AdminTab from './components/AdminTab.jsx'
import { t } from './components/ui.jsx'

const ADMIN_EMAIL = 'mlanginier@gmail.com'

const TABS = [
  { id: 'analysis', icon: '🔍', label: 'Analysis' },
  { id: 'income',   icon: '💼', label: 'Income'   },
  { id: 'tax',      icon: '🏛️',  label: 'Tax'      },
  { id: 'plan',     icon: '📋', label: 'Plan'     },
]

function Login() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const go = async () => {
    setLoading(true); setErr('')
    try { await signInWithGoogle() } catch (e) { setErr(e.message); setLoading(false) }
  }
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg, #7c6fff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>💷</div>
        <h1 style={{ color: '#eeeef8', fontSize: 30, fontWeight: 900, marginBottom: 10, letterSpacing: -0.8 }}>FinPlan AI</h1>
        <p style={{ color: '#64648a', fontSize: 15, marginBottom: 48, lineHeight: 1.7 }}>Your intelligent UK financial planner. Personalised analysis, honest advice.</p>
        
        <button onClick={go} disabled={loading} style={{ width: '100%', padding: '17px', background: '#fff', color: '#1f1f1f', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: loading ? 0.7 : 1, marginBottom: 16 }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>
        {err && <div style={{ color: '#ff5b6b', fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <p style={{ color: '#3a3a5c', fontSize: 12, lineHeight: 1.6 }}>Secure · Private · Your data only</p>
      </div>
    </div>
  )
}

function ApiKey({ user, onSave }) {
  const [key, setKey] = useState('')
  const [err, setErr] = useState('')
  const name = user.user_metadata?.given_name || user.email?.split('@')[0]
  const save = () => { if (!key.startsWith('sk-')) { setErr('Key must start with sk-'); return } onSave(key) }
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#18182a', border: '1px solid #252540', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28 }}>🔑</div>
        <h1 style={{ color: '#eeeef8', fontSize: 26, fontWeight: 900, marginBottom: 8, letterSpacing: -0.5 }}>Hey {name}!</h1>
        <p style={{ color: '#64648a', fontSize: 14, marginBottom: 32, lineHeight: 1.7 }}>Add your Anthropic API key to power the AI analysis. It stays on this device only — never sent to our servers.</p>
        <input type="password" value={key} onChange={e => { setKey(e.target.value); setErr('') }} onKeyDown={e => e.key === 'Enter' && save()} placeholder="sk-ant-api03-…" style={{ width: '100%', padding: '16px', background: '#12121c', color: '#eeeef8', border: '1.5px solid #252540', borderRadius: 14, fontSize: 15, fontFamily: 'inherit', marginBottom: 10, WebkitAppearance: 'none', letterSpacing: 1 }} />
        {err && <div style={{ color: '#ff5b6b', fontSize: 13, marginBottom: 10 }}>{err}</div>}
        <button onClick={save} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #7c6fff, #a855f7)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', marginBottom: 16 }}>Continue →</button>
        <p style={{ color: '#3a3a5c', fontSize: 12 }}>Get yours at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: '#7c6fff' }}>console.anthropic.com</a></p>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('finplan_key') || '')
  const [tab, setTab] = useState('analysis')
  const [data, setData] = useState({})
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 6000)
    getSession()
      .then(s => { setSession(s); setLoading(false); clearTimeout(timeout) })
      .catch(() => { setLoading(false); clearTimeout(timeout) })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session)
      if (session) {
        try {
          await ensureProfile(session.user)
          const saved = await loadData(session.user.id).catch(() => ({}))
          const d = saved || {}
          setData(d)
          setOnboarded(!!(d.profile && d.goals))
        } catch (e) { console.error('Session load error:', e) }
      }
      setLoading(false)
      clearTimeout(timeout)
    })
    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  useEffect(() => { if (apiKey) window.__KEY__ = apiKey }, [apiKey])

  const saveKey = k => { localStorage.setItem('finplan_key', k); window.__KEY__ = k; setApiKey(k) }

  const save = async (key, value) => {
    const updated = { ...data, [key]: value }
    setData(updated)
    if (session) {
      try { await saveData(session.user.id, { [key]: value }) } catch(e) { console.error('Save error:', e) }
    }
  }

  const onboardDone = async (od) => {
    // FIX: store documents in state (not DB - files can't be serialized)
    const updated = { ...data, profile: od.profile, goals: od.goals, documents: od.documents }
    setData(updated)
    setOnboarded(true)
    if (session) {
      try { await saveData(session.user.id, { profile: od.profile, goals: od.goals }) } catch(e) { console.error('Onboard save error:', e) }
    }
    setTab('analysis')
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#0a0a12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7c6fff, #a855f7)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💷</div>
        <div style={{ color: '#64648a', fontSize: 14, fontFamily: "'DM Sans', system-ui" }}>Loading…</div>
      </div>
    </div>
  )
  if (!session) return <Login />
  if (!apiKey) return <ApiKey user={session.user} onSave={saveKey} />
  if (!onboarded) return <Onboarding existing={data} onComplete={onboardDone} />

  const user = session.user
  const isAdmin = user.email === ADMIN_EMAIL
  const allTabs = isAdmin ? [...TABS, { id: 'admin', icon: '🔐', label: 'Admin' }] : TABS
  const name = data.profile?.firstName || user.user_metadata?.given_name || user.email?.split('@')[0]
  const avatar = user.user_metadata?.avatar_url

  return (
    <div style={{ minHeight: '100dvh', background: t.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: t.text, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: t.surface, borderBottom: '1px solid ' + t.border, paddingTop: 'env(safe-area-inset-top)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c6fff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💷</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: -0.3 }}>FinPlan AI</div>
              <div style={{ color: t.muted, fontSize: 10, fontWeight: 600 }}>{data.goals?.primaryGoal || 'UK Financial Planner'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setOnboarded(false)} style={{ background: 'none', border: '1px solid ' + t.border, color: t.muted, cursor: 'pointer', fontSize: 11, padding: '5px 10px', borderRadius: 8, fontWeight: 600 }}>Edit Profile</button>
            {avatar
              ? <img src={avatar} onClick={signOut} title="Sign out" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid ' + t.border, cursor: 'pointer' }} />
              : <button onClick={signOut} style={{ background: 'none', border: '1px solid ' + t.border, color: t.muted, cursor: 'pointer', fontSize: 11, padding: '5px 10px', borderRadius: 8 }}>Out</button>
            }
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
        {tab === 'analysis' && <AnalysisHub spending={data.spending} income={data.income} tax={data.tax} profile={data.profile} goals={data.goals} docs={data.documents} onAnalysisDone={d => { save('spending', d.spending); save('income', d.income); if (d.tax) save('tax', d.tax) }} onPlan={() => setTab('plan')} />}
        {tab === 'income'   && <IncomeTab saved={data.income} onSave={d => save('income', d)} profile={data.profile} />}
        {tab === 'tax'      && <TaxTab saved={data.tax} onSave={d => save('tax', d)} profile={data.profile} />}
        {tab === 'plan'     && <FinancialPlan spending={data.spending} income={data.income} tax={data.tax} profile={data.profile} goals={data.goals} saved={data.plan} onSave={d => save('plan', d)} />}
        {tab === 'admin'    && isAdmin && <AdminTab />}
      </div>

      {/* Bottom nav — Revolut style */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(18,18,28,0.95)', borderTop: '1px solid ' + t.border, backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ display: 'flex', padding: '6px 0 4px' }}>
          {allTabs.map(tb => {
            const active = tab === tb.id
            return (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0 6px', position: 'relative' }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{tb.icon}</span>
                <span style={{ fontSize: 9, fontWeight: active ? 800 : 500, color: active ? t.accent : t.muted, letterSpacing: 0.3 }}>{tb.label}</span>
                {active && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 3, background: t.accent, borderRadius: '3px 3px 0 0' }} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
