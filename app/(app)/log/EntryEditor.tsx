'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, DangerButton } from '@/components/ui'
import { timeToMinutes, minutesToTime, formatClock, formatDuration } from '@/lib/time'
import { Node, Contact, Entry } from './types'
import CategoryPicker from './CategoryPicker'
import ContactPicker from './ContactPicker'
import FieldHeading from './FieldHeading'

export default function EntryEditor({ entry, nodes, contacts, onUpdate, onDelete, onToggleContact, onNodesChanged, onContactsChanged, fillHeight }: {
  entry: Entry
  nodes: Node[]
  contacts: Contact[]
  onUpdate: (id: string, patch: Partial<Entry>) => void
  onDelete: (id: string) => void
  onToggleContact: (entryId: string, contactId: string) => void
  onNodesChanged: (nodes: Node[]) => void
  onContactsChanged: (contacts: Contact[]) => void
  fillHeight?: boolean
}) {
  const [note, setNote] = useState(entry.note ?? '')

  const start = timeToMinutes(entry.start_time)
  const end = timeToMinutes(entry.end_time)
  const invalid = end <= start

  return (
    <Card style={fillHeight ? { minHeight: '100%', boxSizing: 'border-box', marginBottom: 0 } : undefined}>
      {/* Times */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Start</label>
          <TimeBox value={entry.start_time} onChange={v => onUpdate(entry.id, { start_time: v })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>End</label>
          <TimeBox value={entry.end_time} onChange={v => onUpdate(entry.id, { end_time: v })} />
        </div>
      </div>
      <p style={{ fontSize: 12, color: invalid ? '#dc2626' : '#999', marginBottom: 16 }}>
        {invalid ? 'End must be after start' : formatDuration(end - start)}
      </p>

      {/* Project + Workstream */}
      <div style={{ marginBottom: 16 }}>
        <CategoryPicker
          nodes={nodes}
          selectedWorkstreamId={entry.hierarchy_node_id}
          onPick={(id) => onUpdate(entry.id, { hierarchy_node_id: id })}
          onNodesChanged={onNodesChanged}
        />
      </div>

      {/* Contacts */}
      <div style={{ marginBottom: 16 }}>
        <FieldHeading label="People" settingsTab="Contacts" />
        <ContactPicker
          contacts={contacts}
          selectedIds={entry.contactIds}
          onToggle={(cid) => onToggleContact(entry.id, cid)}
          onContactsChanged={onContactsChanged}
        />
      </div>

      {/* Note */}
      <FieldHeading label="Note" />
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

// Single-box time picker: click to open a scrollable list of every 15-min time.
function TimeBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const current = value.slice(0, 5)

  const options = Array.from({ length: 96 }, (_, i) => {
    const v = minutesToTime(i * 15)
    return { value: v, label: formatClock(v) }
  })

  useEffect(() => {
    if (open && selectedRef.current) selectedRef.current.scrollIntoView({ block: 'center' })
  }, [open])

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={boxBtn}>{formatClock(value)}</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div ref={listRef} className="no-scrollbar" style={dropdown}>
            {options.map(o => {
              const sel = o.value === current
              return (
                <button
                  key={o.value}
                  ref={sel ? selectedRef : undefined}
                  onClick={() => { onChange(`${o.value}:00`); setOpen(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
                    fontSize: 13, border: 'none', cursor: 'pointer',
                    background: sel ? '#2563eb' : '#fff', color: sel ? '#fff' : '#111',
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 500 }
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, color: '#111', background: '#fff', outline: 'none', boxSizing: 'border-box',
}
const boxBtn: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, color: '#111', background: '#fff', cursor: 'pointer', textAlign: 'left',
}
const dropdown: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 31,
  background: '#fff', border: '1px solid #e4e4e7', borderRadius: 10,
  maxHeight: 220, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
}
