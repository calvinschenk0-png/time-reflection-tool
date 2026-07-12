import type { SupabaseClient } from '@supabase/supabase-js'

export type DefaultCategory = { name: string; color: string }
export type DefaultArea = { name: string; categories: DefaultCategory[] }

export const DEFAULT_AREAS: DefaultArea[] = [
  {
    name: 'Work',
    categories: [
      { name: 'Meetings', color: '#2563eb' },
      { name: 'Deep Work', color: '#7c3aed' },
      { name: 'Admin & Email', color: '#d97706' },
    ],
  },
  {
    name: 'Health & Fitness',
    categories: [
      { name: 'Exercise', color: '#16a34a' },
      { name: 'Medical', color: '#dc2626' },
      { name: 'Sleep', color: '#0891b2' },
    ],
  },
  {
    name: 'Relationships & Family',
    categories: [
      { name: 'Family', color: '#be185d' },
      { name: 'Friends', color: '#059669' },
      { name: 'Partner', color: '#7c3aed' },
    ],
  },
  {
    name: 'Personal Growth',
    categories: [
      { name: 'Learning', color: '#2563eb' },
      { name: 'Reading', color: '#059669' },
      { name: 'Hobbies & Creative', color: '#be185d' },
    ],
  },
  {
    name: 'Home & Life Admin',
    categories: [
      { name: 'Chores & Errands', color: '#0891b2' },
      { name: 'Finances & Bills', color: '#16a34a' },
      { name: 'Paperwork & Planning', color: '#d97706' },
    ],
  },
  {
    name: 'Rest & Leisure',
    categories: [
      { name: 'Downtime & Relaxing', color: '#7c3aed' },
      { name: 'Entertainment', color: '#2563eb' },
      { name: 'Social Media & Browsing', color: '#dc2626' },
    ],
  },
]

type NodeRow = { id: string; name: string; level: 'area' | 'category'; parent_id: string | null }

// Seeds the default Areas/Categories for a user, skipping any Area or Category
// whose name already exists (case-insensitive, active or archived) so it's
// safe to call both on first login and from a "Restore defaults" action.
export async function seedDefaultCategories(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('hierarchy_nodes')
    .select('id, name, level, parent_id')
    .eq('user_id', userId)

  if (error) return

  const existingNodes: NodeRow[] = data ?? []
  const areaByName = new Map(
    existingNodes.filter(n => n.level === 'area').map(n => [n.name.toLowerCase(), n])
  )

  for (const area of DEFAULT_AREAS) {
    let areaRow = areaByName.get(area.name.toLowerCase())

    if (!areaRow) {
      const { data: created } = await supabase
        .from('hierarchy_nodes')
        .insert({ user_id: userId, name: area.name, level: 'area', parent_id: null })
        .select('id, name, level, parent_id')
        .single()
      if (!created) continue
      areaRow = created
      existingNodes.push(created)
      areaByName.set(area.name.toLowerCase(), created)
    }

    const existingCategoryNames = new Set(
      existingNodes
        .filter(n => n.level === 'category' && n.parent_id === areaRow!.id)
        .map(n => n.name.toLowerCase())
    )

    for (const category of area.categories) {
      if (existingCategoryNames.has(category.name.toLowerCase())) continue
      const { data: created } = await supabase
        .from('hierarchy_nodes')
        .insert({ user_id: userId, name: category.name, level: 'category', parent_id: areaRow.id, color: category.color })
        .select('id, name, level, parent_id')
        .single()
      if (created) existingNodes.push(created)
    }
  }
}
