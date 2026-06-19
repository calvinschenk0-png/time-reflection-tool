'use client'

import { shiftDate, weekStartOf, timeToMinutes, formatClock, todayStr } from '@/lib/time'
import { Node, Entry, Contact } from './types'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthCalendar({ anchorDate, entries, nodes, selectedId, onSelect }: {
  anchorDate: string
  entries: Entry[]
  nodes: Node[]
  contacts: Contact[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const monthKey = anchorDate.slice(0, 7)
  const gridStart = weekStartOf(`${monthKey}-01`)
  const days = Array.from({ length: 42 }, (_, i) => shiftDate(gridStart, i))
  const today = todayStr()

  function nodeFor(id: string | null) { return id ? nodes.find(n => n.id === id) ?? null : null }
  function entriesFor(d: string) {
    return entries.filter(e => e.entry_date === d).sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
  }
  const shortTime = (t: string) => formatClock(t).replace(':00', '')

  return (
    <div style={{ background: '#f4f4f5', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Weekday header */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e4e4e7', flexShrink: 0 }}>
        {DOW.map(x => (
          <div key={x} style={{ flex: 1, textAlign: 'center', padding: '6px 0', fontSize: 10, color: '#999', fontWeight: 600, letterSpacing: '0.04em' }}>
            {x.toUpperCase()}
          </div>
        ))}
      </div>

      {/* 6-week grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', minHeight: 0 }}>
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} style={{ display: 'flex', borderBottom: row < 5 ? '1px solid #e7e7e9' : 'none', minHeight: 0 }}>
            {days.slice(row * 7, row * 7 + 7).map(d => {
              const inMonth = d.slice(0, 7) === monthKey
              const isToday = d === today
              const list = entriesFor(d)
              const shown = list.slice(0, 4)
              const more = list.length - shown.length
              return (
                <div key={d} style={{ flex: 1, borderLeft: '1px solid #e7e7e9', padding: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: inMonth ? '#fff' : '#fafafa' }}>
                  <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, color: inMonth ? '#333' : '#bbb', marginBottom: 2 }}>
                    <span style={isToday ? { background: '#2563eb', color: '#fff', borderRadius: 99, padding: '1px 6px' } : undefined}>
                      {Number(d.slice(8, 10))}
                    </span>
                  </div>
                  <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                    {shown.map(e => {
                      const node = nodeFor(e.hierarchy_node_id)
                      const color = node?.color ?? '#d97706'
                      return (
                        <button
                          key={e.id}
                          onClick={() => onSelect(e.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4, width: '100%', textAlign: 'left',
                            border: 'none', background: e.id === selectedId ? '#eef2ff' : 'transparent',
                            borderRadius: 4, padding: '1px 3px', cursor: 'pointer', marginBottom: 1,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span style={{ color: '#888' }}>{shortTime(e.start_time)}</span> {node ? node.name : 'Draft'}
                          </span>
                        </button>
                      )
                    })}
                    {more > 0 && <div style={{ fontSize: 9, color: '#999', padding: '1px 3px' }}>+{more} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
