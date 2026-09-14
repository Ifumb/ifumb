import 'server-only'
import { cache } from 'react'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/** Reads the editable member once per request, for the edit and delete pages and their metadata. */
export const loadMemberForm = cache(async (treeId: string, memberId: string) => {
  const currentUser = await requireCurrentUser()
  return container.getMemberForm().execute({ treeId, memberId, viewerId: currentUser.id })
})
