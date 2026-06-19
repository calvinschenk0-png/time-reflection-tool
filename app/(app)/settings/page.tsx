import { createClient } from '@/lib/supabase/server'
import SettingsShell from './SettingsShell'

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: settings },
    { data: nodes },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user!.id).single(),
    supabase.from('hierarchy_nodes').select('*').eq('user_id', user!.id).order('created_at'),
    supabase.from('contacts').select('*').eq('user_id', user!.id).order('name'),
  ])

  return (
    <SettingsShell
      initialTab={tab}
      initialSettings={settings}
      initialNodes={nodes ?? []}
      initialContacts={contacts ?? []}
    />
  )
}
