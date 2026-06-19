import { Entry } from './types'

// A block is "confirmed" (shows its workstream color) only when every required
// attribute is filled: it has a workstream AND at least one contact.
// Start/end always exist. Otherwise the block stays a yellow draft.
export function isComplete(e: Entry): boolean {
  return !!e.hierarchy_node_id && e.contactIds.length > 0
}
