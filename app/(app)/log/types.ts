export type Node = {
  id: string
  name: string
  level: 'project' | 'workstream'
  parent_id: string | null
  color: string | null
  is_archived: boolean
}

export type Contact = {
  id: string
  name: string
  is_archived: boolean
}

export type Entry = {
  id: string
  entry_date: string
  start_time: string   // "HH:MM:SS"
  end_time: string
  duration_minutes: number
  hierarchy_node_id: string | null
  note: string | null
  contactIds: string[]
}
