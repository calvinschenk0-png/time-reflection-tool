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

  // Month-to-date coverage (current month, weekdays up to today)
  const today = todayStr()
  const monthStart = today.slice(0, 8) + '01'
  const expected = settings?.expected_workday_minutes ?? 480
  const { data: monthRows } = await supabase.from('time_entries')
    .select('duration_minutes').eq('user_id', user!.id)
    .gte('entry_date', monthStart).lte('entry_date', today)
  const monthLogged = (monthRows ?? []).reduce((sum, r) => sum + (r.duration_minutes || 0), 0)
  let monthWeekdays = 0
  for (let d = new Date(monthStart + 'T00:00:00'); d <= new Date(today + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
    const g = d.getDay()
    if (g !== 0 && g !== 6) monthWeekdays++
  }
  const monthExpected = monthWeekdays * expected
  const monthPct = monthExpected > 0 ? Math.min(100, Math.round((monthLogged / monthExpected) * 100)) : null

  return (
    <LogDay
      date={date}
      weekStart={weekStart}
      monthPct={monthPct}
      settings={settings}
      nodes={nodes ?? []}
      contacts={contacts ?? []}
      initialEntries={entries ?? []}
      initialEntryContacts={entryContacts}
    />
  )
}
