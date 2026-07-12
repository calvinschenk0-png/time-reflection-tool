import { Entry } from './types'

// A block is "confirmed" (shows its category color) once it has a category.
// Start/end always exist; contacts and note are optional.
// Without a category the block stays a yellow draft.
export function isComplete(e: Entry): boolean {
  return !!e.hierarchy_node_id
}
