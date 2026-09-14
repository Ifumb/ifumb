import type { Member } from '@/core/entities/member'
import { canManage, type TreeRole } from '@/core/entities/tree'

/**
 * Only the owner adds a member for now.
 * reason: in the legacy app an editor's additions become pending changes for the owner to approve;
 * until that flow is ported (module 2.6), an editor writing directly would bypass the approval.
 */
export function canAddMember(role: TreeRole): boolean {
  return canManage(role)
}

/** Only the owner deletes a member; the same pending-change reason applies to editors. */
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
