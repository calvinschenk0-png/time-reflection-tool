// Shared collision rules so dragged/resized blocks never overlap.
// `others` are the other blocks on the same day, in minutes.
const DAY = 24 * 60

export function resolveDrag(
  others: { s: number; e: number }[],
  mode: 'move' | 'top' | 'bottom',
  start: number,
  end: number,
  origStart: number,
  origEnd: number,
): { start: number; end: number } | null {
  if (mode === 'top') {
    // Can't drag the top above the block directly above
    const above = others.filter(o => o.e <= origStart)
    const limit = above.length ? Math.max(...above.map(o => o.e)) : 0
    const ns = Math.max(start, limit)
    if (ns >= end) return null
    return { start: ns, end }
  }

  if (mode === 'bottom') {
    // Can't drag the bottom below the block directly below
    const below = others.filter(o => o.s >= origEnd)
    const limit = below.length ? Math.min(...below.map(o => o.s)) : DAY
    const ne = Math.min(end, limit)
    if (ne <= start) return null
    return { start, end: ne }
  }

  // move: try the proposed spot; if it overlaps, settle adjacent to that block
  const dur = end - start
  let s = start
  let e = end
  const overlaps = (o: { s: number; e: number }) => s < o.e && e > o.s

  const conflict = others.find(overlaps)
  if (conflict) {
    const center = (s + e) / 2
    const cCenter = (conflict.s + conflict.e) / 2
    if (center >= cCenter) { s = conflict.e; e = s + dur }   // settle just after
    else { e = conflict.s; s = e - dur }                     // settle just before
  }

  if (s < 0 || e > DAY) return null
  if (others.some(overlaps)) return null   // still colliding — reject, block snaps back
  return { start: s, end: e }
}
