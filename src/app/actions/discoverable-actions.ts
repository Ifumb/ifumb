'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { whenWritesEnabled } from '@/app/actions/write-guards'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  MEMBER_MADE_DISCOVERABLE_MESSAGE,
  MEMBER_MADE_UNDISCOVERABLE_MESSAGE,
  TOGGLE_DISCOVERABLE_ERRORS,
} from '@/presentation/errors/discoverable-messages'
import { WRITES_DISABLED_MESSAGE } from '@/presentation/errors/tree-error-messages'
import { failed, succeeded, type FormState } from '@/presentation/forms/form-state'

type MemberTarget = { readonly treeId: string; readonly memberId: string }

/** Bound to its tree, member and target value by the profile page. */
export async function toggleMemberDiscoverableAction(
  target: MemberTarget,
  discoverable: boolean,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const result = await whenWritesEnabled(() =>
    container.toggleMemberDiscoverable().execute({ ...target, viewerId: currentUser.id, discoverable }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(TOGGLE_DISCOVERABLE_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}/member/${target.memberId}`)
  return succeeded(discoverable ? MEMBER_MADE_DISCOVERABLE_MESSAGE : MEMBER_MADE_UNDISCOVERABLE_MESSAGE)
}
