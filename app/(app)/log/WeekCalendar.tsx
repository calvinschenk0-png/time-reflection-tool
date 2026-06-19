'use client'

import { useRef, useEffect, useState } from 'react'
import { DAY_MINUTES, timeToMinutes, formatClock, shortDayLabel, todayStr } from '@/lib/time'
import { Node, Entry } from './types'
import { isComplete } from './status'
import { resolveDrag } from './overlap'

const PXPM = 1.0       // pixels per minute (week view)
const SNAP = 15
const MIN_DUR = 15
const GUTTER = 48

type DragState = {
  id: string
  mode: 'move' | 'top' | 'bottom'
  startX: number
  startY: number
  origStart: number
  origEnd: number
  origDate: string
  moved: boolean
}

export default function WeekCalendar({ weekDates, entries, nodes, selectedId, onSelect, onCommitDrag }: {
  weekDates: string[]
  entries: Entry[]
  nodes: Node[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCommitDrag: (id: string, startMin: number, endMin: number, newDate: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const colsRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [preview, setPreview] = useState<{ id: string; start: number; end: number; date: string } | null>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * 60 * PXPM
  }, [])

  useEffect(() => {
    if (!drag) return
    const snap = (m: number) => Math.round(m / SNAP) * SNAP

    function onMove(e: PointerEvent) {
      if (Math.abs(e.clientY - drag!.startY) > 3 || Math.abs(e.clientX - drag!.startX) > 3) drag!.moved = true
      const dyMin = (e.clientY - drag!.startY) / PXPM

      let start = drag!.origStart
      let end = drag!.origEnd
      let date = drag!.origDate

      if (drag!.mode === 'move') {
        const dur = drag!.origEnd - drag!.origStart
        start = snap(drag!.origStart + dyMin)
        start = Math.max(0, Math.min(start, DAY_MINUTES - dur))
        end = start + dur
        // Which day column is the pointer over?
        if (colsRef.current) {
          const r = colsRef.current.getBoundingClientRect()
          const colW = r.width / 7
          const idx = Math.max(0, Math.min(6, Math.floor((e.clientX - r.left) / colW)))
          date = weekDates[idx]
        }
      } else if (drag!.mode === 'top') {
        start = snap(drag!.origStart + dyMin)
        start = Math.max(0, Math.min(start, drag!.origEnd - MIN_DUR))
      } else {
        end = snap(drag!.origEnd + dyMin)
        end = Math.min(DAY_MINUTES, Math.max(end, drag!.origStart + MIN_DUR))
      }
      setPreview({ id: drag!.id, start, end, date })
    }

    function onUp() {
      if (preview && drag!.moved) {
        const others = entries
          .filter(e => e.id !== drag!.id && e.entry_date === preview.date)
          .map(e => ({ s: timeToMinutes(e.start_time), e: timeToMinutes(e.end_time) }))
        const adj = resolveDrag(others, drag!.mode, preview.start, preview.end, drag!.origStart, drag!.origEnd)
        if (adj) onCommitDrag(drag!.id, adj.start, adj.end, preview.date)
        // if null: overlap unresolved — block snaps back (no commit)
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
  }, [drag, preview, onCommitDrag, onSelect, weekDates, entries])

  function effDate(e: Entry) { return preview?.id === e.id ? preview.date : e.entry_date }
  function effStart(e: Entry) { return preview?.id === e.id ? preview.start : timeToMinutes(e.start_time) }
  function effEnd(e: Entry) { return preview?.id === e.id ? preview.end : timeToMinutes(e.end_time) }

  function nodeFor(id: string | null) { return id ? nodes.find(n => n.id === id) ?? null : null }
  function projectFor(node: Node | null) {
    if (!node) return null
    return node.parent_id ? nodes.find(n => n.id === node.parent_id) ?? null : node
  }

  function beginDrag(e: React.PointerEvent, entry: Entry, mode: DragState['mode']) {
    e.stopPropagation()
    setDrag({
      id: entry.id, mode, startX: e.clientX, startY: e.clientY,
      origStart: timeToMinutes(entry.start_time), origEnd: timeToMinutes(entry.end_time),
      origDate: entry.entry_date, moved: false,
    })
  }

  return (
    <div style={{ background: '#f4f4f5', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Day headers */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e4e4e7', flexShrink: 0 }}>
        <div style={{ width: GUTTER, flexShrink: 0 }} />
        {weekDates.map(d => {
          const { dow, day } = shortDayLabel(d)
          const isToday = d === todayStr()
          return (
            <div key={d} style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderLeft: '1px solid #e7e7e9' }}>
              <div style={{ fontSize: 10, color: isToday ? '#2563eb' : '#999', fontWeight: 600, letterSpacing: '0.04em' }}>{dow.toUpperCase()}</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700,
                color: isToday ? '#fff' : '#333',
                background: isToday ? '#2563eb' : 'transparent',
                width: 24, height: 24, lineHeight: '24px', borderRadius: 99, margin: '2px auto 0',
              }}>{day}</div>
            </div>
          )
        })}
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="no-scrollbar" style={{ flex: 1, overflowY: drag ? 'hidden' : 'auto', touchAction: drag ? 'none' : 'auto' }}>
        <div style={{ display: 'flex', position: 'relative', height: DAY_MINUTES * PXPM }}>
          {/* Time gutter */}
          <div style={{ width: GUTTER, flexShrink: 0, position: 'relative' }}>
            {Array.from({ length: 25 }).map((_, h) => (
              <span key={h} style={{ position: 'absolute', top: h * 60 * PXPM - 6, right: 4, fontSize: 9, color: '#bbb' }}>
                {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : h === 24 ? '' : `${h - 12}p`}
              </span>
            ))}
          </div>

          {/* Day columns */}
          <div ref={colsRef} style={{ flex: 1, display: 'flex' }}>
            {weekDates.map(d => (
              <div key={d} style={{ flex: 1, position: 'relative', borderLeft: '1px solid #e7e7e9' }}>
                {/* hour lines */}
                {Array.from({ length: 25 }).map((_, h) => (
                  <div key={h} style={{ position: 'absolute', top: h * 60 * PXPM, left: 0, right: 0, borderTop: '1px solid #ededef' }} />
                ))}

                {/* blocks for this day */}
                {entries.filter(e => effDate(e) === d).map(entry => {
                  const start = effStart(entry)
                  const end = effEnd(entry)
                  const height = Math.max(16, (end - start) * PXPM)
                  const node = nodeFor(entry.hierarchy_node_id)
                  const complete = isComplete(entry)
                  const color = complete ? (node?.color ?? '#16a34a') : '#d97706'
                  const selected = entry.id === selectedId
                  const dragging = drag?.id === entry.id

                  return (
                    <div
                      key={entry.id}
                      onPointerDown={e => beginDrag(e, entry, 'move')}
                      style={{
                        position: 'absolute', top: start * PXPM, height, left: 2, right: 2,
                        background: complete ? color + '26' : '#fef3c7',
                        borderLeft: `3px solid ${color}`,
                        borderRadius: 5, padding: '2px 5px', overflow: 'hidden', boxSizing: 'border-box',
                        cursor: dragging ? 'grabbing' : 'grab',
                        outline: selected ? '2px solid #111' : 'none', outlineOffset: 1,
                        boxShadow: dragging ? '0 4px 14px rgba(0,0,0,0.18)' : 'none',
                        userSelect: 'none', touchAction: 'none', zIndex: dragging ? 10 : 1,
                      }}
                    >
                      <div onPointerDown={e => beginDrag(e, entry, 'top')} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }} />
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {node ? node.name : 'Draft'}
                      </div>
                      {height > 26 && (
                        <div style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatClock(timeStr(start))}
                        </div>
                      )}
                      <div onPointerDown={e => beginDrag(e, entry, 'bottom')} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }} />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function timeStr(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
