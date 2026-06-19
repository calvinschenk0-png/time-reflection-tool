'use client'

import { useViewport } from '@/lib/useViewport'

// Renders the desktop or mobile view based on screen width.
// Shows a neutral placeholder until the width is known (avoids flicker).
export default function ResponsiveView({ desktop, mobile }: {
  desktop: React.ReactNode
  mobile: React.ReactNode
}) {
  const view = useViewport()
  if (view === null) return <div style={{ minHeight: '60vh' }} />
  return <>{view === 'mobile' ? mobile : desktop}</>
}
