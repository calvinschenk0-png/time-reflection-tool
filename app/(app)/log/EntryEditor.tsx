'use client'

import { useState } from 'react'
import { Card, DangerButton } from '@/components/ui'
import { timeToMinutes, formatDuration } from '@/lib/time'
import { Node, Contact, Entry } from './types'
import WorkstreamPicker from './WorkstreamPicker'

export default function EntryEditor({ entry, nodes, contacts, onUpdate, onDelete, onToggleContact, onNodesChanged, fillHeight }: {
  entry: Entry
  nodes: Node[]
  contacts: Contact[]
  onUpdate: (id: string, patch: Partial<Entry>) => void
  onDelete: (id: string) => void
  onToggleContact: (entryId: string, contactId: string) => void
  onNodesChanged: (nodes: Node[]) => void
  fillHeight?: boolean
}) {
  const [note, setNote] = useState(entry.note ?? '')

  const start = timeToMinutes(entry.start_time)
  const end = timeToMinutes(entry.end_time)
  const invalid = end <= start

  return (
    <Card style={fillHeight ? { minHeight: '100%', boxSizing: 'border-box', marginBottom: 0 } : undefined}>
      {/* Times */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Start</label>
          <TimeSelect value={entry.start_time} onChange={v => onUpdate(entry.id, { start_time: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>End</label>
          <TimeSelect value={entry.end_time} onChange={v => onUpdate(entry.id, { end_time: v })} />
        </div>
      </div>
      <p style={{ fontSize: 12, color: invalid ? '#dc2626' : '#999', marginTop: -8, marginBottom: 16 }}>
        {invalid ? 'End must be after start' : formatDuration(end - start)}
      </p>

      {/* Workstream */}
      <label style={labelStyle}>Workstream</label>
      <div style={{ marginBottom: 16 }}>
        <WorkstreamPicker
          nodes={nodes}
          selectedId={entry.hierarchy_node_id}
          onPick={(id) => onUpdate(entry.id, { hierarchy_node_id: id })}
          onNodesChanged={onNodesChanged}
        />
      </div>

      {/* Contacts */}
      {contacts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>People</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {contacts.map(c => {
              const active = entry.contactIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => onToggleContact(entry.id, c.id)}
                  style={{
                    padding: '5px 10px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                    border: 'none',
                    background: active ? '#111' : '#e9e9eb',
                    color: active ? '#fff' : '#555',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Note */}
      <label style={labelStyle}>Note</label>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        onBlur={() => onUpdate(entry.id, { note: note || null })}
        placeholder="Optional — what specifically?"
        rows={2}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: "'Inter', sans-serif" }}
      />

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <DangerButton onClick={() => onDelete(entry.id)}>Delete entry</DangerButton>
      </div>
    </Card>
  )
}

// Three dropdowns (hour / minute / AM-PM) restricted to 15-minute steps.
function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h24, m] = value.split(':').map(Number)
  const ampm = h24 < 12 ? 'AM' : 'PM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12

  function emit(nh12: number, nm: number, nap: string) {
    let h = nh12 % 12
    if (nap === 'PM') h += 12
    onChange(`${String(h).padStart(2, '0')}:${String(nm).padStart(2, '0')}:00`)
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <select value={h12} onChange={e => emit(Number(e.target.value), m, ampm)} style={selStyle}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <select value={m} onChange={e => emit(h12, Number(e.target.value), ampm)} style={selStyle}>
        {[0, 15, 30, 45].map(n => <option key={n} value={n}>{String(n).padStart(2, '0')}</option>)}
      </select>
      <select value={ampm} onChange={e => emit(h12, m, e.target.value)} style={selStyle}>
        <option>AM</option>
        <option>PM</option>
      </select>
    </div>
  )
}

const selStyle: React.CSSProperties = {
  flex: 1, border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 6px',
  fontSize: 13, color: '#111', background: '#fff', outline: 'none', cursor: 'pointer',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 500,
}
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, color: '#111', background: '#fff', outline: 'none',
}
