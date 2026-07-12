'use client'

import { useEffect } from 'react'
import { Card, PrimaryButton } from '@/components/ui'

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '28px 24px 80px' }}>
      <Card style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 13, color: '#999', marginBottom: 18 }}>
          That didn&rsquo;t load properly. Try again — your data is safe.
        </p>
        <PrimaryButton onClick={() => unstable_retry()}>Try again</PrimaryButton>
      </Card>
    </div>
  )
}
