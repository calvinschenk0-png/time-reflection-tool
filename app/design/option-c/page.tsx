export default function OptionC() {
  const logged = 6.5
  const expected = 8
  const pct = Math.round((logged / expected) * 100)

  const r = 56
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  const categories = [
    { name: 'Horizon', sub: 'Enterprise PMO', hours: 2.5, color: '#2563eb' },
    { name: 'Internal Ops', sub: 'Knowledge Mgmt', hours: 1.5, color: '#7c3aed' },
    { name: 'Training', sub: 'L&D Initiative', hours: 1.5, color: '#16a34a' },
    { name: 'Client PMO', sub: 'Exec Alignment', hours: 1.0, color: '#d97706' },
  ]

  const activities = [
    { name: 'Meetings', hours: 2.5, pct: 38, color: '#2563eb' },
    { name: 'Drafting', hours: 1.5, pct: 23, color: '#7c3aed' },
    { name: 'Reviewing', hours: 1.5, pct: 23, color: '#16a34a' },
    { name: 'Planning', hours: 1.0, pct: 15, color: '#d97706' },
  ]

  const weekDays = [
    { day: 'Mon', h: 7.5, done: true },
    { day: 'Tue', h: 8.0, done: true },
    { day: 'Wed', h: 6.5, done: false },
    { day: 'Thu', h: 0, done: false },
    { day: 'Fri', h: 0, done: false },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-ui { font-family: 'Inter', sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div className="font-ui min-h-screen" style={{ background: '#ffffff', color: '#111111' }}>

        {/* Top bar */}
        <div style={{ borderBottom: '1px solid #f0f0f0', padding: '0 24px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>TimeReflection</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['Home', 'Log', 'Insights', 'Settings'].map(l => (
                <span key={l} style={{
                  fontSize: 13,
                  color: l === 'Home' ? '#111' : '#999',
                  cursor: 'pointer',
                  fontWeight: l === 'Home' ? 600 : 400,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: l === 'Home' ? '#f5f5f5' : 'transparent',
                }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '36px 24px 80px' }}>

          {/* Hero: big number + ring side by side */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 8, fontWeight: 500 }}>Wednesday, 18 June</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
                <span className="font-display" style={{ fontSize: 72, fontWeight: 700, lineHeight: 1, color: '#111', letterSpacing: '-0.04em' }}>6.5</span>
                <span className="font-display" style={{ fontSize: 28, fontWeight: 600, color: '#999', paddingBottom: 8, letterSpacing: '-0.02em' }}>h</span>
              </div>
              <p style={{ fontSize: 14, color: '#999' }}>of {expected}h expected</p>
            </div>

            {/* Ring — secondary, supporting the number */}
            <svg width={136} height={136}>
              <circle cx={68} cy={68} r={r} fill="none" stroke="#f0f0f0" strokeWidth={10} />
              <circle
                cx={68} cy={68} r={r}
                fill="none"
                stroke="#2563eb"
                strokeWidth={10}
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 68 68)"
              />
              <text x={68} y={64} textAnchor="middle" fill="#111" fontSize={20} fontFamily="'Space Grotesk', sans-serif" fontWeight={700}>{pct}%</text>
              <text x={68} y={80} textAnchor="middle" fill="#999" fontSize={10} fontFamily="'Inter', sans-serif">logged</text>
            </svg>
          </div>

          {/* Log button — full width, prominent */}
          <button style={{
            width: '100%',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.01em',
          }}>
            <span>Log your time</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#2563eb', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>2 days behind</span>
              <span style={{ fontSize: 18 }}>→</span>
            </div>
          </button>

          {/* Today breakdown — colour pills */}
          <div style={{ marginBottom: 24 }}>
            <p className="font-display" style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>Today by engagement</p>

            {/* Stacked bar */}
            <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 16, gap: 2 }}>
              {categories.map(c => (
                <div key={c.name} style={{ flex: c.hours, background: c.color, borderRadius: 99 }} />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categories.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#111', flex: 1, fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{c.sub}</span>
                  <span className="font-display" style={{ fontSize: 13, fontWeight: 700, color: '#111', minWidth: 32, textAlign: 'right' }}>{c.hours}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#f0f0f0', marginBottom: 24 }} />

          {/* Week bar chart */}
          <div style={{ marginBottom: 24 }}>
            <p className="font-display" style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>This week</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 72 }}>
              {weekDays.map(d => (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%',
                    height: `${(d.h / 8) * 58}px`,
                    background: d.done ? '#111' : d.h > 0 ? '#d97706' : '#f0f0f0',
                    borderRadius: 6,
                    minHeight: d.h === 0 ? 4 : undefined,
                  }} />
                  <span style={{ fontSize: 10, color: '#999', fontWeight: 500 }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <p className="font-display" style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>This week by activity</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activities.map(a => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#111', flex: 1, fontWeight: 500 }}>{a.name}</span>
                  <div style={{ width: 100, height: 6, background: '#f0f0f0', borderRadius: 99 }}>
                    <div style={{ height: 6, width: `${a.pct}%`, background: a.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#999', minWidth: 28, textAlign: 'right' }}>{a.hours}h</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div style={{ position: 'fixed', bottom: 16, right: 16, background: '#111', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
          Option C — Bold Signal
        </div>
      </div>
    </>
  )
}
