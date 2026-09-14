import 'server-only'
import { cache } from 'react'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/** Reads a member profile once per request, shared by `generateMetadata` and the page. */
export const loadMemberProfile = cache(async (treeId: string, memberId: string) => {
  const viewer = await currentUserOrNull()
  const result = await container
    .getMemberProfile()
    .execute({ treeId, memberId, viewerId: viewer?.id })
  return { signedIn: viewer !== null, result }
})
