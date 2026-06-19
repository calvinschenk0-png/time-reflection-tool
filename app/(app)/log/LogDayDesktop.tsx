'use client'

import WeekCalendar from './WeekCalendar'
import MonthCalendar from './MonthCalendar'
import EntryEditor from './EntryEditor'
import { PrimaryButton } from '@/components/ui'
import { weekRangeLabel, monthLabel, monthStartOf, todayStr, isWeekday } from '@/lib/time'
import { LogDayState } from './useLogDay'

export default function LogDayDesktop({ s }: { s: LogDayState }) {
  const isMonth = s.view === 'month'

  // Week-to-date coverage (week view only)
  const today = todayStr()
  const expectedToDate = s.weekDates.filter(d => d <= today && isWeekday(d)).length * s.expectedMinutes
  const loggedToDate = s.entries.filter(e => e.entry_date <= today).reduce((sum, e) => sum + e.duration_minutes, 0)
  const weekPct = expectedToDate > 0 ? Math.min(100, Math.round((loggedToDate / expectedToDate) * 100)) : null

  // Where "+ Add entry" drops a block
  const addTarget = isMonth
    ? (today.slice(0, 7) === s.date.slice(0, 7) ? today : monthStartOf(s.date))
    : s.defaultDay

  return (
    <div style={{ height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box' }}>
      {/* Header: view toggle (left) · period nav (center) · today (right) */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        {/* Left: Week / Month toggle */}
        <div style={{ display: 'flex', gap: 2, background: '#f4f4f5', borderRadius: 10, padding: 3, width: 160 }}>
          {(['week', 'month'] as const).map(v => (
            <button
              key={v}
              onClick={() => s.setView(v)}
              style={{
                flex: 1, border: 'none', borderRadius: 8, padding: '6px 0', fontSize: 13, cursor: 'pointer',
                background: s.view === v ? '#fff' : 'transparent',
                color: s.view === v ? '#111' : '#999', fontWeight: s.view === v ? 600 : 400,
                boxShadow: s.view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Center: period nav */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <button onClick={s.prevPeriod} style={navArrow}>‹</button>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#111', minWidth: 160, textAlign: 'center' }}>
            {isMonth ? monthLabel(s.date) : weekRangeLabel(s.weekStart)}
          </h1>
          <button onClick={s.nextPeriod} style={navArrow}>›</button>
        </div>

        {/* Right: Today */}
        <div style={{ width: 160, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={s.goToday} style={todayBtn}>Today</button>
        </div>
      </div>

      {/* Coverage to date */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16, flexShrink: 0 }}>
        {!isMonth && <CoverageStat label="This week logged" pct={weekPct} />}
        <CoverageStat label={isMonth ? `${monthLabel(s.date)} logged` : 'This month logged'} pct={s.monthPct} />
      </div>

      {/* Calendar + attribute panel */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 4fr) minmax(0, 1fr)', gap: 16 }}>
        {isMonth ? (
          <MonthCalendar
            anchorDate={s.date}
            entries={s.entries}
            nodes={s.allNodes}
            contacts={s.contacts}
            selectedId={s.selectedId}
            onSelect={s.setSelectedId}
          />
        ) : (
          <WeekCalendar
            weekDates={s.weekDates}
            entries={s.entries}
            nodes={s.allNodes}
            contacts={s.contacts}
            expectedMinutes={s.expectedMinutes}
            selectedId={s.selectedId}
            onSelect={s.setSelectedId}
            onCommitDrag={s.commitDrag}
            onCreateEntry={s.createEntry}
            onDeleteEntry={s.deleteEntry}
          />
        )}

        {/* Attribute panel */}
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

          <PrimaryButton onClick={() => s.addEntry(addTarget)} style={{ width: '100%', marginTop: 12, flexShrink: 0 }}>
            + Add entry
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

function CoverageStat({ label, pct }: { label: string; pct: number | null }) {
  const color = pct === null ? '#999' : pct >= 95 ? '#16a34a' : pct >= 50 ? '#2563eb' : '#d97706'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f4f4f5', borderRadius: 12, padding: '8px 16px', minWidth: 220 }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color }}>
        {pct === null ? '—' : `${pct}%`}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#666', fontWeight: 500, marginBottom: 4 }}>{label}</div>
        <div style={{ height: 5, background: '#e9e9eb', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct ?? 0}%`, height: 5, background: color }} />
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
  fontSize: 12, fontWeight: 500, padding: '6px 12px', cursor: 'pointer',
}
