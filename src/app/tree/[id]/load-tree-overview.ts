import 'server-only'
import { cache } from 'react'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/**
 * Reads a tree for the current visitor once per request: `generateMetadata` and the page both need
 * it, and React's `cache` makes the second call reuse the first result.
 */
export const loadTreeOverview = cache(async (treeId: string) => {
  const viewer = await currentUserOrNull()
  const result = await container.getTreeOverview().execute({ treeId, viewerId: viewer?.id })
  return { viewerId: viewer?.id, signedIn: viewer !== null, result }
})
