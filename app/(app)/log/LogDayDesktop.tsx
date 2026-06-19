'use client'

import WeekCalendar from './WeekCalendar'
import EntryEditor from './EntryEditor'
import { PrimaryButton } from '@/components/ui'
import { weekRangeLabel, shiftDate, todayStr } from '@/lib/time'
import { LogDayState } from './useLogDay'

export default function LogDayDesktop({ s }: { s: LogDayState }) {
  return (
    <div style={{ height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box' }}>
      {/* Week header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16, flexShrink: 0 }}>
        <button onClick={() => s.goToWeek(shiftDate(s.weekStart, -7))} style={navArrow}>‹</button>
        <div style={{ textAlign: 'center', minWidth: 160 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#111' }}>
            {weekRangeLabel(s.weekStart)}
          </h1>
        </div>
        <button onClick={() => s.goToWeek(shiftDate(s.weekStart, 7))} style={navArrow}>›</button>
        <button onClick={() => s.goToDate(todayStr())} style={todayBtn}>Today</button>
      </div>

      {/* 80 / 20 split, filling the rest of the viewport height.
          minmax(0,…) keeps the ratio fixed regardless of panel content. */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 4fr) minmax(0, 1fr)', gap: 16 }}>
        {/* Calendar */}
        <WeekCalendar
          weekDates={s.weekDates}
          entries={s.entries}
          nodes={s.allNodes}
          selectedId={s.selectedId}
          onSelect={s.setSelectedId}
          onCommitDrag={s.commitDrag}
        />

        {/* Attribute panel — fills height, add button pinned at bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
                onContactsChanged={s.setAllContacts}
                fillHeight
              />
            ) : (
              <div style={{ background: '#f4f4f5', borderRadius: 20, padding: 24, color: '#999', fontSize: 13, textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
                Tap a block to edit its details.
              </div>
            )}
          </div>

          <PrimaryButton onClick={() => s.addEntry(s.defaultDay)} style={{ width: '100%', marginTop: 12, flexShrink: 0 }}>
            + Add entry
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

const navArrow: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 99, border: '1px solid #e4e4e7',
  background: '#fff', color: '#666', fontSize: 16, cursor: 'pointer',
}
const todayBtn: React.CSSProperties = {
  border: '1px solid #e4e4e7', borderRadius: 8, background: '#fff', color: '#111',
  fontSize: 12, fontWeight: 500, padding: '6px 12px', cursor: 'pointer', marginLeft: 8,
}
