import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Auto-create user_settings on first login if it doesn't exist yet
  const { data: settings } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!settings) {
    await supabase.from('user_settings').insert({ user_id: user.id })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar userEmail={user.email ?? ''} />
      <main className="flex-1 flex flex-col" style={{ width: '100%' }}>
        {children}
      </main>
    </div>
  )
}
