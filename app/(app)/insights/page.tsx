import { createClient } from '@/lib/supabase/server'
import { todayStr, weekStartOf, monthStartOf, monthEndOf, shiftDate, isValidDateStr } from '@/lib/time'
import InsightsDashboard from './InsightsDashboard'
import { groupByCategory, groupByArea, groupByContact, expectedMinutesForRange } from './insights-calc'

type Range = 'week' | 'month' | 'custom'

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ range?: string; start?: string; end?: string }> }) {
  const params = await searchParams
  const today = todayStr()
  const range: Range = params.range === 'month' ? 'month' : params.range === 'custom' ? 'custom' : 'week'

  let rangeStart: string
  let rangeEnd: string
  if (range === 'month') {
    rangeStart = monthStartOf(today)
    rangeEnd = monthEndOf(today)
  } else if (range === 'custom' && isValidDateStr(params.start) && isValidDateStr(params.end) && params.start <= params.end) {
    rangeStart = params.start
    rangeEnd = params.end
  } else {
    rangeStart = weekStartOf(today)
    rangeEnd = shiftDate(rangeStart, 6)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: settings }, { data: nodes }, { data: contacts }, { data: entries }] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user!.id).single(),
    supabase.from('hierarchy_nodes').select('*').eq('user_id', user!.id).eq('is_archived', false),
    supabase.from('contacts').select('id, name').eq('user_id', user!.id).eq('is_archived', false),
    supabase.from('time_entries').select('id, entry_date, duration_minutes, hierarchy_node_id')
      .eq('user_id', user!.id).gte('entry_date', rangeStart).lte('entry_date', rangeEnd),
  ])

  const entryIds = (entries ?? []).map(e => e.id)
  let entryContacts: { entry_id: string; contact_id: string }[] = []
  if (entryIds.length) {
    const { data } = await supabase.from('entry_contacts').select('*').in('entry_id', entryIds)
    entryContacts = data ?? []
  }

  const expectedMinutes = settings?.expected_workday_minutes ?? 480
  const totalMinutes = (entries ?? []).reduce((sum, e) => sum + e.duration_minutes, 0)
  const categoryGroups = groupByCategory(entries ?? [], nodes ?? [])

  return (
    <InsightsDashboard
      range={range}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      totalMinutes={totalMinutes}
      expectedMinutes={expectedMinutesForRange(rangeStart, rangeEnd, today, expectedMinutes)}
      areaGroups={groupByArea(categoryGroups)}
      contactGroups={groupByContact(entries ?? [], entryContacts, contacts ?? [])}
    />
  )
}
