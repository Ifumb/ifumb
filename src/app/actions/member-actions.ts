'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { acceptWrite, whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  CREATE_MEMBER_ERRORS,
  MEMBER_PROPOSED_MESSAGE,
  MEMBER_UNCHANGED_MESSAGE,
  MEMBER_WRITE_ERRORS,
  UPDATE_MEMBER_ERRORS,
} from '@/presentation/errors/member-error-messages'
import {
  TOO_MANY_TREE_WRITES_MESSAGE,
  WRITES_DISABLED_MESSAGE,
} from '@/presentation/errors/tree-error-messages'
import { MEMBER_FORM_ENTRIES } from '@/presentation/forms/member-form'
import { failed, failedAt, succeeded, type FormState } from '@/presentation/forms/form-state'
import { memberFormSchema } from '@/presentation/schemas/member-form-schema'

const MEMBER_FORM = { schema: memberFormSchema, entries: MEMBER_FORM_ENTRIES }

/** Bound to its tree by the page; the owner's role is checked again by the use case. */
export async function createMemberAction(
  treeId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptWrite(formData, MEMBER_FORM)
  if (!accepted.ok) return accepted.state

  const { data: details, viewerId, values } = accepted
  const result = await whenWritesEnabled(() =>
    container.createMember().execute({ treeId, viewerId, ...details }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, values)
  if (!result.ok) return failedAt(CREATE_MEMBER_ERRORS[result.error.kind], values)
  revalidatePath(`/tree/${treeId}`, 'layout')
  if (result.value.outcome === 'proposed') return succeeded(MEMBER_PROPOSED_MESSAGE)
  // reason: après création, retrouver le graphe actualisé comme dans le parcours legacy.
  redirect(`/tree/${treeId}`)
}

/** Bound to its tree and member by the page; the right to edit is checked again by the use case. */
export async function updateMemberAction(
  target: { readonly treeId: string; readonly memberId: string },
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptWrite(formData, MEMBER_FORM)
  if (!accepted.ok) return accepted.state

  const { data: details, viewerId, values } = accepted
  const result = await whenWritesEnabled(() =>
    container.updateMember().execute({ ...target, viewerId, ...details }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, values)
  if (!result.ok) return failedAt(UPDATE_MEMBER_ERRORS[result.error.kind], values)
  if (result.value.outcome === 'proposed') return succeeded(MEMBER_PROPOSED_MESSAGE)
  if (!result.value.changed) return succeeded(MEMBER_UNCHANGED_MESSAGE)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  redirect(`/tree/${target.treeId}/member/${target.memberId}`)
}

/** Bound to its tree and member by the confirmation page; only the owner may delete. */
export async function deleteMemberAction(target: {
  readonly treeId: string
  readonly memberId: string
}): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  if (!(await withinWriteBudget(currentUser.id))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const result = await whenWritesEnabled(() =>
    container.deleteMember().execute({ ...target, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(MEMBER_WRITE_ERRORS[result.error.kind].message)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  if (result.value.outcome === 'proposed') return succeeded(MEMBER_PROPOSED_MESSAGE)
  redirect(`/tree/${target.treeId}`)
}
