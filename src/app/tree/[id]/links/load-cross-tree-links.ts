import 'server-only'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/** Reads the tree's established cross-tree links — open to anyone who can already read this tree. */
export async function loadCrossTreeLinks(treeId: string) {
  const viewer = await currentUserOrNull()
  const result = await container.listCrossTreeLinks().execute({ treeId, viewerId: viewer?.id })
  return { signedIn: viewer !== null, result }
}
