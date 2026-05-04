export const t = {
  bg: '#080810', surface: '#0f0f1a', card: '#141428',
  border: '#1e1e38', subtle: '#181830',
  accent: '#7c6fff', gold: '#f0c040', green: '#22d9a0', red: '#ff4d6a',
  text: '#f0f0fa', muted: '#5a5a80', dim: '#2a2a48',
}

export const fmt = (n, d = 0) =>
  n != null ? '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—'

export const safeJSON = (obj, max = 2500) => {
  try {
    const s = JSON.stringify(obj ?? 'not provided')
    return (s.length > max ? s.slice(0, max) + '...' : s)
      .replace(/`/g, "'").replace(/\$\{/g, '$_{')
  } catch { return '"[error]"' }
}

// iOS-style select with arrow
export const Sel = ({ value, onChange, options, placeholder }) => (
  <div style={{ position: 'relative' }}>
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '15px 44px 15px 16px',
        background: t.surface, color: value ? t.text : t.muted,
        border: '1.5px solid ' + (value ? t.border : t.dim), borderRadius: 14,
        fontSize: 15, fontFamily: 'inherit',
        WebkitAppearance: 'none', appearance: 'none', cursor: 'pointer',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath fill='%235a5a80' d='M5 6L0 0h10z'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center',
        transition: 'border-color 0.15s'
      }}
    >
      <option value="" style={{ color: t.muted }}>{placeholder || 'Select…'}</option>
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : ((o.emoji ? o.emoji + ' ' : '') + o.label)
        return <option key={val} value={val} style={{ background: '#0f0f1a', color: '#f0f0fa' }}>{label}</option>
      })}
    </select>
  </div>
)

export const Field = ({ label, hint, optional, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: t.muted }}>{label}</label>
      {optional && <span style={{ fontSize: 10, color: '#3a3a5c', padding: '2px 7px', background: t.dim, borderRadius: 6 }}>Optional</span>}
    </div>
    {children}
    {hint && <div style={{ fontSize: 11, color: t.muted, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
  </div>
)

export const Inp = (props) => (
  <input {...props} style={{
    width: '100%', padding: '15px 16px', background: t.surface, color: t.text,
    border: '1.5px solid ' + t.dim, borderRadius: 14, fontSize: 15,
    fontFamily: 'inherit', WebkitAppearance: 'none', transition: 'border-color 0.15s',
    ...props.style
  }}
  onFocus={e => e.target.style.borderColor = t.accent}
  onBlur={e => e.target.style.borderColor = t.dim}
  />
)

export const Card = ({ children, style, accent }) => (
  <div style={{
    background: t.card,
    border: '1px solid ' + (accent || t.border),
    borderRadius: 20,
    padding: '18px 16px',
    ...(accent ? { borderLeft: '3px solid ' + accent } : {}),
    ...style
  }}>
    {children}
  </div>
)

export const StatBox = ({ label, value, color, size }) => (
  <div style={{ background: t.surface, borderRadius: 14, padding: '13px 14px' }}>
    <div style={{ fontSize: 9, color: t.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</div>
    <div style={{ fontSize: size || 22, fontWeight: 900, color: color || t.text }}>{value}</div>
  </div>
)

export const Btn = ({ children, onClick, disabled, variant, style }) => {
  const bg = variant === 'green' ? t.green : variant === 'gold' ? t.gold : variant === 'ghost' ? 'transparent' : variant === 'danger' ? t.red : 'linear-gradient(135deg, #7c6fff, #a855f7)'
  const col = variant === 'green' ? '#051a12' : variant === 'gold' ? '#0a0800' : variant === 'ghost' ? t.muted : '#fff'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '16px 0', background: disabled ? t.dim : bg,
      color: disabled ? '#3a3a5c' : col, border: variant === 'ghost' ? '1.5px solid ' + t.border : 'none',
      borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: disabled ? 'default' : 'pointer',
      letterSpacing: -0.2, ...style
    }}>{children}</button>
  )
}
