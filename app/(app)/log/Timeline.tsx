'use client'

import { useRef, useEffect, useState } from 'react'
import { PX_PER_MIN, DAY_MINUTES, timeToMinutes, formatClock } from '@/lib/time'
import { Node, Entry } from './types'

type DragState = {
  id: string
  mode: 'move' | 'top' | 'bottom'
  startY: number
  origStart: number
  origEnd: number
  moved: boolean
}

const SNAP = 15       // minutes
const MIN_DUR = 15    // minutes

export default function Timeline({ entries, nodes, selectedId, onSelect, onCommitTimes }: {
  entries: Entry[]
  nodes: Node[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCommitTimes: (id: string, startMin: number, endMin: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [preview, setPreview] = useState<{ id: string; start: number; end: number } | null>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * 60 * PX_PER_MIN
  }, [])

  // Window-level drag handling
  useEffect(() => {
    if (!drag) return

    function snap(m: number) { return Math.round(m / SNAP) * SNAP }

    function onMove(e: PointerEvent) {
      const dyMin = (e.clientY - drag!.startY) / PX_PER_MIN
      if (Math.abs(e.clientY - drag!.startY) > 3) drag!.moved = true

      let start = drag!.origStart
      let end = drag!.origEnd

      if (drag!.mode === 'move') {
        const dur = drag!.origEnd - drag!.origStart
        start = snap(drag!.origStart + dyMin)
        start = Math.max(0, Math.min(start, DAY_MINUTES - dur))
        end = start + dur
      } else if (drag!.mode === 'top') {
        start = snap(drag!.origStart + dyMin)
        start = Math.max(0, Math.min(start, drag!.origEnd - MIN_DUR))
      } else {
        end = snap(drag!.origEnd + dyMin)
        end = Math.min(DAY_MINUTES, Math.max(end, drag!.origStart + MIN_DUR))
      }

      setPreview({ id: drag!.id, start, end })
    }

    function onUp() {
      if (preview && drag!.moved) {
        onCommitTimes(drag!.id, preview.start, preview.end)
      } else if (!drag!.moved) {
        onSelect(drag!.id)
      }
      setDrag(null)
      setPreview(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, preview, onCommitTimes, onSelect])

  const sorted = [...entries].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

  // Gaps (use preview position for the dragged block)
  function effStart(e: Entry) { return preview?.id === e.id ? preview.start : timeToMinutes(e.start_time) }
  function effEnd(e: Entry) { return preview?.id === e.id ? preview.end : timeToMinutes(e.end_time) }

  const gapSorted = [...entries].sort((a, b) => effStart(a) - effStart(b))
  const gaps: { start: number; end: number }[] = []
  for (let i = 1; i < gapSorted.length; i++) {
    const prevEnd = effEnd(gapSorted[i - 1])
    const curStart = effStart(gapSorted[i])
    if (curStart > prevEnd) gaps.push({ start: prevEnd, end: curStart })
  }

  function nodeFor(id: string | null) { return id ? nodes.find(n => n.id === id) ?? null : null }
  function projectFor(node: Node | null) {
    if (!node) return null
    return node.parent_id ? nodes.find(n => n.id === node.parent_id) ?? null : node
  }

  function beginDrag(e: React.PointerEvent, entry: Entry, mode: DragState['mode']) {
    e.stopPropagation()
    setDrag({
      id: entry.id,
      mode,
      startY: e.clientY,
      origStart: timeToMinutes(entry.start_time),
      origEnd: timeToMinutes(entry.end_time),
      moved: false,
    })
  }

  return (
    <div
      ref={scrollRef}
      style={{
        position: 'relative', height: 520, overflowY: drag ? 'hidden' : 'auto',
        background: '#f4f4f5', borderRadius: 20, padding: '0 12px',
        touchAction: drag ? 'none' : 'auto',
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

        {/* Gap bands */}
        {gaps.map((g, i) => (
          <div key={`gap-${i}`} style={{
            position: 'absolute', top: g.start * PX_PER_MIN, height: (g.end - g.start) * PX_PER_MIN,
            left: 52, right: 8,
            background: 'repeating-linear-gradient(45deg, #fee2e2, #fee2e2 6px, #fef2f2 6px, #fef2f2 12px)',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 500 }}>gap</span>
          </div>
        ))}

        {/* Entry blocks */}
        {sorted.map(entry => {
          const start = effStart(entry)
          const end = effEnd(entry)
          const height = Math.max(18, (end - start) * PX_PER_MIN)
          const node = nodeFor(entry.hierarchy_node_id)
          const project = projectFor(node)
          const complete = !!node
          const color = node?.color ?? '#d97706'
          const selected = entry.id === selectedId
          const dragging = drag?.id === entry.id

          return (
            <div
              key={entry.id}
              onPointerDown={e => beginDrag(e, entry, 'move')}
              style={{
                position: 'absolute', top: start * PX_PER_MIN, height, left: 52, right: 8,
                background: complete ? color + '22' : '#fef3c7',
                borderLeft: `3px solid ${complete ? color : '#d97706'}`,
                borderRadius: 6, padding: '4px 8px',
                cursor: dragging ? 'grabbing' : 'grab',
                overflow: 'hidden', boxSizing: 'border-box',
                outline: selected ? '2px solid #111' : 'none', outlineOffset: 1,
                boxShadow: dragging ? '0 4px 14px rgba(0,0,0,0.18)' : 'none',
                userSelect: 'none', touchAction: 'none',
                zIndex: dragging ? 10 : 1,
              }}
            >
              {/* Top resize handle */}
              <div
                onPointerDown={e => beginDrag(e, entry, 'top')}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, cursor: 'ns-resize' }}
              />
              <div style={{ fontSize: 11, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {complete ? node!.name : 'Draft — pick a workstream'}
              </div>
              {height > 32 && (
                <div style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {project && complete ? `${project.name} · ` : ''}{formatClock(timeStr(start))}–{formatClock(timeStr(end))}
                </div>
              )}
              {/* Bottom resize handle */}
              <div
                onPointerDown={e => beginDrag(e, entry, 'bottom')}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, cursor: 'ns-resize' }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// minutes -> "HH:MM" for the formatClock helper
function timeStr(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
