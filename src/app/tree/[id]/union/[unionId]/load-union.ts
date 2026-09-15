import 'server-only'
import { cache } from 'react'
import { currentUserOrNull, requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/** Reads a union once per request, shared by `generateMetadata` and the page. */
export const loadUnion = cache(async (treeId: string, unionId: string) => {
  const viewer = await currentUserOrNull()
  const result = await container.getUnion().execute({ treeId, unionId, viewerId: viewer?.id })
  return { signedIn: viewer !== null, result }
})

/** Reads what the owner needs to edit a union, once per request. */
export const loadUnionForm = cache(async (treeId: string, unionId?: string) => {
  const currentUser = await requireCurrentUser()
  return container.getUnionForm().execute({ treeId, unionId, viewerId: currentUser.id })
})
