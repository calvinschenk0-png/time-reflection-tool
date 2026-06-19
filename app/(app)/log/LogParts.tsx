'use client'

import { formatDateLabel, shiftDate, formatDuration, timeToMinutes } from '@/lib/time'
import { LogDayState } from './useLogDay'

export function DateHeader({ s }: { s: LogDayState }) {
  const dayTotal = s.entriesForDay(s.date).reduce((sum, e) => sum + e.duration_minutes, 0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <button onClick={() => s.goToDate(shiftDate(s.date, -1))} style={navArrow}>‹</button>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#111' }}>
          {formatDateLabel(s.date)}
        </h1>
        <p style={{ fontSize: 12, color: '#999' }}>
          {formatDuration(dayTotal)} logged of {formatDuration(s.expectedMinutes)}
        </p>
      </div>
      <button onClick={() => s.goToDate(shiftDate(s.date, 1))} style={navArrow}>›</button>
    </div>
  )
}

export const addBtn: React.CSSProperties = {
  width: '100%', marginTop: 10, padding: '10px', borderRadius: 10,
  border: '1px dashed #c4c4c8', background: '#fff', color: '#2563eb',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

const navArrow: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 99, border: '1px solid #e4e4e7',
  background: '#fff', color: '#666', fontSize: 18, cursor: 'pointer',
}
