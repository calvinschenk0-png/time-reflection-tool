'use client'

import { PrimaryButton, SecondaryButton } from '@/components/ui'
import { formatDateLabel, shiftDate, formatDuration } from '@/lib/time'
import { LogDayState } from './useLogDay'

export function DateHeader({ s }: { s: LogDayState }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <button onClick={() => s.goToDate(shiftDate(s.date, -1))} style={navArrow}>‹</button>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#111' }}>
          {formatDateLabel(s.date)}
        </h1>
        <p style={{ fontSize: 12, color: '#999' }}>
          {formatDuration(s.totalLogged)} logged of {formatDuration(s.expectedMinutes)}
        </p>
      </div>
      <button onClick={() => s.goToDate(shiftDate(s.date, 1))} style={navArrow}>›</button>
    </div>
  )
}

export function FinishBar({ s }: { s: LogDayState }) {
  const { gaps, drafts } = s.gapsAndDrafts
  return (
    <div style={{ marginTop: 20 }}>
      {s.finished ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✓ Day finished</span>
          <SecondaryButton onClick={s.reopenDay}>Reopen</SecondaryButton>
        </div>
      ) : (
        <div>
          {(gaps > 0 || drafts > 0) && (
            <p style={{ fontSize: 12, color: '#d97706', marginBottom: 8, textAlign: 'center' }}>
              {[
                gaps > 0 ? `${gaps} gap${gaps > 1 ? 's' : ''}` : null,
                drafts > 0 ? `${drafts} draft${drafts > 1 ? 's' : ''}` : null,
              ].filter(Boolean).join(' · ')} — you can still finish.
            </p>
          )}
          <PrimaryButton onClick={s.finishDay} style={{ width: '100%' }}>
            Finish logging day
          </PrimaryButton>
        </div>
      )}
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
