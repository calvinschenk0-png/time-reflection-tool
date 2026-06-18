export default function OptionC2() {
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

  const days = [
    { abbr: 'Fr', date: 20, logged: false, isToday: false },
    { abbr: 'Sa', date: 21, logged: false, isToday: false },
    { abbr: 'Su', date: 22, logged: false, isToday: false },
    { abbr: 'Mo', date: 23, logged: true,  isToday: false },
    { abbr: 'Tu', date: 24, logged: true,  isToday: false },
    { abbr: 'We', date: 25, logged: true,  isToday: false },
    { abbr: 'Th', date: 26, logged: false, isToday: true  },
  ]

  const weekDays = [
    { day: 'Mon', h: 7.5, done: true },
    { day: 'Tue', h: 8.0, done: true },
    { day: 'Wed', h: 6.5, done: false },
    { day: 'Thu', h: 0, done: false },
    { day: 'Fri', h: 0, done: false },
  ]

  const card: React.CSSProperties = {
    background: '#f4f4f5',
    borderRadius: 20,
    padding: '24px',
    marginBottom: 12,
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-ui { font-family: 'Inter', sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .day-pill { cursor: pointer; transition: transform 0.1s; }
        .day-pill:hover { transform: scale(1.05); }
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
                  background: l === 'Home' ? '#f0f0f0' : 'transparent',
                }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 24px 80px' }}>

          {/* Date line above cards */}
          <p style={{ fontSize: 12, color: '#999', marginBottom: 16, fontWeight: 500 }}>Thursday, 26 June 2025</p>

          {/* Card 1: Hero hours + ring */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
                  <span className="font-display" style={{ fontSize: 72, fontWeight: 700, lineHeight: 1, color: '#111', letterSpacing: '-0.04em' }}>6.5</span>
                  <span className="font-display" style={{ fontSize: 28, fontWeight: 600, color: '#999', paddingBottom: 8, letterSpacing: '-0.02em' }}>h</span>
                </div>
                <p style={{ fontSize: 14, color: '#999' }}>of {expected}h expected today</p>
              </div>

              <svg width={136} height={136}>
                <circle cx={68} cy={68} r={r} fill="none" stroke="#e4e4e7" strokeWidth={10} />
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
          </div>

          {/* Card 2: Week strip */}
          <div style={{ ...card }}>
            {/* Week nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 18 }}>
              <span style={{ color: '#bbb', fontSize: 18, cursor: 'pointer', userSelect: 'none' }}>‹</span>
              <span className="font-display" style={{ fontSize: 12, fontWeight: 600, color: '#999', letterSpacing: '0.08em' }}>THIS WEEK</span>
              <span style={{ color: '#bbb', fontSize: 18, cursor: 'pointer', userSelect: 'none' }}>›</span>
            </div>

            {/* Day pills */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
              {days.map(d => (
                <div
                  key={d.date}
                  className="day-pill"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    background: d.isToday ? '#2563eb' : '#e9e9eb',
                    borderRadius: 14,
                    padding: '12px 4px',
                    border: d.isToday ? '2px solid #93c5fd' : '2px solid transparent',
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: d.isToday ? '#bfdbfe' : '#999' }}>{d.abbr}</span>
                  <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: d.isToday ? '#fff' : '#333' }}>{d.date}</span>

                  {d.logged ? (
                    <div style={{ width: 20, height: 20, borderRadius: 99, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={11} height={9} viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : d.isToday ? (
                    <div style={{ width: 20, height: 20, borderRadius: 99, border: '2px solid #93c5fd', background: 'transparent' }} />
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: 99, border: '2px solid #ccc', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 8, height: 2, background: '#ccc', borderRadius: 99 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 14 }}>
              3 unlogged days · tap a day to log it
            </p>
          </div>

          {/* Card 3: Today by engagement */}
          <div style={card}>
            <p className="font-display" style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>Today by engagement</p>
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

          {/* Card 4: This week bar chart */}
          <div style={card}>
            <p className="font-display" style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>This week</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 72 }}>
              {weekDays.map(d => (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%',
                    height: `${(d.h / 8) * 58}px`,
                    background: d.done ? '#111' : d.h > 0 ? '#d97706' : '#e4e4e7',
                    borderRadius: 6,
                    minHeight: d.h === 0 ? 4 : undefined,
                  }} />
                  <span style={{ fontSize: 10, color: '#999', fontWeight: 500 }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: This week by activity */}
          <div style={card}>
            <p className="font-display" style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>This week by activity</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activities.map(a => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#111', flex: 1, fontWeight: 500 }}>{a.name}</span>
                  <div style={{ width: 100, height: 6, background: '#e4e4e7', borderRadius: 99 }}>
                    <div style={{ height: 6, width: `${a.pct}%`, background: a.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#999', minWidth: 28, textAlign: 'right' }}>{a.hours}h</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Compare links */}
        <div style={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <a href="/design/option-c" style={{ background: '#555', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, textDecoration: 'none' }}>
            ← Option C (dark card)
          </a>
          <div style={{ background: '#111', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
            Option C2 — Grey cards ✦
          </div>
        </div>
      </div>
    </>
  )
}
