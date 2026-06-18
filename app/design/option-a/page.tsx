export default function OptionA() {
  const logged = 6.5
  const expected = 8
  const pct = Math.round((logged / expected) * 100)

  // SVG ring math
  const r = 72
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  const categories = [
    { name: 'Horizon', sub: 'Enterprise PMO', hours: 2.5, color: '#4f8ef7' },
    { name: 'Internal Ops', sub: 'Knowledge Mgmt', hours: 1.5, color: '#a78bfa' },
    { name: 'Training', sub: 'L&D Initiative', hours: 1.5, color: '#34d399' },
    { name: 'Client PMO', sub: 'Exec Alignment', hours: 1.0, color: '#f5a623' },
  ]

  const activities = [
    { name: 'Meetings', hours: 2.5, color: '#4f8ef7' },
    { name: 'Drafting', hours: 1.5, color: '#a78bfa' },
    { name: 'Review', hours: 1.5, color: '#34d399' },
    { name: 'Planning', hours: 1.0, color: '#f5a623' },
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
        .font-mono-data { font-family: 'Space Mono', monospace; }
        .font-ui { font-family: 'Inter', sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div className="font-ui min-h-screen" style={{ background: '#0f1117', color: '#e8eaf0' }}>

        {/* Top bar */}
        <div style={{ borderBottom: '1px solid #2a3042', padding: '0 24px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-mono-data" style={{ fontSize: 11, letterSpacing: '0.15em', color: '#4f8ef7' }}>TIME REFLECTION</span>
            <div style={{ display: 'flex', gap: 24 }}>
              {['HOME', 'LOG', 'INSIGHTS', 'SETTINGS'].map(l => (
                <span key={l} className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.12em', color: l === 'HOME' ? '#e8eaf0' : '#4a5568', cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 24px 80px' }}>

          {/* Date header */}
          <div style={{ marginBottom: 32 }}>
            <p className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#4a5568', marginBottom: 4 }}>WEDNESDAY · 18 JUNE 2025</p>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0' }}>Today</h1>
          </div>

          {/* Coverage ring */}
          <div style={{ background: '#1a1f2e', border: '1px solid #2a3042', borderRadius: 16, padding: '32px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Tick marks */}
              <svg width={172} height={172}>
                {/* Tick marks around the ring */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i / 24) * 2 * Math.PI - Math.PI / 2
                  const innerR = 86
                  const outerR = i % 6 === 0 ? 92 : 89
                  const cx = 86, cy = 86
                  return (
                    <line
                      key={i}
                      x1={cx + innerR * Math.cos(angle)}
                      y1={cy + innerR * Math.sin(angle)}
                      x2={cx + outerR * Math.cos(angle)}
                      y2={cy + outerR * Math.sin(angle)}
                      stroke={i % 6 === 0 ? '#4a5568' : '#2a3042'}
                      strokeWidth={i % 6 === 0 ? 2 : 1}
                    />
                  )
                })}
                {/* Track */}
                <circle cx={86} cy={86} r={r} fill="none" stroke="#2a3042" strokeWidth={8} />
                {/* Progress */}
                <circle
                  cx={86} cy={86} r={r}
                  fill="none"
                  stroke="#4f8ef7"
                  strokeWidth={8}
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  transform="rotate(-90 86 86)"
                  style={{ filter: 'drop-shadow(0 0 6px #4f8ef7)' }}
                />
                {/* Centre text */}
                <text x={86} y={78} textAnchor="middle" fill="#e8eaf0" fontSize={28} fontFamily="'Space Mono', monospace" fontWeight={700}>{logged}h</text>
                <text x={86} y={100} textAnchor="middle" fill="#4a5568" fontSize={10} fontFamily="'Space Mono', monospace" letterSpacing="2">OF {expected}H</text>
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: '#4a5568', marginBottom: 4, letterSpacing: '0.1em' }}>COVERAGE</p>
                <p className="font-mono-data" style={{ fontSize: 28, fontWeight: 700, color: '#4f8ef7' }}>{pct}%</p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: '#4a5568', marginBottom: 4, letterSpacing: '0.1em' }}>UNLOGGED</p>
                <p className="font-mono-data" style={{ fontSize: 18, fontWeight: 700, color: '#f5a623' }}>1.5h</p>
              </div>
              <button style={{
                width: '100%', background: '#4f8ef7', color: '#0f1117',
                border: 'none', borderRadius: 8, padding: '10px 16px',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
                LOG TODAY
                <span style={{ background: '#0f1117', color: '#4f8ef7', borderRadius: 99, padding: '1px 6px', fontSize: 10 }}>2</span>
              </button>
            </div>
          </div>

          {/* Category breakdown */}
          <div style={{ background: '#1a1f2e', border: '1px solid #2a3042', borderRadius: 16, padding: '24px', marginBottom: 16 }}>
            <p className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.15em', color: '#4a5568', marginBottom: 16 }}>TODAY · BY ENGAGEMENT</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {categories.map(c => (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#e8eaf0' }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: '#4a5568', marginLeft: 8 }}>{c.sub}</span>
                    </div>
                    <span className="font-mono-data" style={{ fontSize: 12, color: c.color, fontWeight: 700 }}>{c.hours}h</span>
                  </div>
                  <div style={{ height: 3, background: '#2a3042', borderRadius: 99 }}>
                    <div style={{ height: 3, width: `${(c.hours / logged) * 100}%`, background: c.color, borderRadius: 99, boxShadow: `0 0 4px ${c.color}` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* This week */}
          <div style={{ background: '#1a1f2e', border: '1px solid #2a3042', borderRadius: 16, padding: '24px', marginBottom: 16 }}>
            <p className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.15em', color: '#4a5568', marginBottom: 16 }}>THIS WEEK</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 72 }}>
              {weekDays.map(d => (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', borderRadius: 4, height: `${(d.h / 8) * 60}px`, background: d.done ? '#4f8ef7' : d.h > 0 ? '#f5a623' : '#2a3042', boxShadow: d.done ? '0 0 6px #4f8ef766' : 'none' }} />
                  <span className="font-mono-data" style={{ fontSize: 9, color: '#4a5568', letterSpacing: '0.1em' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div style={{ background: '#1a1f2e', border: '1px solid #2a3042', borderRadius: 16, padding: '24px' }}>
            <p className="font-mono-data" style={{ fontSize: 10, letterSpacing: '0.15em', color: '#4a5568', marginBottom: 16 }}>THIS WEEK · BY ACTIVITY</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activities.map(a => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: a.color, flexShrink: 0, boxShadow: `0 0 4px ${a.color}` }} />
                  <span style={{ fontSize: 13, color: '#e8eaf0', flex: 1 }}>{a.name}</span>
                  <div style={{ width: 100, height: 2, background: '#2a3042', borderRadius: 99 }}>
                    <div style={{ height: 2, width: `${(a.hours / 2.5) * 100}%`, background: a.color, borderRadius: 99 }} />
                  </div>
                  <span className="font-mono-data" style={{ fontSize: 11, color: '#4a5568', width: 28, textAlign: 'right' }}>{a.hours}h</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Design label */}
        <div style={{ position: 'fixed', bottom: 16, right: 16, background: '#4f8ef7', color: '#0f1117', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>
          Option A — Instrument Panel
        </div>
      </div>
    </>
  )
}
