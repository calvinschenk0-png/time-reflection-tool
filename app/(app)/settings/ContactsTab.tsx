'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, SectionHeading, PrimaryButton, DangerButton, Input } from '@/components/ui'

type Contact = { id: string; name: string; is_archived: boolean }

export default function ContactsTab({ initialContacts }: { initialContacts: Contact[] }) {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts.filter(c => !c.is_archived))
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [duplicate, setDuplicate] = useState<string | null>(null)

  async function add() {
    const trimmed = newName.trim()
    if (!trimmed) return

    const similar = contacts.find(c =>
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(c.name.toLowerCase())
    )
    if (similar) {
      setDuplicate(similar.name)
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('contacts').insert({
      user_id: user!.id,
      name: trimmed,
    }).select().single()
    if (data) setContacts(c => [...c, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
    setDuplicate(null)
    setSaving(false)
  }

  async function archive(id: string) {
    await supabase.from('contacts').update({ is_archived: true }).eq('id', id)
    setContacts(c => c.filter(ct => ct.id !== id))
  }

  return (
    <div>
      <Card>
        <SectionHeading>Add contact</SectionHeading>
        <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
          Contacts are people you can tag on time entries — useful for tracking collaboration patterns.
        </p>
        <Input
          label="Name"
          value={newName}
          onChange={v => { setNewName(v); setDuplicate(null) }}
          placeholder="e.g. Sarah Johnson"
        />
        {duplicate && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
            You already have <strong>"{duplicate}"</strong> — is that the same person?
            <button onClick={() => setDuplicate(null)} style={{ marginLeft: 8, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
              Add anyway
            </button>
          </div>
        )}
        <PrimaryButton onClick={add} disabled={saving || !newName.trim()}>
          {saving ? 'Saving…' : '+ Add'}
        </PrimaryButton>
      </Card>

      {contacts.length > 0 && (
        <Card>
          <SectionHeading>Your contacts ({contacts.length})</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {contacts.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < contacts.length - 1 ? '1px solid #e4e4e7' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 99, background: '#e9e9eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#555', flexShrink: 0 }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, color: '#111', flex: 1 }}>{c.name}</span>
                <DangerButton onClick={() => archive(c.id)}>Remove</DangerButton>
              </div>
            ))}
          </div>
        </Card>
      )}

      {contacts.length === 0 && (
        <Card>
          <p style={{ color: '#999', fontSize: 13 }}>No contacts yet. Add people you work with above.</p>
        </Card>
      )}
    </div>
  )
}
