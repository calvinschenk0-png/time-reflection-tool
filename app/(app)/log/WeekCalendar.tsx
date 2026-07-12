'use client'

import { useRef, useEffect, useState } from 'react'
import { DAY_MINUTES, timeToMinutes, formatClock, shortDayLabel, todayStr } from '@/lib/time'
import { Node, Entry, Contact } from './types'
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

export default function WeekCalendar({ weekDates, entries, nodes, contacts, expectedMinutes, selectedId, onSelect, onCommitDrag, onCreateEntry, onDeleteEntry }: {
  weekDates: string[]
  entries: Entry[]
  nodes: Node[]
  contacts: Contact[]
  expectedMinutes: number
  selectedId: string | null
  onSelect: (id: string) => void
  onCommitDrag: (id: string, startMin: number, endMin: number, newDate: string) => void
  onCreateEntry: (date: string, startMin: number, endMin: number) => void
  onDeleteEntry: (id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const colsRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [preview, setPreview] = useState<{ id: string; start: number; end: number; date: string } | null>(null)
  const [create, setCreate] = useState<{ date: string; rectTop: number; startMin: number; curMin: number } | null>(null)
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null)

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

  // Drag-on-empty-space to create a new block
  useEffect(() => {
    if (!create) return
    const snap = (m: number) => Math.round(m / SNAP) * SNAP

    function onMove(e: PointerEvent) {
      const cur = Math.max(0, Math.min(DAY_MINUTES, snap((e.clientY - create!.rectTop) / PXPM)))
      setCreate(c => c ? { ...c, curMin: cur } : c)
    }
    function onUp() {
      let s = Math.min(create!.startMin, create!.curMin)
      let e = Math.max(create!.startMin, create!.curMin)
      // Don't overlap existing blocks on that day
      const others = entries
        .filter(x => x.entry_date === create!.date)
        .map(x => ({ s: timeToMinutes(x.start_time), e: timeToMinutes(x.end_time) }))
        .sort((a, b) => a.s - b.s)
      for (const o of others) { if (s >= o.s && s < o.e) s = o.e }
      const next = others.find(o => o.s >= s)
      if (next) e = Math.min(e, next.s)
      if (e - s >= MIN_DUR) onCreateEntry(create!.date, s, e)
      setCreate(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [create, entries, onCreateEntry])

  function beginCreate(e: React.PointerEvent, date: string) {
    const rect = e.currentTarget.getBoundingClientRect()
    const startMin = Math.max(0, Math.min(DAY_MINUTES, Math.round(((e.clientY - rect.top) / PXPM) / SNAP) * SNAP))
    setCreate({ date, rectTop: rect.top, startMin, curMin: startMin })
  }

  function effDate(e: Entry) { return preview?.id === e.id ? preview.date : e.entry_date }
  function effStart(e: Entry) { return preview?.id === e.id ? preview.start : timeToMinutes(e.start_time) }
  function effEnd(e: Entry) { return preview?.id === e.id ? preview.end : timeToMinutes(e.end_time) }

  function nodeFor(id: string | null) { return id ? nodes.find(n => n.id === id) ?? null : null }
  function areaFor(node: Node | null) {
    if (!node) return null
    return node.parent_id ? nodes.find(n => n.id === node.parent_id) ?? null : node
  }
  const contactById = new Map(contacts.map(c => [c.id, c.name]))
  function peopleFor(entry: Entry) {
    return entry.contactIds.map(id => contactById.get(id)).filter(Boolean).join(', ')
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
          const dayLogged = entries.filter(e => e.entry_date === d).reduce((s, e) => s + e.duration_minutes, 0)
          const pct = expectedMinutes > 0 ? Math.min(100, Math.round((dayLogged / expectedMinutes) * 100)) : 0
          const barColor = pct >= 95 ? '#16a34a' : pct >= 50 ? '#2563eb' : pct > 0 ? '#d97706' : '#e4e4e7'
          return (
            <div key={d} style={{ flex: 1, textAlign: 'center', padding: '8px 6px', borderLeft: '1px solid #e7e7e9' }}>
              <div style={{ fontSize: 10, color: isToday ? '#2563eb' : '#999', fontWeight: 600, letterSpacing: '0.04em' }}>{dow.toUpperCase()}</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700,
                color: isToday ? '#fff' : '#333',
                background: isToday ? '#2563eb' : 'transparent',
                width: 24, height: 24, lineHeight: '24px', borderRadius: 99, margin: '2px auto 2px',
              }}>{day}</div>
              {/* Coverage meter */}
              <div style={{ height: 4, background: '#e9e9eb', borderRadius: 99, overflow: 'hidden', margin: '0 4px' }}>
                <div style={{ width: `${pct}%`, height: 4, background: barColor }} />
              </div>
              <div style={{ fontSize: 8, color: '#bbb', marginTop: 1 }}>{pct}%</div>
            </div>
          )
        })}
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="no-scrollbar" style={{ flex: 1, overflowY: (drag || create) ? 'hidden' : 'auto', touchAction: (drag || create) ? 'none' : 'auto' }}>
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
              <div
                key={d}
                onPointerDown={e => { if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.bg) beginCreate(e, d) }}
                style={{ flex: 1, position: 'relative', borderLeft: '1px solid #e7e7e9', cursor: 'cell' }}
              >
                {/* hour lines (data-bg so a press on them also starts create) */}
                {Array.from({ length: 25 }).map((_, h) => (
                  <div key={h} data-bg="1" style={{ position: 'absolute', top: h * 60 * PXPM, left: 0, right: 0, borderTop: '1px solid #ededef' }} />
                ))}

                {/* create preview ghost */}
                {create?.date === d && (() => {
                  const s = Math.min(create.startMin, create.curMin)
                  const e = Math.max(create.startMin, create.curMin)
                  return (
                    <div style={{
                      position: 'absolute', top: s * PXPM, height: Math.max(2, (e - s) * PXPM), left: 2, right: 2,
                      background: '#2563eb22', border: '1px solid #2563eb', borderRadius: 5, pointerEvents: 'none', zIndex: 5,
                    }} />
                  )
                })()}

                {/* blocks for this day */}
                {entries.filter(e => effDate(e) === d).map(entry => {
                  const start = effStart(entry)
                  const end = effEnd(entry)
                  const height = Math.max(16, (end - start) * PXPM)
                  const node = nodeFor(entry.hierarchy_node_id)
                  const area = areaFor(node)
                  const complete = isComplete(entry)
                  const color = complete ? (node?.color ?? '#16a34a') : '#d97706'
                  const selected = entry.id === selectedId
                  const dragging = drag?.id === entry.id

                  return (
                    <div
                      key={entry.id}
                      onPointerDown={e => beginDrag(e, entry, 'move')}
                      onContextMenu={e => { e.preventDefault(); setMenu({ id: entry.id, x: e.clientX, y: e.clientY }) }}
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
                      {/* Category */}
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {node ? node.name : 'Draft'}
                      </div>
                      {/* Area */}
                      {area && (
                        <div style={{ fontSize: 9, color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {area.name}
                        </div>
                      )}
                      {/* Time */}
                      <div style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatClock(timeStr(start))}
                      </div>
                      {/* People */}
                      {peopleFor(entry) && (
                        <div style={{ fontSize: 9, color: '#666', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {peopleFor(entry)}
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

      {/* Right-click menu */}
      {menu && (
        <>
          <div onClick={() => setMenu(null)} onContextMenu={e => { e.preventDefault(); setMenu(null) }} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div style={{ position: 'fixed', top: menu.y, left: menu.x, zIndex: 61, background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', padding: 4, minWidth: 140 }}>
            <button
              onClick={() => { onDeleteEntry(menu.id); setMenu(null) }}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#dc2626', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Delete entry
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function timeStr(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
