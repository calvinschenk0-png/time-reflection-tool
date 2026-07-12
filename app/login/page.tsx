'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, Input, PrimaryButton } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Time Reflection
          </p>
          <p style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>
            A private log of where your workday actually goes — by project, workstream, and who you spent it with.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            {error && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{error}</p>}
            {message && <p style={{ color: '#16a34a', fontSize: 12, marginBottom: 12 }}>{message}</p>}

            <PrimaryButton type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
              {loading ? 'Loading…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </PrimaryButton>
          </form>
        </Card>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#999' }}>
          {mode === 'signin' ? (
            <>No account?{' '}
              <button onClick={() => setMode('signup')} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setMode('signin')} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
