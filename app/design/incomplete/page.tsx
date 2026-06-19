'use client'

// Prototype: six ways to nudge the user toward incomplete entries.
// Dummy data only. Pick one and we'll build it into the real Log page.

const AMBER = '#d97706'
const GREEN = '#16a34a'
const BLUE = '#2563eb'

// A tiny calendar strip used inside several options
function MiniDay({ pulse = false, warn = false }: { pulse?: boolean; warn?: boolean }) {
  const blocks = [
    { top: 6, h: 34, color: GREEN, draft: false },
    { top: 44, h: 30, color: AMBER, draft: true },
    { top: 78, h: 40, color: GREEN, draft: false },
  ]
  return (
    <div style={{ position: 'relative', width: 110, height: 130, background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>
      {blocks.map((b, i) => (
        <div key={i}
          className={b.draft && pulse ? 'pulse' : undefined}
          style={{
            position: 'absolute', top: b.top, left: 6, right: 6, height: b.h,
            background: b.draft ? '#fef3c7' : b.color + '26',
            borderLeft: `3px solid ${b.color}`, borderRadius: 4,
          }}>
          {b.draft && warn && (
            <div style={{ position: 'absolute', top: -7, right: -7, width: 16, height: 16, borderRadius: 99, background: AMBER, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</div>
          )}
        </div>
      ))}
    </div>
  )
}

function Card({ n, title, desc, children }: { n: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#f4f4f5', borderRadius: 20, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ width: 22, height: 22, borderRadius: 99, background: '#111', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>{n}</span>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#111' }}>{title}</h2>
      </div>
      <p style={{ fontSize: 12, color: '#999', marginBottom: 16, lineHeight: 1.5 }}>{desc}</p>
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'center' }}>{children}</div>
    </div>
  )
}

export default function IncompletePrototype() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #fff; }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(217,119,6,0.5);} 50% { box-shadow: 0 0 0 5px rgba(217,119,6,0);} }
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes barfill { from { width: 0 } to { width: 71% } }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 6 }}>
          Incomplete-entry nudges — 6 options
        </h1>
        <p style={{ fontSize: 14, color: '#999', marginBottom: 32 }}>
          Same scenario in each: a week with <strong>2 entries missing a workstream</strong>. Pick the approach you like (you can mix).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

          {/* 1. Banner */}
          <Card n={1} title="Top banner" desc="A dismissible bar above the calendar with a count and a button that jumps to the next incomplete entry.">
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef3c7', border: `1px solid #fcd34d`, borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <span style={{ flex: 1, fontSize: 13, color: '#92400e' }}><strong>2 entries</strong> still need a workstream</span>
                <button style={{ background: AMBER, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Review</button>
              </div>
            </div>
          </Card>

          {/* 2. Header badge */}
          <Card n={2} title="Header badge" desc="A small count badge next to the week title — quiet, always visible, no extra space used.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#111' }}>Jun 14 – 20</span>
              <span style={{ background: AMBER, color: '#fff', borderRadius: 99, padding: '2px 9px', fontSize: 12, fontWeight: 600 }}>2 to finish</span>
            </div>
          </Card>

          {/* 3. Pulsing blocks */}
          <Card n={3} title="Pulsing blocks" desc="The incomplete blocks themselves gently pulse on the calendar, drawing the eye to exactly what's unfinished.">
            <MiniDay pulse />
          </Card>

          {/* 4. Checklist panel */}
          <Card n={4} title="Checklist panel" desc="A list of unfinished entries (in the attribute panel or below the calendar). Click one to jump straight to it.">
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#111', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>NEEDS A WORKSTREAM</p>
              {['Wed · 12:00–2:30 PM', 'Fri · 4:45–5:30 PM'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i === 0 ? '1px solid #eee' : 'none' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${AMBER}` }} />
                  <span style={{ fontSize: 13, color: '#111', flex: 1 }}>{t}</span>
                  <span style={{ fontSize: 16, color: '#999' }}>›</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 5. Completion ring/bar */}
          <Card n={5} title="Completion meter" desc="A ring or bar showing how complete the week is (e.g. 5 of 7 entries done). Rewards finishing.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <svg width={64} height={64}>
                <circle cx={32} cy={32} r={26} fill="none" stroke="#eee" strokeWidth={7} />
                <circle cx={32} cy={32} r={26} fill="none" stroke={BLUE} strokeWidth={7} strokeLinecap="round"
                  strokeDasharray={`${0.71 * 2 * Math.PI * 26} ${2 * Math.PI * 26}`} transform="rotate(-90 32 32)" />
                <text x={32} y={36} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="'Space Grotesk', sans-serif" fill="#111">71%</text>
              </svg>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>5 of 7 complete</p>
                <p style={{ fontSize: 12, color: AMBER }}>2 still need a workstream</p>
              </div>
            </div>
          </Card>

          {/* 6. Warning icon on blocks */}
          <Card n={6} title="Warning icon on blocks" desc="A small “!” badge sits on each incomplete block. Hovering shows what's missing. Precise, low-key.">
            <MiniDay warn />
          </Card>

        </div>
      </div>
    </>
  )
}
