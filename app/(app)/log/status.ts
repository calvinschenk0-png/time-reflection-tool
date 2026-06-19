import { Entry } from './types'

// A block is "confirmed" (shows its workstream color) once it has a workstream.
// Start/end always exist; contacts and note are optional.
// Without a workstream the block stays a yellow draft.
export function isComplete(e: Entry): boolean {
  return !!e.hierarchy_node_id
}
