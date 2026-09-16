import type { Member } from '@/core/entities/member'
import { canManage, type TreeRole } from '@/core/entities/tree'

/**
 * Only the owner adds a member directly.
 * reason: an editor's addition goes through `writeMode` instead (module 2.6) — it is proposed for
 * the owner to approve, never written straight to the tree.
 */
export function canAddMember(role: TreeRole): boolean {
  return canManage(role)
}

/** Only the owner deletes a member directly; an editor's deletion is proposed instead. */
export function canDeleteMember(role: TreeRole): boolean {
  return canManage(role)
}

/** The owner edits any member; an account edits the member it claimed, whatever its role. */
export function canEditMember(
  role: TreeRole,
  member: Member,
  viewerId: string | undefined,
): boolean {
  if (canManage(role)) return true
  return viewerId !== undefined && member.claimedById === viewerId
}
