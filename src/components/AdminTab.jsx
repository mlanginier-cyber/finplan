import { useState } from 'react'
import { t, fmt, Card } from './ui.jsx'

export default function AdminTab() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [profiles, setProfiles] = useState([])
  const [finData, setFinData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const login = async () => {
    if (pw !== 'finplan2024') { setErr('Incorrect password'); return }
    setAuthed(true); setErr(''); setLoading(true)
    try {
      const res = await fetch('/api/admin', { headers: { 'x-admin-key': 'finplan2024' } })
      const d = await res.json()
      setProfiles(d.profiles || []); setFinData(d.financialData || [])
    } catch (e) { setErr('Failed: ' + e.message) }
    setLoading(false)
  }

  const getD = (userId) => finData.find(d => d.user_id === userId) || {}

  if (!authed) return (
    <div style={{ maxWidth: 360, margin: '60px auto', textAlign: 'center', padding: '0 16px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: t.text, marginBottom: 6 }}>Admin Access</div>
      <div style={{ fontSize: 13, color: t.muted, marginBottom: 24 }}>View all user profiles and financial data</div>
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="Admin password" style={{ width: '100%', padding: '14px 16px', background: t.surface, color: t.text, border: '1.5px solid ' + t.border, borderRadius: 14, fontSize: 15, fontFamily: 'inherit', marginBottom: 10, WebkitAppearance: 'none' }} />
      {err && <div style={{ color: t.red, fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <button onClick={login} style={{ width: '100%', padding: '14px', background: t.accent, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Enter →</button>
    </div>
  )

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 20px', color: t.muted }}><div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div><div>Loading all profiles…</div></div>

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: t.text, marginBottom: 4 }}>👥 Admin Dashboard</div>
      <div style={{ fontSize: 12, color: t.muted, marginBottom: 16 }}>{profiles.length} user{profiles.length !== 1 ? 's' : ''}</div>
      {profiles.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: t.muted }}><div style={{ fontSize: 40, marginBottom: 12 }}>👤</div><div>No users yet.</div></div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {profiles.map(p => {
          const d = getD(p.id)
          const on = selected === p.id
          return (
            <div key={p.id} onClick={() => setSelected(on ? null : p.id)} style={{ background: on ? t.accent + '22' : t.card, border: '1px solid ' + (on ? t.accent : t.border), borderRadius: 14, padding: '14px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {p.avatar_url ? <img src={p.avatar_url} style={{ width: 28, height: 28, borderRadius: '50%' }} /> : <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{(p.full_name || p.email || '?')[0].toUpperCase()}</div>}
                <div><div style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{p.full_name || p.email}</div><div style={{ fontSize: 10, color: t.muted }}>Last: {new Date(p.last_seen).toLocaleDateString('en-GB')}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {d.spending && <span style={{ fontSize: 9, padding: '2px 6px', background: t.green + '22', color: t.green, borderRadius: 10, fontWeight: 700 }}>📊</span>}
                {d.income && <span style={{ fontSize: 9, padding: '2px 6px', background: t.accent + '22', color: t.accent, borderRadius: 10, fontWeight: 700 }}>💼</span>}
                {d.plan && <span style={{ fontSize: 9, padding: '2px 6px', background: t.gold + '22', color: t.gold, borderRadius: 10, fontWeight: 700 }}>📋</span>}
              </div>
              {d.spending && <div style={{ fontSize: 11, color: t.red, marginTop: 5, fontWeight: 600 }}>Spends {fmt(d.spending.monthlyAvgSpend)}/mo</div>}
              {d.income && <div style={{ fontSize: 11, color: t.green, fontWeight: 600 }}>Earns {fmt((d.income?.result || d.income)?.netMonthly)}/mo net</div>}
              {d.plan && <div style={{ fontSize: 11, color: t.gold, fontWeight: 600 }}>Readiness {d.plan.readinessScore}/100</div>}
            </div>
          )
        })}
      </div>
      {selected && (() => {
        const p = profiles.find(x => x.id === selected)
        const d = getD(selected)
        return (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 12 }}>{p?.full_name || p?.email} — Full Profile</div>
            <div style={{ fontSize: 11, color: t.muted, marginBottom: 4 }}>Email: {p?.email}</div>
            <div style={{ fontSize: 11, color: t.muted, marginBottom: 14 }}>Joined: {new Date(p?.created_at).toLocaleDateString('en-GB')}</div>
            {d.spending && <><div style={{ fontSize: 12, fontWeight: 700, color: t.accent, marginBottom: 8 }}>📊 Spending</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>{[['Spent', fmt(d.spending.summary?.totalSpend), t.red], ['Earned', fmt(d.spending.summary?.totalIncome), t.green], ['Monthly avg', fmt(d.spending.monthlyAvgSpend), t.accent]].map(([l, v, c]) => <div key={l} style={{ background: t.surface, borderRadius: 10, padding: '9px 12px' }}><div style={{ fontSize: 9, color: t.muted, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 15, fontWeight: 800, color: c }}>{v}</div></div>)}</div></>}
            {d.income && <><div style={{ fontSize: 12, fontWeight: 700, color: t.green, marginBottom: 8 }}>💼 Income</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>{[['Net Monthly', fmt((d.income?.result || d.income)?.netMonthly), t.green], ['Gross Annual', fmt((d.income?.result || d.income)?.grossAnnual), t.text]].map(([l, v, c]) => <div key={l} style={{ background: t.surface, borderRadius: 10, padding: '9px 12px' }}><div style={{ fontSize: 9, color: t.muted, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}</div></div>)}</div></>}
            {d.plan && <><div style={{ fontSize: 12, fontWeight: 700, color: t.gold, marginBottom: 8 }}>📋 Plan</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>{[['Readiness', d.plan.readinessScore + '/100', t.green], ['Deposit', fmt(d.plan.depositNeeded), t.gold], ['Save/mo', fmt(d.plan.monthlySavingsRequired), t.accent]].map(([l, v, c]) => <div key={l} style={{ background: t.surface, borderRadius: 10, padding: '9px 12px' }}><div style={{ fontSize: 9, color: t.muted, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</div></div>)}</div></>}
          </Card>
        )
      })()}
    </div>
  )
}
