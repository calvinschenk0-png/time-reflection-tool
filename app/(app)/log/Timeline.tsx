'use client'

import { useRef, useEffect } from 'react'
import { PX_PER_MIN, DAY_MINUTES, timeToMinutes, formatClock } from '@/lib/time'
import { Node, Entry } from './types'

export default function Timeline({ entries, nodes, selectedId, onSelect }: {
  entries: Entry[]
  nodes: Node[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // On first load, scroll to ~7am so the workday is in view
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * 60 * PX_PER_MIN
  }, [])

  const sorted = [...entries].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

  // Compute gaps between consecutive blocks
  const gaps: { start: number; end: number }[] = []
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = timeToMinutes(sorted[i - 1].end_time)
    const curStart = timeToMinutes(sorted[i].start_time)
    if (curStart > prevEnd) gaps.push({ start: prevEnd, end: curStart })
  }

  function nodeFor(id: string | null) {
    return id ? nodes.find(n => n.id === id) ?? null : null
  }
  function projectFor(node: Node | null) {
    if (!node) return null
    return node.parent_id ? nodes.find(n => n.id === node.parent_id) ?? null : node
  }

  return (
    <div
      ref={scrollRef}
      style={{
        position: 'relative',
        height: 520,
        overflowY: 'auto',
        background: '#f4f4f5',
        borderRadius: 20,
        padding: '0 12px',
      }}
    >
      <div style={{ position: 'relative', height: DAY_MINUTES * PX_PER_MIN }}>
        {/* Hour gridlines */}
        {Array.from({ length: 25 }).map((_, h) => (
          <div key={h} style={{ position: 'absolute', top: h * 60 * PX_PER_MIN, left: 0, right: 0, height: 1 }}>
            <span style={{ position: 'absolute', left: 0, top: -7, fontSize: 10, color: '#bbb', width: 44 }}>
              {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : h === 24 ? '' : `${h - 12} PM`}
            </span>
            <div style={{ position: 'absolute', left: 48, right: 0, borderTop: '1px solid #e7e7e9' }} />
          </div>
        ))}

        {/* Gap bands (red, informational) */}
        {gaps.map((g, i) => (
          <div
            key={`gap-${i}`}
            style={{
              position: 'absolute',
              top: g.start * PX_PER_MIN,
              height: (g.end - g.start) * PX_PER_MIN,
              left: 52,
              right: 8,
              background: 'repeating-linear-gradient(45deg, #fee2e2, #fee2e2 6px, #fef2f2 6px, #fef2f2 12px)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 500 }}>gap</span>
          </div>
        ))}

        {/* Entry blocks */}
        {sorted.map(entry => {
          const start = timeToMinutes(entry.start_time)
          const end = timeToMinutes(entry.end_time)
          const height = Math.max(18, (end - start) * PX_PER_MIN)
          const node = nodeFor(entry.hierarchy_node_id)
          const project = projectFor(node)
          const complete = !!node
          const color = node?.color ?? '#d97706'   // workstream color, or amber for draft
          const selected = entry.id === selectedId

          return (
            <div
              key={entry.id}
              onClick={() => onSelect(entry.id)}
              style={{
                position: 'absolute',
                top: start * PX_PER_MIN,
                height,
                left: 52,
                right: 8,
                background: complete ? color + '22' : '#fef3c7',
                borderLeft: `3px solid ${complete ? color : '#d97706'}`,
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer',
                overflow: 'hidden',
                outline: selected ? '2px solid #111' : 'none',
                outlineOffset: 1,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {complete ? node!.name : 'Draft — pick a workstream'}
              </div>
              {height > 32 && (
                <div style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {project && complete ? `${project.name} · ` : ''}{formatClock(entry.start_time)}–{formatClock(entry.end_time)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
