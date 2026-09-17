'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { CLAIM_ERRORS } from '@/presentation/errors/claim-messages'
import { TOO_MANY_TREE_WRITES_MESSAGE, WRITES_DISABLED_MESSAGE } from '@/presentation/errors/tree-error-messages'
import { failed, succeeded, type FormState } from '@/presentation/forms/form-state'

type MemberTarget = { readonly treeId: string; readonly memberId: string }

/**
 * Bound to its tree and member by the profile page. On success the page revalidates and shows the
 * member as claimed instead of the button, so no confirmation message is returned here.
 */
export async function claimMemberAction(target: MemberTarget): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  if (!(await withinWriteBudget(currentUser.id))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const result = await whenWritesEnabled(() =>
    container.claimMember().execute({ ...target, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(CLAIM_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}/member/${target.memberId}`)
  return succeeded('')
}
