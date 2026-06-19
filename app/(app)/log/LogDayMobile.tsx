'use client'

import { PageShell } from '@/components/ui'
import Timeline from './Timeline'
import EntryEditor from './EntryEditor'
import { DateHeader, addBtn } from './LogParts'
import { LogDayState } from './useLogDay'

export default function LogDayMobile({ s }: { s: LogDayState }) {
  const dayEntries = s.entriesForDay(s.date)

  return (
    <PageShell>
      <DateHeader s={s} />

      <Timeline
        entries={dayEntries}
        nodes={s.allNodes}
        selectedId={s.selectedId}
        onSelect={s.setSelectedId}
        onCommitTimes={(id, startMin, endMin) => s.commitDrag(id, startMin, endMin, s.date)}
      />
      <button onClick={() => s.addEntry(s.date)} style={addBtn}>+ Add entry</button>

      {/* Slide-up sheet editor */}
      {s.selected && (
        <>
          <div onClick={() => s.setSelectedId(null)} style={sheetBackdrop} />
          <div style={sheet}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: '#ddd' }} />
            </div>
            <EntryEditor
              key={s.selected.id}
              entry={s.selected}
              nodes={s.allNodes}
              contacts={s.contacts}
              onUpdate={s.updateEntry}
              onDelete={(id) => { s.deleteEntry(id); s.setSelectedId(null) }}
              onToggleContact={s.toggleContact}
              onNodesChanged={s.setAllNodes}
              onContactsChanged={s.setAllContacts}
            />
          </div>
        </>
      )}
    </PageShell>
  )
}

const sheetBackdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40,
}
const sheet: React.CSSProperties = {
  position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
  background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
  maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
  padding: '0 16px 24px',
}
