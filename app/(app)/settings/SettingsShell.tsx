'use client'

import { useState } from 'react'
import { PageShell } from '@/components/ui'
import GeneralTab from './GeneralTab'
import EngagementsTab from './EngagementsTab'
import ActivitiesTab from './ActivitiesTab'
import ContactsTab from './ContactsTab'

const TABS = ['General', 'Engagements', 'Activities', 'Contacts'] as const
type Tab = typeof TABS[number]

export default function SettingsShell({ initialSettings, initialEngagements, initialActivities, initialContacts }: {
  initialSettings: any
  initialEngagements: any[]
  initialActivities: any[]
  initialContacts: any[]
}) {
  const [tab, setTab] = useState<Tab>('General')

  return (
    <PageShell>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 20, letterSpacing: '-0.02em' }}>
        Settings
      </h1>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: '#f4f4f5', borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              background: tab === t ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: 9,
              padding: '7px 4px',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? '#111' : '#999',
              cursor: 'pointer',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'General'      && <GeneralTab     initialSettings={initialSettings} />}
      {tab === 'Engagements'  && <EngagementsTab initialEngagements={initialEngagements} />}
      {tab === 'Activities'   && <ActivitiesTab  initialActivities={initialActivities} />}
      {tab === 'Contacts'     && <ContactsTab    initialContacts={initialContacts} />}
    </PageShell>
  )
}
