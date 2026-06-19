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
  const [dup, setDup] = useState<string | null>(null)

  const selected = contacts.filter(c => selectedIds.includes(c.id))
  const matches = contacts.filter(c =>
    !selectedIds.includes(c.id) && c.name.toLowerCase().includes(query.toLowerCase())
  )

  async function createContact() {
    const name = query.trim()
    if (!name) return
    const similar = contacts.find(c =>
      c.name.toLowerCase() === name.toLowerCase() ||
      c.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(c.name.toLowerCase())
    )
    if (similar && dup !== similar.name) { setDup(similar.name); return }

    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('contacts').insert({ user_id: user!.id, name }).select().single()
    if (data) {
      onContactsChanged([...contacts, data].sort((a, b) => a.name.localeCompare(b.name)))
      onToggle(data.id)
      setQuery(''); setOpen(false); setDup(null)
    }
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

      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setDup(null) }}
        onFocus={() => setOpen(true)}
        placeholder="Type a contact…"
        style={inputStyle}
      />

      {open && (
        <div style={listBox}>
          <div className="no-scrollbar" style={{ maxHeight: 160, overflowY: 'auto' }}>
            {matches.map(c => (
              <button key={c.id} onClick={() => { onToggle(c.id); setQuery('') }} style={optionRow}>
                <span style={{ width: 22, height: 22, borderRadius: 99, background: '#e9e9eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#555', marginRight: 8 }}>
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ fontSize: 13, color: '#111' }}>{c.name}</span>
              </button>
            ))}
            {matches.length === 0 && <div style={{ padding: '10px 12px', fontSize: 12, color: '#999' }}>No matches</div>}
          </div>
          {dup && <p style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', padding: '6px 12px', margin: 0 }}>Similar to “{dup}”. Click again to add anyway.</p>}
          <button onClick={createContact} disabled={!query.trim()} style={{ ...optionRow, color: query.trim() ? '#2563eb' : '#bbb', fontWeight: 600, borderTop: '1px solid #f0f0f0' }}>
            + New contact{query ? ` “${query}”` : ''}
          </button>
        </div>
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
const chip: React.CSSProperties = {
  padding: '5px 10px', borderRadius: 99, fontSize: 12, cursor: 'pointer', border: 'none',
  background: '#111', color: '#fff', fontWeight: 500,
}
