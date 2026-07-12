'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BORDER = '#e4e4e7'
const MUTED = '#999999'

export default function RangeSelector({ range, rangeStart, rangeEnd }: {
  range: 'week' | 'month' | 'custom'
  rangeStart: string
  rangeEnd: string
}) {
  const router = useRouter()
  const [showCustom, setShowCustom] = useState(range === 'custom')
  const [start, setStart] = useState(rangeStart)
  const [end, setEnd] = useState(rangeEnd)

  function applyCustom() {
    if (start && end && start <= end) router.push(`/insights?range=custom&start=${start}&end=${end}`)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    textAlign: 'center',
    background: active ? '#fff' : 'transparent',
    color: active ? '#111' : MUTED,
    fontWeight: active ? 600 : 400,
    fontSize: 13,
    borderRadius: 9,
    padding: '7px 4px',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  })

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 4, background: '#f4f4f5', borderRadius: 12, padding: 4 }}>
        <Link href="/insights?range=week" style={tabStyle(range === 'week')} onClick={() => setShowCustom(false)}>This week</Link>
        <Link href="/insights?range=month" style={tabStyle(range === 'month')} onClick={() => setShowCustom(false)}>This month</Link>
        <button type="button" style={tabStyle(range === 'custom')} onClick={() => setShowCustom(true)}>Custom</button>
      </div>

      {showCustom && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <input
            type="date"
            value={start}
            onChange={e => setStart(e.target.value)}
            style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#111' }}
          />
          <span style={{ color: MUTED, fontSize: 13 }}>–</span>
          <input
            type="date"
            value={end}
            onChange={e => setEnd(e.target.value)}
            style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#111' }}
          />
          <button
            type="button"
            onClick={applyCustom}
            style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
