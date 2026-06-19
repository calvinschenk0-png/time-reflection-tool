'use client'

import { PageShell } from '@/components/ui'
import Timeline from './Timeline'
import EntryEditor from './EntryEditor'
import { DateHeader, FinishBar, addBtn } from './LogParts'
import { LogDayState } from './useLogDay'

export default function LogDayDesktop({ s }: { s: LogDayState }) {
  return (
    <PageShell>
      <DateHeader s={s} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Left: timeline */}
        <div>
          <Timeline
            entries={s.entries}
            nodes={s.allNodes}
            selectedId={s.selectedId}
            onSelect={s.setSelectedId}
            onCommitTimes={s.commitTimes}
          />
          <button onClick={s.addEntry} style={addBtn}>+ Add entry</button>
        </div>

        {/* Right: editor or placeholder */}
        <div>
          {s.selected ? (
            <EntryEditor
              key={s.selected.id}
              entry={s.selected}
              nodes={s.allNodes}
              contacts={s.contacts}
              onUpdate={s.updateEntry}
              onDelete={s.deleteEntry}
              onToggleContact={s.toggleContact}
              onNodesChanged={s.setAllNodes}
            />
          ) : (
            <div style={{ background: '#f4f4f5', borderRadius: 20, padding: 24, color: '#999', fontSize: 13, textAlign: 'center' }}>
              Tap a block to edit it, or “+ Add entry” to start.
            </div>
          )}
        </div>
      </div>

      <FinishBar s={s} />
    </PageShell>
  )
}
