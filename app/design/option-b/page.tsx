export default function OptionB() {
  const logged = 6.5
  const expected = 8
  const pct = Math.round((logged / expected) * 100)

  const r = 68
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  const categories = [
    { name: 'Horizon', sub: 'Enterprise PMO', hours: 2.5, pct: 38, color: '#5b7fa6' },
    { name: 'Internal Ops', sub: 'Knowledge Mgmt', hours: 1.5, pct: 23, color: '#4a7c59' },
    { name: 'Training', sub: 'L&D Initiative', hours: 1.5, pct: 23, color: '#8b6e9e' },
    { name: 'Client PMO', sub: 'Exec Alignment', hours: 1.0, pct: 15, color: '#c4933f' },
  ]

  const activities = [
    { name: 'Meetings', hours: 2.5, pct: 38 },
    { name: 'Drafting', hours: 1.5, pct: 23 },
    { name: 'Reviewing', hours: 1.5, pct: 23 },
    { name: 'Planning', hours: 1.0, pct: 15 },
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-ui { font-family: 'Inter', sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div className="font-ui min-h-screen" style={{ background: '#f5f3ee', color: '#2a2420' }}>

        {/* Top bar */}
        <div style={{ borderBottom: '1px solid #e8e3d8', padding: '0 24px', background: '#faf8f4' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-display" style={{ fontSize: 15, fontWeight: 600, color: '#2a2420', letterSpacing: '-0.01em' }}>Time Reflection</span>
            <div style={{ display: 'flex', gap: 24 }}>
              {['Home', 'Log', 'Insights', 'Settings'].map(l => (
                <span key={l} style={{ fontSize: 13, color: l === 'Home' ? '#2a2420' : '#9a8f85', cursor: 'pointer', fontWeight: l === 'Home' ? 500 : 400 }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px 80px' }}>

          {/* Date */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 12, color: '#9a8f85', fontWeight: 400, marginBottom: 6, letterSpacing: '0.02em' }}>Wednesday, 18 June 2025</p>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: '#2a2420', letterSpacing: '-0.02em' }}>Good afternoon</h1>
          </div>

          {/* Ring card */}
          <div style={{ background: '#faf8f4', border: '1px solid #e8e3d8', borderRadius: 20, padding: '36px 28px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              {/* Open-arc ring */}
              <div style={{ flexShrink: 0 }}>
                <svg width={160} height={160}>
                  <circle cx={80} cy={80} r={r} fill="none" stroke="#e8e3d8" strokeWidth={3} />
                  <circle
                    cx={80} cy={80} r={r}
                    fill="none"
                    stroke="#5b7fa6"
                    strokeWidth={3}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                  />
                  {/* Subtle end dot */}
                  <circle
                    cx={80 + r * Math.cos((pct / 100 * 2 * Math.PI) - Math.PI / 2)}
                    cy={80 + r * Math.sin((pct / 100 * 2 * Math.PI) - Math.PI / 2)}
                    r={4} fill="#5b7fa6"
                  />
                  <text x={80} y={73} textAnchor="middle" fill="#2a2420" fontSize={32} fontFamily="'Playfair Display', serif" fontWeight={700}>{logged}</text>
                  <text x={80} y={93} textAnchor="middle" fill="#9a8f85" fontSize={12} fontFamily="'Inter', sans-serif">hours logged</text>
                </svg>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 4 }}>
                  <p style={{ fontSize: 12, color: '#9a8f85', marginBottom: 2 }}>of {expected} hours expected</p>
                  <p className="font-display" style={{ fontSize: 22, fontWeight: 600, color: '#2a2420' }}>{pct}% covered</p>
                </div>
                <div style={{ height: 1, background: '#e8e3d8', margin: '16px 0' }} />
                <p style={{ fontSize: 12, color: '#c4933f', marginBottom: 16 }}>1.5h still to log today</p>
                <button style={{
                  width: '100%',
                  background: '#2a2420',
                  color: '#f5f3ee',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                  Log your time
                  <span style={{ background: '#c4933f', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>2</span>
                </button>
              </div>
            </div>
          </div>

          {/* Today by engagement */}
          <div style={{ background: '#faf8f4', border: '1px solid #e8e3d8', borderRadius: 20, padding: '24px 28px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: '#9a8f85', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>Today by engagement</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {categories.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 3, height: 36, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#2a2420' }}>{c.name}</span>
                      <span style={{ fontSize: 13, color: '#2a2420', fontWeight: 500 }}>{c.hours}h</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#9a8f85' }}>{c.sub} · {c.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* This week bar */}
          <div style={{ background: '#faf8f4', border: '1px solid #e8e3d8', borderRadius: 20, padding: '24px 28px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: '#9a8f85', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>This week</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 64 }}>
              {weekDays.map(d => (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%',
                    height: `${(d.h / 8) * 52}px`,
                    background: d.done ? '#5b7fa6' : d.h > 0 ? '#c4933f' : '#e8e3d8',
                    borderRadius: 4,
                    opacity: d.h === 0 ? 0.4 : 1
                  }} />
                  <span style={{ fontSize: 10, color: '#9a8f85' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div style={{ background: '#faf8f4', border: '1px solid #e8e3d8', borderRadius: 20, padding: '24px 28px' }}>
            <p style={{ fontSize: 11, color: '#9a8f85', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>This week by activity</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activities.map((a, i) => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#2a2420', flex: 1 }}>{a.name}</span>
                  <div style={{ width: 120, height: 2, background: '#e8e3d8', borderRadius: 99 }}>
                    <div style={{ height: 2, width: `${a.pct}%`, background: '#5b7fa6', borderRadius: 99, opacity: 1 - i * 0.15 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#9a8f85', width: 28, textAlign: 'right' }}>{a.hours}h</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div style={{ position: 'fixed', bottom: 16, right: 16, background: '#5b7fa6', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600 }}>
          Option B — Calm Paper
        </div>
      </div>
    </>
  )
}
