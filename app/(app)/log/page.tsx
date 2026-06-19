import { createClient } from '@/lib/supabase/server'
import { todayStr } from '@/lib/time'
import LogDay from './LogDay'

export default async function LogPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams
  const date = params.date ?? todayStr()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: settings },
    { data: nodes },
    { data: contacts },
    { data: entries },
    { data: loggedDay },
  ] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user!.id).single(),
    supabase.from('hierarchy_nodes').select('*').eq('user_id', user!.id).eq('is_archived', false).order('created_at'),
    supabase.from('contacts').select('*').eq('user_id', user!.id).eq('is_archived', false).order('name'),
    supabase.from('time_entries').select('*').eq('user_id', user!.id).eq('entry_date', date).order('start_time'),
    supabase.from('logged_days').select('*').eq('user_id', user!.id).eq('day_date', date).maybeSingle(),
  ])

  // Pull contact links for these entries
  const entryIds = (entries ?? []).map(e => e.id)
  let entryContacts: { entry_id: string; contact_id: string }[] = []
  if (entryIds.length) {
    const { data } = await supabase.from('entry_contacts').select('*').in('entry_id', entryIds)
    entryContacts = data ?? []
  }

  return (
    <LogDay
      date={date}
      settings={settings}
      nodes={nodes ?? []}
      contacts={contacts ?? []}
      initialEntries={entries ?? []}
      initialEntryContacts={entryContacts}
      loggedDay={loggedDay}
    />
  )
}
