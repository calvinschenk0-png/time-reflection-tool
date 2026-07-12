import { createClient } from '@/lib/supabase/server'
import { todayStr, isWeekday, shiftDate, weekStartOf } from '@/lib/time'
import HomeDashboard from './HomeDashboard'
import { needsAttentionDates, weekStripDays, groupByWorkstream, weekBars } from './home-calc'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user!.id).single()
  const expectedMinutes = settings?.expected_workday_minutes ?? 480
  const chaseWindowDays = settings?.chase_window_days ?? 7

  const today = todayStr()
  const chaseStart = shiftDate(today, -(chaseWindowDays - 1))
  const stripStart = shiftDate(today, -6)
  const recentStart = chaseStart < stripStart ? chaseStart : stripStart

  const weekStart = weekStartOf(today)
  const weekEnd = shiftDate(weekStart, 6)

  const [{ data: nodes }, { data: recentEntries }, { data: weekEntries }] = await Promise.all([
    supabase.from('hierarchy_nodes').select('*').eq('user_id', user!.id).eq('is_archived', false),
    supabase.from('time_entries').select('entry_date, duration_minutes, hierarchy_node_id')
      .eq('user_id', user!.id).gte('entry_date', recentStart).lte('entry_date', today),
    supabase.from('time_entries').select('entry_date, duration_minutes, hierarchy_node_id')
      .eq('user_id', user!.id).gte('entry_date', weekStart).lte('entry_date', weekEnd),
  ])

  const entries = recentEntries ?? []
  const todayEntries = entries.filter(e => e.entry_date === today)
  const todayMinutes = todayEntries.reduce((sum, e) => sum + e.duration_minutes, 0)

  const attention = needsAttentionDates(entries, chaseWindowDays, today)
  const logDate = attention[0] ?? today

  return (
    <HomeDashboard
      today={today}
      isWeekendToday={!isWeekday(today)}
      todayMinutes={todayMinutes}
      expectedMinutes={expectedMinutes}
      attentionCount={attention.length}
      logDate={logDate}
      weekStart={weekStart}
      stripDays={weekStripDays(entries, today)}
      todayBreakdown={groupByWorkstream(todayEntries, nodes ?? [])}
      weekByWorkstream={groupByWorkstream(weekEntries ?? [], nodes ?? [])}
      bars={weekBars(weekEntries ?? [], weekStart)}
    />
  )
}
