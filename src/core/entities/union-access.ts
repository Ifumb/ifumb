import { canManage, type TreeRole } from '@/core/entities/tree'

/**
 * Only the owner writes a union directly.
 * reason: an editor's create, update or delete on a union goes through `writeMode` instead
 * (module 2.6) — it is proposed for the owner to approve. Linking or unlinking a union's children,
 * and a member's photo, stay owner-only even from an editor: the legacy `PendingChange` format has
 * no shape for either, so a proposal cannot represent them (decision confirmed with the user).
 */
export function canManageUnions(role: TreeRole): boolean {
  return canManage(role)
}
