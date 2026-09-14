import 'server-only'
import type { Tree } from '@/core/entities/tree'

/** Write side of trees. */
export interface TreeWriter {
  insert(tree: Tree): Promise<void>
  /** Stores the details and the update time of an existing tree. */
  update(tree: Tree): Promise<void>
}
