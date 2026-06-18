'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, SectionHeading, PrimaryButton, DangerButton, Input } from '@/components/ui'

type Activity = { id: string; name: string; sort_order: number; is_archived: boolean }

export default function ActivitiesTab({ initialActivities }: { initialActivities: Activity[] }) {
  const supabase = createClient()
  const [activities, setActivities] = useState<Activity[]>(initialActivities.filter(a => !a.is_archived))
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [duplicate, setDuplicate] = useState<string | null>(null)

  async function add() {
    const trimmed = newName.trim()
    if (!trimmed) return

    // Fuzzy duplicate guard — simple: check if any existing name is very similar
    const similar = activities.find(a =>
      a.name.toLowerCase() === trimmed.toLowerCase() ||
      a.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(a.name.toLowerCase())
    )
    if (similar) {
      setDuplicate(similar.name)
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('activities').insert({
      user_id: user!.id,
      name: trimmed,
      sort_order: activities.length,
    }).select().single()
    if (data) setActivities(a => [...a, data])
    setNewName('')
    setDuplicate(null)
    setSaving(false)
  }

  async function archive(id: string) {
    await supabase.from('activities').update({ is_archived: true }).eq('id', id)
    setActivities(a => a.filter(act => act.id !== id))
  }

  return (
    <div>
      <Card>
        <SectionHeading>Add activity</SectionHeading>
        <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
          Activities are the verb — what you were doing (e.g. "Drafting", "Reviewing", "Meetings"). They apply across all engagements.
        </p>
        <Input
          label="Activity name"
          value={newName}
          onChange={v => { setNewName(v); setDuplicate(null) }}
          placeholder="e.g. Drafting"
        />
        {duplicate && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
            You already have <strong>"{duplicate}"</strong> — use that instead?
            <button onClick={() => setDuplicate(null)} style={{ marginLeft: 8, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
              Add anyway
            </button>
          </div>
        )}
        <PrimaryButton onClick={add} disabled={saving || !newName.trim()}>
          {saving ? 'Saving…' : '+ Add'}
        </PrimaryButton>
      </Card>

      {activities.length > 0 && (
        <Card>
          <SectionHeading>Your activities ({activities.length})</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activities.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < activities.length - 1 ? '1px solid #e4e4e7' : 'none' }}>
                <span style={{ fontSize: 13, color: '#111', flex: 1 }}>{a.name}</span>
                <DangerButton onClick={() => archive(a.id)}>Remove</DangerButton>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activities.length === 0 && (
        <Card>
          <p style={{ color: '#999', fontSize: 13 }}>No activities yet. Add your first one above.</p>
        </Card>
      )}
    </div>
  )
}
