import 'server-only'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/** Reads the tree's NEW suggestions the current visitor may see — owner or editor, signed in. */
export async function loadSuggestions(treeId: string) {
  const viewer = await currentUserOrNull()
  if (!viewer) {
    return { signedIn: false, result: { ok: false, error: { kind: 'AUTHENTICATION_REQUIRED' } } } as const
  }
  const result = await container.getSuggestions().execute({ treeId, viewerId: viewer.id })
  return { signedIn: true, result }
}
