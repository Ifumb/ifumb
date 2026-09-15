'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import type { MemberTarget } from '@/core/use-cases/member-write-access'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { MEMBER_WRITE_ERRORS } from '@/presentation/errors/member-error-messages'
import {
  CHANGE_MEMBER_PHOTO_ERRORS,
  NO_PHOTO_MESSAGE,
  PHOTO_REMOVED_MESSAGE,
  PHOTO_SAVED_MESSAGE,
  TOO_MANY_PHOTOS_MESSAGE,
} from '@/presentation/errors/member-photo-messages'
import {
  TOO_MANY_TREE_WRITES_MESSAGE,
  WRITES_DISABLED_MESSAGE,
} from '@/presentation/errors/tree-error-messages'
import {
  failed,
  failedAt,
  succeeded,
  validationFailed,
  type FormState,
} from '@/presentation/forms/form-state'
import {
  memberPhotoFileSchema,
  memberPhotoIntentSchema,
} from '@/presentation/schemas/member-photo-schema'

type PhotoTarget = Omit<MemberTarget, 'viewerId'>

/** Bound to its member by the photo page; the right to edit it is checked by the use cases. */
export async function memberPhotoAction(
  target: PhotoTarget,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const viewed = { ...target, viewerId: currentUser.id }
  return memberPhotoIntentSchema.parse(formData.get('intent')) === 'remove'
    ? removePhoto(viewed)
    : savePhoto(viewed, formData.get('photo'))
}

async function savePhoto(
  target: MemberTarget,
  entry: FormDataEntryValue | null,
): Promise<FormState> {
  const parsed = memberPhotoFileSchema.safeParse(entry)
  if (!parsed.success) return validationFailed(parsed.error)
  const budgets = [{ policy: 'photoUploadByUser', subject: target.viewerId }] as const
  if (!(await container.allowsAttempt(budgets))) return failed(TOO_MANY_PHOTOS_MESSAGE)
  if (!(await withinWriteBudget(target.viewerId))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const photo = new Uint8Array(await parsed.data.arrayBuffer())
  const result = await whenWritesEnabled(() =>
    container.changeMemberPhoto().execute({ ...target, photo }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failedAt(CHANGE_MEMBER_PHOTO_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  return succeeded(PHOTO_SAVED_MESSAGE)
}

async function removePhoto(target: MemberTarget): Promise<FormState> {
  if (!(await withinWriteBudget(target.viewerId))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const result = await whenWritesEnabled(() => container.removeMemberPhoto().execute(target))
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(MEMBER_WRITE_ERRORS[result.error.kind].message)
  if (!result.value.changed) return succeeded(NO_PHOTO_MESSAGE)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  return succeeded(PHOTO_REMOVED_MESSAGE)
}
