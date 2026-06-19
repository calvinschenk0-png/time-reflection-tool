'use client'

import { PageShell } from '@/components/ui'
import Timeline from './Timeline'
import EntryEditor from './EntryEditor'
import { DateHeader, FinishBar, addBtn } from './LogParts'
import { LogDayState } from './useLogDay'

export default function LogDayMobile({ s }: { s: LogDayState }) {
  return (
    <PageShell>
      <DateHeader s={s} />

      <Timeline
        entries={s.entries}
        nodes={s.allNodes}
        selectedId={s.selectedId}
        onSelect={s.setSelectedId}
        onCommitTimes={s.commitTimes}
      />
      <button onClick={s.addEntry} style={addBtn}>+ Add entry</button>

      <FinishBar s={s} />

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
