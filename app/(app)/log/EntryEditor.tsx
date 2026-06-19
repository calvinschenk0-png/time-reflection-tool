'use client'

import { useState } from 'react'
import { Card, DangerButton } from '@/components/ui'
import { timeToMinutes, formatDuration } from '@/lib/time'
import { Node, Contact, Entry } from './types'
import WorkstreamPicker from './WorkstreamPicker'

export default function EntryEditor({ entry, nodes, contacts, onUpdate, onDelete, onToggleContact, onNodesChanged }: {
  entry: Entry
  nodes: Node[]
  contacts: Contact[]
  onUpdate: (id: string, patch: Partial<Entry>) => void
  onDelete: (id: string) => void
  onToggleContact: (entryId: string, contactId: string) => void
  onNodesChanged: (nodes: Node[]) => void
}) {
  const [note, setNote] = useState(entry.note ?? '')

  const start = timeToMinutes(entry.start_time)
  const end = timeToMinutes(entry.end_time)
  const invalid = end <= start

  return (
    <Card>
      {/* Times */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Start</label>
          <input
            type="time"
            value={entry.start_time.slice(0, 5)}
            onChange={e => onUpdate(entry.id, { start_time: e.target.value + ':00' })}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>End</label>
          <input
            type="time"
            value={entry.end_time.slice(0, 5)}
            onChange={e => onUpdate(entry.id, { end_time: e.target.value + ':00' })}
            style={inputStyle}
          />
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

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 500,
}
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, color: '#111', background: '#fff', outline: 'none',
}
