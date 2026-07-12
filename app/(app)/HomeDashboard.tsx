import Link from 'next/link'
import { Card, SectionHeading, Badge, ColorDot } from '@/components/ui'
import { formatDuration, shortDayLabel, weekRangeLabel } from '@/lib/time'
import { WorkstreamGroup, WeekBar, DayStatus } from './home-calc'

const ACCENT = '#2563eb'
const BORDER = '#e4e4e7'
const MUTED = '#999999'
const SUCCESS = '#16a34a'

type StripDay = { date: string; status: DayStatus; isToday: boolean }

export default function HomeDashboard({
  today,
  isWeekendToday,
  hasCategories,
  todayMinutes,
  expectedMinutes,
  attentionCount,
  logDate,
  weekStart,
  stripDays,
  todayBreakdown,
  weekByWorkstream,
  bars,
}: {
  today: string
  isWeekendToday: boolean
  hasCategories: boolean
  todayMinutes: number
  expectedMinutes: number
  attentionCount: number
  logDate: string
  weekStart: string
  stripDays: StripDay[]
  todayBreakdown: WorkstreamGroup[]
  weekByWorkstream: WorkstreamGroup[]
  bars: WeekBar[]
}) {
  const hours = todayMinutes / 60
  const hoursLabel = Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
  const pct = !isWeekendToday && expectedMinutes > 0 ? Math.min(100, Math.round((todayMinutes / expectedMinutes) * 100)) : 0

  const r = 56
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  const todayTotal = todayBreakdown.reduce((s, g) => s + g.minutes, 0)
  const weekTotal = weekByWorkstream.reduce((s, g) => s + g.minutes, 0)

  if (!hasCategories) {
    return (
      <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '28px 24px 80px' }}>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 16, fontWeight: 500 }}>
          {new Date(today + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <Card>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Welcome to Time Reflection
          </p>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 20 }}>
            Before you log your first day, set up at least one project and workstream — that&rsquo;s what colours your calendar and powers your breakdowns.
          </p>
          <Link
            href="/settings?tab=Categories"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#111',
              color: '#fff',
              borderRadius: 10,
              padding: '11px 18px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Space Grotesk', sans-serif",
              textDecoration: 'none',
            }}
          >
            Set up your first project
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '28px 24px 80px' }}>
      <style>{`.day-pill { transition: transform 0.1s; } .day-pill:hover { transform: scale(1.05); }`}</style>

      <p style={{ fontSize: 12, color: MUTED, marginBottom: 16, fontWeight: 500 }}>
        {new Date(today + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {/* Hero: hours + ring + log button */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 72, fontWeight: 700, lineHeight: 1, color: '#111', letterSpacing: '-0.04em' }}>
                {hoursLabel}
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, color: MUTED, paddingBottom: 8, letterSpacing: '-0.02em' }}>h</span>
            </div>
            <p style={{ fontSize: 14, color: MUTED }}>
              {isWeekendToday ? 'No workday expected today' : `of ${expectedMinutes / 60}h expected today`}
            </p>
          </div>

          <svg width={136} height={136}>
            <circle cx={68} cy={68} r={r} fill="none" stroke={BORDER} strokeWidth={10} />
            {!isWeekendToday && (
              <circle
                cx={68} cy={68} r={r}
                fill="none"
                stroke={ACCENT}
                strokeWidth={10}
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 68 68)"
              />
            )}
            <text x={68} y={64} textAnchor="middle" fill="#111" fontSize={20} fontFamily="'Space Grotesk', sans-serif" fontWeight={700}>
              {isWeekendToday ? '—' : `${pct}%`}
            </text>
            <text x={68} y={80} textAnchor="middle" fill={MUTED} fontSize={10} fontFamily="'Inter', sans-serif">logged</text>
          </svg>
        </div>

        <Link
          href={`/log?date=${logDate}`}
          style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#111',
            color: '#fff',
            borderRadius: 10,
            padding: '11px 18px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif",
            textDecoration: 'none',
          }}
        >
          Log your time
          {attentionCount > 0 && (
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
              {attentionCount}
            </span>
          )}
        </Link>
      </Card>

      {/* Week strip */}
      <Card style={{ padding: '14px 16px' }}>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '0.08em', textAlign: 'center', marginBottom: 12 }}>
          LAST 7 DAYS
        </p>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between' }}>
          {stripDays.map(d => {
            const { dow, day } = shortDayLabel(d.date)
            return (
              <Link
                key={d.date}
                href={`/log?date=${d.date}`}
                className="day-pill"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  background: d.isToday ? ACCENT : '#e9e9eb',
                  borderRadius: 12,
                  padding: '8px 4px',
                  border: d.isToday ? '2px solid #93c5fd' : '2px solid transparent',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', color: d.isToday ? '#bfdbfe' : MUTED }}>{dow}</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: d.isToday ? '#fff' : '#333' }}>{day}</span>

                {d.status === 'complete' ? (
                  <div style={{ width: 16, height: 16, borderRadius: 99, background: SUCCESS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={9} height={7} viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : d.isToday ? (
                  <div style={{ width: 16, height: 16, borderRadius: 99, border: '2px solid #93c5fd', background: 'transparent' }} />
                ) : (
                  <div style={{ width: 16, height: 16, borderRadius: 99, border: '2px solid #ccc', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 6, height: 2, background: '#ccc', borderRadius: 99 }} />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
        <p style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 10 }}>
          {attentionCount === 0 ? "you're all caught up · tap a day to log it" : `${attentionCount} day${attentionCount === 1 ? '' : 's'} need attention · tap a day to log it`}
        </p>
      </Card>

      {/* Today by workstream */}
      <Card>
        <SectionHeading>Today by workstream</SectionHeading>
        {todayBreakdown.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED }}>Nothing logged yet today — hit &ldquo;Log your time&rdquo; to get started.</p>
        ) : (
          <>
            <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 16, gap: 2 }}>
              {todayBreakdown.map(g => (
                <div key={g.id} style={{ flex: g.minutes, background: g.color, borderRadius: 99 }} />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayBreakdown.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ColorDot color={g.color} />
                  <span style={{ fontSize: 13, color: '#111', flex: 1, fontWeight: 500 }}>{g.name}</span>
                  {g.projectName && <span style={{ fontSize: 12, color: MUTED }}>{g.projectName}</span>}
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#111', minWidth: 48, textAlign: 'right' }}>
                    {formatDuration(g.minutes)}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#bbb', marginTop: 14 }}>{formatDuration(todayTotal)} logged today</p>
          </>
        )}
      </Card>

      {/* This week — bar chart */}
      <Link href={`/log?view=week&date=${weekStart}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <Card>
          <SectionHeading>This week · {weekRangeLabel(weekStart)}</SectionHeading>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 72 }}>
            {bars.map(b => {
              const dayHours = b.minutes / 60
              const target = expectedMinutes / 60
              const met = target > 0 && dayHours >= target
              const color = met ? '#111' : b.minutes > 0 ? '#d97706' : BORDER
              const height = target > 0 ? Math.min(1, dayHours / target) * 58 : 0
              return (
                <div key={b.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height, background: color, borderRadius: 6, minHeight: b.minutes === 0 ? 4 : undefined }} />
                  <span style={{ fontSize: 10, color: MUTED, fontWeight: 500 }}>{b.label}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </Link>

      {/* This week by workstream */}
      <Card>
        <SectionHeading>This week by workstream</SectionHeading>
        {weekByWorkstream.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED }}>No entries logged this week yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weekByWorkstream.map(g => {
              const pct = weekTotal > 0 ? Math.round((g.minutes / weekTotal) * 100) : 0
              return (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ColorDot color={g.color} />
                  <span style={{ fontSize: 13, color: '#111', flex: 1, fontWeight: 500 }}>{g.name}</span>
                  <div style={{ width: 100, height: 6, background: BORDER, borderRadius: 99 }}>
                    <div style={{ height: 6, width: `${pct}%`, background: g.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, color: MUTED, minWidth: 48, textAlign: 'right' }}>{formatDuration(g.minutes)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {attentionCount === 0 && (
        <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 4 }}>
          <Badge color={SUCCESS}>Caught up</Badge>
        </p>
      )}
    </div>
  )
}
