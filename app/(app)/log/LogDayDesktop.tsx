'use client'

import WeekCalendar from './WeekCalendar'
import EntryEditor from './EntryEditor'
import { PrimaryButton } from '@/components/ui'
import { weekRangeLabel, shiftDate, todayStr } from '@/lib/time'
import { LogDayState } from './useLogDay'

export default function LogDayDesktop({ s }: { s: LogDayState }) {
  return (
    <div style={{ width: '100%', padding: '24px', boxSizing: 'border-box' }}>
      {/* Week header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
        <button onClick={() => s.goToWeek(shiftDate(s.weekStart, -7))} style={navArrow}>‹</button>
        <div style={{ textAlign: 'center', minWidth: 160 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#111' }}>
            {weekRangeLabel(s.weekStart)}
          </h1>
        </div>
        <button onClick={() => s.goToWeek(shiftDate(s.weekStart, 7))} style={navArrow}>›</button>
        <button onClick={() => s.goToDate(todayStr())} style={todayBtn}>Today</button>
      </div>

      {/* 80 / 20 split */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Calendar */}
        <WeekCalendar
          weekDates={s.weekDates}
          entries={s.entries}
          nodes={s.allNodes}
          selectedId={s.selectedId}
          onSelect={s.setSelectedId}
          onCommitDrag={s.commitDrag}
        />

        {/* Attribute panel */}
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
              Tap a block to edit its details.
            </div>
          )}

          <PrimaryButton onClick={() => s.addEntry(s.defaultDay)} style={{ width: '100%', marginTop: 12 }}>
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
