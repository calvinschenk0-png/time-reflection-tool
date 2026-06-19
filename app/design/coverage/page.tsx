'use client'

// Prototype: six ways to show how much of the workday/week is logged and
// encourage filling the gaps. Dummy data only.

const BLUE = '#2563eb'
const GREEN = '#16a34a'
const AMBER = '#d97706'
const RED = '#dc2626'

const GOAL = 8 // hours/day
const week = [
  { d: 'Mon', h: 7.5 },
  { d: 'Tue', h: 8 },
  { d: 'Wed', h: 6.5 },
  { d: 'Thu', h: 4 },
  { d: 'Fri', h: 2 },
]
const weekLogged = week.reduce((s, x) => s + x.h, 0)   // 28
const weekGoal = week.length * GOAL                     // 40
const weekPct = Math.round((weekLogged / weekGoal) * 100)
const today = 6.5
const todayPct = Math.round((today / GOAL) * 100)

function barColor(h: number) {
  const p = h / GOAL
  if (p >= 0.95) return GREEN
  if (p >= 0.5) return BLUE
  return AMBER
}

function Card({ n, title, desc, children }: { n: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#f4f4f5', borderRadius: 20, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ width: 22, height: 22, borderRadius: 99, background: '#111', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>{n}</span>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>{title}</h2>
      </div>
      <p style={{ fontSize: 12, color: '#999', marginBottom: 16, lineHeight: 1.5 }}>{desc}</p>
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}>{children}</div>
    </div>
  )
}

export default function CoveragePrototype() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #fff; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 6 }}>
          Time-coverage & gap nudges — 6 options
        </h1>
        <p style={{ fontSize: 14, color: '#999', marginBottom: 32 }}>
          Today <strong>{today}h of {GOAL}h ({todayPct}%)</strong> · This week <strong>{weekLogged}h of {weekGoal}h ({weekPct}%)</strong>. Goal: fewer gaps.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

          {/* 1. Per-day coverage bars */}
          <Card n={1} title="Daily coverage bars" desc="One bar per day filling toward 8h, with a goal line. Empty space = unlogged. The week average sits alongside.">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 96, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: -4, right: -4, borderTop: `1px dashed #ccc` }} />
                {week.map(x => (
                  <div key={x.d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 18, height: 84, background: '#eee', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                      <div style={{ height: `${(x.h / GOAL) * 100}%`, background: barColor(x.h), borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#999' }}>{x.d}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: '#111' }}>{weekPct}%</p>
                <p style={{ fontSize: 11, color: '#999' }}>of the week</p>
              </div>
            </div>
          </Card>

          {/* 2. Dual rings */}
          <Card n={2} title="Today + week rings" desc="A big ring for the week and a small one for today, echoing the dashboard's coverage ring.">
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <svg width={96} height={96}>
                <circle cx={48} cy={48} r={40} fill="none" stroke="#eee" strokeWidth={9} />
                <circle cx={48} cy={48} r={40} fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round"
                  strokeDasharray={`${(weekPct / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`} transform="rotate(-90 48 48)" />
                <text x={48} y={44} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily="'Space Grotesk', sans-serif" fill="#111">{weekPct}%</text>
                <text x={48} y={60} textAnchor="middle" fontSize={9} fill="#999">week</text>
              </svg>
              <svg width={64} height={64}>
                <circle cx={32} cy={32} r={26} fill="none" stroke="#eee" strokeWidth={7} />
                <circle cx={32} cy={32} r={26} fill="none" stroke={GREEN} strokeWidth={7} strokeLinecap="round"
                  strokeDasharray={`${(todayPct / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`} transform="rotate(-90 32 32)" />
                <text x={32} y={30} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily="'Space Grotesk', sans-serif" fill="#111">{todayPct}%</text>
                <text x={32} y={44} textAnchor="middle" fontSize={8} fill="#999">today</text>
              </svg>
            </div>
          </Card>

          {/* 3. Battery / fuel gauge */}
          <Card n={3} title="Battery gauge" desc="A battery that fills as you log. Reads red when low, green when near-full — playful and instantly legible.">
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <div style={{ width: 150, height: 56, border: '3px solid #111', borderRadius: 10, padding: 4, display: 'flex' }}>
                  <div style={{ width: `${todayPct}%`, background: todayPct >= 95 ? GREEN : todayPct >= 50 ? BLUE : AMBER, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{todayPct}%</span>
                  </div>
                </div>
                <div style={{ width: 6, height: 22, background: '#111', borderRadius: 2, marginLeft: 2 }} />
              </div>
              <p style={{ fontSize: 12, color: '#999', marginTop: 10 }}>{today}h logged · {GOAL - today}h to a full charge</p>
            </div>
          </Card>

          {/* 4. Gap ribbons */}
          <Card n={4} title="Gap ribbons" desc="Each day is an 8h ribbon: solid = logged, hatched red = gap. Makes unlogged time the visible thing to fix.">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {week.map(x => (
                <div key={x.d} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#999', width: 26 }}>{x.d}</span>
                  <div style={{ flex: 1, height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'repeating-linear-gradient(45deg,#fee2e2,#fee2e2 5px,#fef2f2 5px,#fef2f2 10px)' }}>
                    <div style={{ width: `${(x.h / GOAL) * 100}%`, background: GREEN }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#999', width: 26, textAlign: 'right' }}>{x.h}h</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 5. Goal bar with message */}
          <Card n={5} title="Goal bar + nudge" desc="A single progress bar to the 8h goal with an encouraging, changing message. Friendly and direct.">
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Today</span>
                <span style={{ fontSize: 13, color: '#999' }}>{today} / {GOAL}h</span>
              </div>
              <div style={{ position: 'relative', height: 14, background: '#eee', borderRadius: 99 }}>
                <div style={{ width: `${todayPct}%`, height: 14, background: BLUE, borderRadius: 99 }} />
                <div style={{ position: 'absolute', right: 0, top: -4, bottom: -4, width: 2, background: '#111' }} />
              </div>
              <p style={{ fontSize: 12, color: AMBER, marginTop: 10, fontWeight: 500 }}>🎯 Just {GOAL - today}h of gaps left — you’re almost at a full day!</p>
            </div>
          </Card>

          {/* 6. Calendar-header meters */}
          <Card n={6} title="Coverage in day headers" desc="A thin fill under each day's date in the calendar header — coverage lives right on the calendar, no separate widget.">
            <div style={{ display: 'flex', gap: 6 }}>
              {week.map(x => (
                <div key={x.d} style={{ width: 44, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#999', fontWeight: 600 }}>{x.d.toUpperCase()}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: '#111' }}>{14 + week.indexOf(x)}</div>
                  <div style={{ height: 4, background: '#eee', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(x.h / GOAL) * 100}%`, height: 4, background: barColor(x.h) }} />
                  </div>
                  <div style={{ fontSize: 8, color: '#bbb', marginTop: 2 }}>{Math.round((x.h / GOAL) * 100)}%</div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </>
  )
}
