'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Home',     href: '/' },
  { label: 'Log',      href: '/log' },
  { label: 'Insights', href: '/insights' },
  { label: 'Settings', href: '/settings' },
]

export default function NavBar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{ borderBottom: '1px solid #e4e4e7', background: '#ffffff' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>
          TimeReflection
        </span>

        <nav style={{ display: 'flex', gap: 4 }}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#111' : '#999',
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: active ? '#f4f4f5' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleSignOut}
          style={{ fontSize: 13, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
