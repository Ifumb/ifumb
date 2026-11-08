'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import type { VisibilityMask } from '@/core/entities/member'
import { whenWritesEnabled } from '@/app/actions/write-guards'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  MEMBER_MASKED_MESSAGE,
  MEMBER_UNMASKED_MESSAGE,
  SET_VISIBILITY_MASK_ERRORS,
} from '@/presentation/errors/visibility-mask-messages'
import { WRITES_DISABLED_MESSAGE } from '@/presentation/errors/tree-error-messages'
import { failed, succeeded, type FormState } from '@/presentation/forms/form-state'

type MemberTarget = { readonly treeId: string; readonly memberId: string }

/** Bound to its tree, member and target mask by the profile page. */
export async function setMemberVisibilityMaskAction(
  target: MemberTarget,
  mask: VisibilityMask,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const result = await whenWritesEnabled(() =>
    container.setMemberVisibilityMask().execute({ ...target, viewerId: currentUser.id, mask }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(SET_VISIBILITY_MASK_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}/member/${target.memberId}`)
  return succeeded(mask === 'MASKED' ? MEMBER_MASKED_MESSAGE : MEMBER_UNMASKED_MESSAGE)
}
