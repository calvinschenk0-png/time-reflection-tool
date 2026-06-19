import { createClient } from '@/lib/supabase/server'
import { todayStr, weekStartOf, shiftDate } from '@/lib/time'
import LogDay from './LogDay'

export default async function LogPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams
  const date = params.date ?? todayStr()
  const weekStart = weekStartOf(date)
  const weekEnd = shiftDate(weekStart, 6)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: settings },
    { data: nodes },
    { data: contacts },
    { data: entries },
  ] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user!.id).single(),
    supabase.from('hierarchy_nodes').select('*').eq('user_id', user!.id).eq('is_archived', false).order('created_at'),
    supabase.from('contacts').select('*').eq('user_id', user!.id).eq('is_archived', false).order('name'),
    supabase.from('time_entries').select('*').eq('user_id', user!.id)
      .gte('entry_date', weekStart).lte('entry_date', weekEnd).order('start_time'),
  ])

  const entryIds = (entries ?? []).map(e => e.id)
  let entryContacts: { entry_id: string; contact_id: string }[] = []
  if (entryIds.length) {
    const { data } = await supabase.from('entry_contacts').select('*').in('entry_id', entryIds)
    entryContacts = data ?? []
  }

  return (
    <LogDay
      date={date}
      weekStart={weekStart}
      settings={settings}
      nodes={nodes ?? []}
      contacts={contacts ?? []}
      initialEntries={entries ?? []}
      initialEntryContacts={entryContacts}
    />
  )
}
