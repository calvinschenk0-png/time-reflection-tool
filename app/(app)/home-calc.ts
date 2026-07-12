import { shiftDate, isWeekday } from '@/lib/time'

export type EntryRow = {
  entry_date: string
  duration_minutes: number
  hierarchy_node_id: string | null
}

export type NodeRow = {
  id: string
  name: string
  level: 'project' | 'workstream'
  parent_id: string | null
  color: string | null
}

export type DayStatus = 'empty' | 'draft' | 'complete'

const DRAFT_COLOR = '#d97706'

function byDate(entries: EntryRow[]): Map<string, EntryRow[]> {
  const map = new Map<string, EntryRow[]>()
  for (const e of entries) {
    if (!map.has(e.entry_date)) map.set(e.entry_date, [])
    map.get(e.entry_date)!.push(e)
  }
  return map
}

// A day is 'complete' once every one of its entries has a workstream.
// Zero entries is 'empty'; any draft entry (no workstream yet) makes it 'draft'.
export function dayStatus(entries: EntryRow[]): DayStatus {
  if (entries.length === 0) return 'empty'
  return entries.every(e => e.hierarchy_node_id) ? 'complete' : 'draft'
}

// Oldest-first weekday dates in the trailing `chaseWindowDays` (ending at `today`,
// inclusive) that aren't 'complete'. Weekends are never chased.
export function needsAttentionDates(entries: EntryRow[], chaseWindowDays: number, today: string): string[] {
  const grouped = byDate(entries)
  const dates: string[] = []
  for (let i = chaseWindowDays - 1; i >= 0; i--) {
    const d = shiftDate(today, -i)
    if (!isWeekday(d)) continue
    if (dayStatus(grouped.get(d) ?? []) !== 'complete') dates.push(d)
  }
  return dates
}

// Last 7 calendar days ending at `today` (inclusive), oldest first — for the week-strip pills.
export function weekStripDays(entries: EntryRow[], today: string): { date: string; status: DayStatus; isToday: boolean }[] {
  const grouped = byDate(entries)
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = shiftDate(today, -i)
    days.push({ date: d, status: dayStatus(grouped.get(d) ?? []), isToday: d === today })
  }
  return days
}

export type WorkstreamGroup = {
  id: string
  name: string
  projectName: string | null
  color: string
  minutes: number
}

// Sums entry minutes by workstream, resolving each workstream's parent project name.
// Entries with no workstream yet (drafts) bucket into a single amber "Unassigned draft" group.
export function groupByWorkstream(entries: EntryRow[], nodes: NodeRow[]): WorkstreamGroup[] {
  const nodeById = new Map(nodes.map(n => [n.id, n]))
  const totals = new Map<string, number>()
  for (const e of entries) {
    const key = e.hierarchy_node_id ?? '__draft__'
    totals.set(key, (totals.get(key) ?? 0) + e.duration_minutes)
  }

  const groups: WorkstreamGroup[] = []
  for (const [key, minutes] of totals) {
    if (key === '__draft__') {
      groups.push({ id: '__draft__', name: 'Unassigned draft', projectName: null, color: DRAFT_COLOR, minutes })
      continue
    }
    const node = nodeById.get(key)
    if (!node) continue
    const project = node.parent_id ? nodeById.get(node.parent_id) ?? null : null
    groups.push({ id: node.id, name: node.name, projectName: project?.name ?? null, color: node.color ?? '#999999', minutes })
  }
  return groups.sort((a, b) => b.minutes - a.minutes)
}

export type WeekBar = { date: string; label: string; minutes: number }

// Mon–Fri totals for the calendar week starting at `weekStart` (a Sunday).
export function weekBars(entries: EntryRow[], weekStart: string): WeekBar[] {
  const totals = new Map<string, number>()
  for (const e of entries) totals.set(e.entry_date, (totals.get(e.entry_date) ?? 0) + e.duration_minutes)
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const bars: WeekBar[] = []
  for (let i = 1; i <= 5; i++) {
    const date = shiftDate(weekStart, i)
    bars.push({ date, label: labels[i], minutes: totals.get(date) ?? 0 })
  }
  return bars
}
