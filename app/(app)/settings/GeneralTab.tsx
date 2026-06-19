'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, SectionHeading, PrimaryButton, Input } from '@/components/ui'

export default function GeneralTab({ initialSettings }: { initialSettings: any }) {
  const supabase = createClient()
  const [chaseWindow, setChaseWindow] = useState<number>(initialSettings?.chase_window_days ?? 7)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('user_settings').upsert({ chase_window_days: chaseWindow })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <Card>
        <SectionHeading>Chase window</SectionHeading>
        <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
          How many days back the homepage will remind you to log. Days older than this window won't show in the badge. Default is 7.
        </p>
        <Input
          label="Days to look back for unlogged days"
          type="number"
          value={chaseWindow}
          onChange={v => setChaseWindow(parseInt(v))}
        />
        <PrimaryButton onClick={save} disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save settings'}
        </PrimaryButton>
      </Card>
    </div>
  )
}
