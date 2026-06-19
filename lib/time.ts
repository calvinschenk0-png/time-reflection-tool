// Pixels per minute on the timeline (84px per hour).
export const PX_PER_MIN = 1.4
export const DAY_MINUTES = 24 * 60

// "09:30:00" or "09:30" -> minutes from midnight (570)
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// 570 -> "09:30"
export function minutesToTime(min: number): string {
  const clamped = Math.max(0, Math.min(DAY_MINUTES, min))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// "09:30:00" -> "9:30 AM"
export function formatClock(t: string): string {
  let [h, m] = t.split(':').map(Number)
  const ap = h < 12 ? 'AM' : 'PM'
  let hh = h % 12
  if (hh === 0) hh = 12
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`
}

// minutes -> "1h 30m" / "45m"
export function formatDuration(min: number): string {
  if (min <= 0) return '0m'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// "2026-06-18" formatted as "Thursday, 18 June"
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Shift a "YYYY-MM-DD" string by n days
export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// True for Mon–Fri (excludes weekends from workday coverage math)
export function isWeekday(dateStr: string): boolean {
  const g = new Date(dateStr + 'T00:00:00').getDay()
  return g !== 0 && g !== 6
}

// First day of the month containing dateStr, e.g. "2026-06-01"
export function monthStartOf(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`
}

// Last day of the month containing dateStr
export function monthEndOf(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

// First day of the month n months from dateStr's month
export function shiftMonth(dateStr: string, n: number): string {
  const [y, m] = dateStr.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// "June 2026"
export function monthLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// Sunday of the week containing dateStr, as "YYYY-MM-DD"
export function weekStartOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

// "2026-06-19" -> "Fri 19"
export function shortDayLabel(dateStr: string): { dow: string; day: number } {
  const d = new Date(dateStr + 'T00:00:00')
  return { dow: d.toLocaleDateString('en-GB', { weekday: 'short' }), day: d.getDate() }
}

// "Jun 15 – 21"
export function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(weekStart + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  const m = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' })
  if (m(start) === m(end)) return `${m(start)} ${start.getDate()} – ${end.getDate()}`
  return `${m(start)} ${start.getDate()} – ${m(end)} ${end.getDate()}`
}
