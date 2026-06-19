'use client'

import { useState, useEffect } from 'react'

// Returns 'mobile' | 'desktop', or null until measured on the client.
// Breakpoint: screens 767px and narrower are treated as mobile.
export function useViewport(): 'mobile' | 'desktop' | null {
  const [view, setView] = useState<'mobile' | 'desktop' | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setView(mq.matches ? 'mobile' : 'desktop')
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return view
}
