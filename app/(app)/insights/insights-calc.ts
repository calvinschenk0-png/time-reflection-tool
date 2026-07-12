import { isWeekday } from '@/lib/time'
import { EntryRow, NodeRow, CategoryGroup, groupByCategory } from '../home-calc'

export { groupByCategory }
export type { EntryRow, NodeRow, CategoryGroup }

export type AreaGroup = {
  areaName: string
  minutes: number
  categories: CategoryGroup[]
}

// Buckets category groups by their parent area. The synthetic "Unassigned draft"
// group (no area) becomes its own top-level, category-less entry.
export function groupByArea(categoryGroups: CategoryGroup[]): AreaGroup[] {
  const byArea = new Map<string, AreaGroup>()
  for (const g of categoryGroups) {
    const key = g.areaName ?? `__unassigned__${g.id}`
    const label = g.areaName ?? g.name
    if (!byArea.has(key)) byArea.set(key, { areaName: label, minutes: 0, categories: [] })
    const entry = byArea.get(key)!
    entry.minutes += g.minutes
    if (g.areaName) entry.categories.push(g)
  }
  return [...byArea.values()].sort((a, b) => b.minutes - a.minutes)
}

export type EntryWithId = EntryRow & { id: string }

export type ContactGroup = { id: string; name: string; minutes: number }

// Sums entry minutes per contact via the entry_contacts join. An entry with multiple
// contacts counts its full duration toward each contact (this is "time WITH X", not a split).
export function groupByContact(
  entries: EntryWithId[],
  entryContacts: { entry_id: string; contact_id: string }[],
  contacts: { id: string; name: string }[]
): ContactGroup[] {
  const minutesByEntry = new Map(entries.map(e => [e.id, e.duration_minutes]))
  const contactById = new Map(contacts.map(c => [c.id, c]))
  const totals = new Map<string, number>()
  for (const ec of entryContacts) {
    const minutes = minutesByEntry.get(ec.entry_id)
    if (minutes === undefined) continue
    totals.set(ec.contact_id, (totals.get(ec.contact_id) ?? 0) + minutes)
  }
  const groups: ContactGroup[] = []
  for (const [contactId, minutes] of totals) {
    const contact = contactById.get(contactId)
    if (!contact) continue
    groups.push({ id: contact.id, name: contact.name, minutes })
  }
  return groups.sort((a, b) => b.minutes - a.minutes)
}

// Expected minutes for a range: weekdays from rangeStart through min(rangeEnd, today),
// inclusive, times the per-day target. Matches the "to date" convention used elsewhere —
// future days never count toward the expected total.
export function expectedMinutesForRange(rangeStart: string, rangeEnd: string, today: string, perDayMinutes: number): number {
  const cap = rangeEnd < today ? rangeEnd : today
  if (rangeStart > cap) return 0
  let weekdays = 0
  for (let d = new Date(rangeStart + 'T00:00:00'); d <= new Date(cap + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10)
    if (isWeekday(iso)) weekdays++
  }
  return weekdays * perDayMinutes
}

// "Mon 9 – Fri 13" / "Jun 9 – 13" style label for a date range.
export function rangeLabel(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}`
}
