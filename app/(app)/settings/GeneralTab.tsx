'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, SectionHeading, PrimaryButton, Input } from '@/components/ui'

export default function GeneralTab({ initialSettings }: { initialSettings: any }) {
  const supabase = createClient()
  const [settings, setSettings] = useState(initialSettings ?? {
    expected_workday_minutes: 480,
    workday_start_hour: 8,
    workday_end_hour: 18,
    chase_window_days: 7,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('user_settings').upsert(settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function update(key: string, value: number) {
    setSettings((s: any) => ({ ...s, [key]: value }))
  }

  return (
    <div>
      <Card>
        <SectionHeading>Workday</SectionHeading>
        <Input
          label="Expected hours per day"
          type="number"
          value={settings.expected_workday_minutes / 60}
          onChange={v => update('expected_workday_minutes', Math.round(parseFloat(v) * 60))}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Start hour (e.g. 8 = 8am)"
              type="number"
              value={settings.workday_start_hour}
              onChange={v => update('workday_start_hour', parseInt(v))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="End hour (e.g. 18 = 6pm)"
              type="number"
              value={settings.workday_end_hour}
              onChange={v => update('workday_end_hour', parseInt(v))}
            />
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#999', marginTop: -4 }}>
          These set the visible range on the log day timeline.
        </p>
      </Card>

      <Card>
        <SectionHeading>Chase window</SectionHeading>
        <Input
          label="Days to look back for unlogged days"
          type="number"
          value={settings.chase_window_days}
          onChange={v => update('chase_window_days', parseInt(v))}
        />
        <p style={{ fontSize: 11, color: '#999', marginTop: -4 }}>
          Days older than this won't show in the homepage badge. Default is 7.
        </p>
      </Card>

      <PrimaryButton onClick={save} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save settings'}
      </PrimaryButton>
    </div>
  )
}
