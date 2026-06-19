'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Contact } from './types'

export default function ContactPicker({ contacts, selectedIds, onToggle, onContactsChanged }: {
  contacts: Contact[]
  selectedIds: string[]
  onToggle: (contactId: string) => void
  onContactsChanged: (contacts: Contact[]) => void
}) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [dup, setDup] = useState<string | null>(null)

  const selected = contacts.filter(c => selectedIds.includes(c.id))
  const matches = contacts.filter(c =>
    !selectedIds.includes(c.id) && c.name.toLowerCase().includes(query.toLowerCase())
  )

  function startCreate() {
    setCreating(true)
    setNewName(query)
    setDup(null)
  }

  async function saveNew() {
    const name = newName.trim()
    if (!name) return
    const similar = contacts.find(c =>
      c.name.toLowerCase() === name.toLowerCase() ||
      c.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(c.name.toLowerCase())
    )
    if (similar && dup !== similar.name) { setDup(similar.name); return }

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('contacts').insert({ user_id: user!.id, name }).select().single()
    if (error) { alert('Could not add contact: ' + error.message); return }
    if (data) {
      onContactsChanged([...contacts, data].sort((a, b) => a.name.localeCompare(b.name)))
      onToggle(data.id)
      reset()
    }
  }

  function reset() {
    setCreating(false); setNewName(''); setQuery(''); setOpen(false); setDup(null)
  }

  return (
    <div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {selected.map(c => (
            <button key={c.id} onClick={() => onToggle(c.id)} style={chip}>
              {c.name} <span style={{ color: '#fff', opacity: 0.7, marginLeft: 4 }}>×</span>
            </button>
          ))}
        </div>
      )}

      {creating ? (
        <div style={createBox}>
          <input
            autoFocus
            value={newName}
            onChange={e => { setNewName(e.target.value); setDup(null) }}
            placeholder="Contact name"
            style={inputStyle}
          />
          {dup && <p style={dupStyle}>Similar to “{dup}”. Click Save again to add anyway.</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={saveNew} disabled={!newName.trim()} style={saveBtn}>Save</button>
            <button onClick={reset} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Type a contact…"
            style={inputStyle}
          />
          {open && (
            <div style={listBox}>
              <div className="no-scrollbar" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {matches.map(c => (
                  <button key={c.id} onClick={() => { onToggle(c.id); setQuery('') }} style={optionRow}>
                    <span style={avatar}>{c.name.charAt(0).toUpperCase()}</span>
                    <span style={{ fontSize: 13, color: '#111' }}>{c.name}</span>
                  </button>
                ))}
                {matches.length === 0 && <div style={{ padding: '10px 12px', fontSize: 12, color: '#999' }}>No matches</div>}
              </div>
              <button onClick={startCreate} style={{ ...optionRow, color: '#2563eb', fontWeight: 600, borderTop: '1px solid #f0f0f0' }}>
                + New contact{query ? ` “${query}”` : ''}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, color: '#111', background: '#fff', outline: 'none', boxSizing: 'border-box',
}
const listBox: React.CSSProperties = { border: '1px solid #e4e4e7', borderRadius: 10, marginTop: 4, overflow: 'hidden' }
const optionRow: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', padding: '8px 12px',
  background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left',
}
const avatar: React.CSSProperties = {
  width: 22, height: 22, borderRadius: 99, background: '#e9e9eb', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#555', marginRight: 8,
}
const chip: React.CSSProperties = {
  padding: '5px 10px', borderRadius: 99, fontSize: 12, cursor: 'pointer', border: 'none',
  background: '#111', color: '#fff', fontWeight: 500,
}
const createBox: React.CSSProperties = { background: '#eef3ff', borderRadius: 10, padding: 12 }
const saveBtn: React.CSSProperties = { background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: '#fff', color: '#666', border: '1px solid #e4e4e7', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }
const dupStyle: React.CSSProperties = { fontSize: 11, color: '#92400e', background: '#fef3c7', borderRadius: 6, padding: '6px 8px', marginTop: 8 }
