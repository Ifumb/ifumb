import 'server-only'
import { cache } from 'react'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/** Reads the family graph once per request, shared by `generateMetadata` and the page. */
export const loadFamilyGraph = cache(async (treeId: string) => {
  const viewer = await currentUserOrNull()
  const result = await container.getFamilyGraph().execute({ treeId, viewerId: viewer?.id })
  return { signedIn: viewer !== null, result }
})
