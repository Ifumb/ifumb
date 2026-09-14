import type { AuditDiff } from '@/core/entities/audit-change'
import type { Tree, TreeDetailChange } from '@/core/entities/tree'

/** What the history records when a tree is created: its details, after. */
export function treeCreationDiff(tree: Tree): AuditDiff {
  return { before: null, after: { ...tree.details } }
}

/**
 * What the history records when a tree is revised: the changed fields only, on both sides.
 * reason: the legacy app recorded three fields before and the submitted fields after, so its
 * history could not tell what had really changed.
 */
export function treeRevisionDiff(changes: readonly TreeDetailChange[]): AuditDiff {
  return {
    before: Object.fromEntries(changes.map(({ field, before }) => [field, before])),
    after: Object.fromEntries(changes.map(({ field, after }) => [field, after])),
  }
}
