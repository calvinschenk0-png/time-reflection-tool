import { createClient } from '@/lib/supabase/server'
import { todayStr, weekStartOf, shiftDate, monthStartOf, monthEndOf, isValidDateStr } from '@/lib/time'
import LogDay from './LogDay'

export default async function LogPage({ searchParams }: { searchParams: Promise<{ date?: string; view?: string }> }) {
  const params = await searchParams
  const date = isValidDateStr(params.date) ? params.date : todayStr()
  const view: 'week' | 'month' = params.view === 'month' ? 'month' : 'week'
  const weekStart = weekStartOf(date)
  const mStart = monthStartOf(date)
  const mEnd = monthEndOf(date)

  // Fetch the visible range: a week, or the whole month
  const rangeStart = view === 'month' ? mStart : weekStart
  const rangeEnd = view === 'month' ? mEnd : shiftDate(weekStart, 6)

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
      .gte('entry_date', rangeStart).lte('entry_date', rangeEnd).order('start_time'),
  ])

  const entryIds = (entries ?? []).map(e => e.id)
  let entryContacts: { entry_id: string; contact_id: string }[] = []
  if (entryIds.length) {
    const { data } = await supabase.from('entry_contacts').select('*').in('entry_id', entryIds)
    entryContacts = data ?? []
  }

  // Coverage for the displayed month, weekdays up to today (future days excluded)
  const today = todayStr()
  const expected = settings?.expected_workday_minutes ?? 480
  let monthPct: number | null = null
  if (today >= mStart) {
    const cap = today < mEnd ? today : mEnd
    const { data: monthRows } = await supabase.from('time_entries')
      .select('duration_minutes').eq('user_id', user!.id)
      .gte('entry_date', mStart).lte('entry_date', cap)
    const monthLogged = (monthRows ?? []).reduce((sum, r) => sum + (r.duration_minutes || 0), 0)
    let monthWeekdays = 0
    for (let d = new Date(mStart + 'T00:00:00'); d <= new Date(cap + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
      const g = d.getDay()
      if (g !== 0 && g !== 6) monthWeekdays++
    }
    const monthExpected = monthWeekdays * expected
    monthPct = monthExpected > 0 ? Math.min(100, Math.round((monthLogged / monthExpected) * 100)) : null
  }

  return (
    <LogDay
      // Remount on navigation so entry state re-reads the freshly fetched data
      key={`${date}-${view}`}
      date={date}
      weekStart={weekStart}
      view={view}
      monthPct={monthPct}
      settings={settings}
      nodes={nodes ?? []}
      contacts={contacts ?? []}
      initialEntries={entries ?? []}
      initialEntryContacts={entryContacts}
    />
  )
}
