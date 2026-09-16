import 'server-only'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/** Reads the pending changes the current visitor may see: the owner's queue, or an editor's own. */
export async function loadPendingChanges(treeId: string) {
  const viewer = await currentUserOrNull()
  if (!viewer) return { signedIn: false, result: { ok: false, error: { kind: 'AUTHENTICATION_REQUIRED' } } } as const
  const result = await container.getPendingChanges().execute({ treeId, viewerId: viewer.id })
  return { signedIn: true, result }
}
