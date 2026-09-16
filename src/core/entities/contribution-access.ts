import type { TreeRole } from '@/core/entities/tree'

export type WriteMode = 'apply' | 'propose' | 'forbidden'

/**
 * Whether a change is written immediately, proposed for the owner's review, or refused.
 * `applies` is the existing entity-specific rule at the call site — `canAddMember(role)`,
 * `canEditMember(role, member, viewerId)`, `canDeleteMember(role)`, `canManageUnions(role)`.
 * reason: shared by every write use case that can propose instead of apply (module 2.6), so the
 * apply/propose choice is made once and not copied into each of the six of them.
 */
export function writeMode(role: TreeRole, applies: boolean): WriteMode {
  if (applies) return 'apply'
  return role === 'EDITOR' ? 'propose' : 'forbidden'
}
