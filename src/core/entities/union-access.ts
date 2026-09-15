import { canManage, type TreeRole } from '@/core/entities/tree'

/**
 * Only the owner writes unions and their children.
 * reason: an editor's changes must go through review; until pending changes exist (module 2.6),
 * editors cannot write unions at all — the legacy app let them link children directly.
 */
export function canManageUnions(role: TreeRole): boolean {
  return canManage(role)
}
