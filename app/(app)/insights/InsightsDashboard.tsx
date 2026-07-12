'use client'

import { useState } from 'react'
import { Card, SectionHeading, ColorDot } from '@/components/ui'
import { formatDuration } from '@/lib/time'
import RangeSelector from './RangeSelector'
import { ProjectGroup, ContactGroup, rangeLabel } from './insights-calc'

const ACCENT = '#2563eb'
const BORDER = '#e4e4e7'
const MUTED = '#999999'

export default function InsightsDashboard({
  range,
  rangeStart,
  rangeEnd,
  totalMinutes,
  expectedMinutes,
  projectGroups,
  contactGroups,
}: {
  range: 'week' | 'month' | 'custom'
  rangeStart: string
  rangeEnd: string
  totalMinutes: number
  expectedMinutes: number
  projectGroups: ProjectGroup[]
  contactGroups: ContactGroup[]
}) {
  const pct = expectedMinutes > 0 ? Math.min(100, Math.round((totalMinutes / expectedMinutes) * 100)) : null

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '28px 24px 80px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 20, letterSpacing: '-0.02em' }}>
        Insights
      </h1>

      <RangeSelector range={range} rangeStart={rangeStart} rangeEnd={rangeEnd} />

      {/* Headline */}
      <Card>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>{rangeLabel(rangeStart, rangeEnd)}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1, color: '#111', letterSpacing: '-0.03em' }}>
            {formatDuration(totalMinutes)}
          </span>
          <span style={{ fontSize: 13, color: MUTED, paddingBottom: 4 }}>logged</span>
        </div>
        <div style={{ height: 6, background: BORDER, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: 6, width: `${pct ?? 0}%`, background: ACCENT, borderRadius: 99 }} />
        </div>
        <p style={{ fontSize: 12, color: MUTED }}>
          {expectedMinutes > 0 ? `${pct}% of ${formatDuration(expectedMinutes)} expected to date` : 'No workdays in range yet'}
        </p>
      </Card>

      {/* Project -> Workstream */}
      <Card>
        <SectionHeading>Time by project</SectionHeading>
        {projectGroups.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED }}>No entries logged in this range.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {projectGroups.map(p => (
              <ProjectRow key={p.projectName} project={p} />
            ))}
          </div>
        )}
      </Card>

      {/* Time with contacts */}
      <Card>
        <SectionHeading>Time with contacts</SectionHeading>
        {contactGroups.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED }}>No entries with contacts logged in this range.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contactGroups.map(c => {
              const top = contactGroups[0].minutes
              const pct = top > 0 ? Math.round((c.minutes / top) * 100) : 0
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#111', flex: 1, fontWeight: 500 }}>{c.name}</span>
                  <div style={{ width: 100, height: 6, background: BORDER, borderRadius: 99 }}>
                    <div style={{ height: 6, width: `${pct}%`, background: ACCENT, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, color: MUTED, minWidth: 48, textAlign: 'right' }}>{formatDuration(c.minutes)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function ProjectRow({ project }: { project: ProjectGroup }) {
  const [open, setOpen] = useState(true)
  const hasWorkstreams = project.workstreams.length > 0

  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 8, marginTop: 4 }}>
      <button
        type="button"
        onClick={() => hasWorkstreams && setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '4px 0',
          cursor: hasWorkstreams ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        {hasWorkstreams && (
          <span style={{ color: MUTED, fontSize: 10, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s', width: 10 }}>
            ▶
          </span>
        )}
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#111', flex: 1 }}>{project.projectName}</span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#111' }}>{formatDuration(project.minutes)}</span>
      </button>

      {open && hasWorkstreams && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 0 8px 18px' }}>
          {project.workstreams.map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ColorDot color={w.color} />
              <span style={{ fontSize: 13, color: '#333', flex: 1 }}>{w.name}</span>
              <span style={{ fontSize: 12, color: MUTED }}>{formatDuration(w.minutes)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
