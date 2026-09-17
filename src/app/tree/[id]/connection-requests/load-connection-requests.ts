import 'server-only'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/** Reads the tree's pending connection requests the current visitor may see — owner only, signed in. */
export async function loadConnectionRequests(treeId: string) {
  const viewer = await currentUserOrNull()
  if (!viewer) {
    return { signedIn: false, result: { ok: false, error: { kind: 'AUTHENTICATION_REQUIRED' } } } as const
  }
  const result = await container.getConnectionRequests().execute({ treeId, viewerId: viewer.id })
  return { signedIn: true, result }
}
