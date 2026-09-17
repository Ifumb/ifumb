'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  INVITATION_ERRORS,
  INVITATION_SENT_MESSAGE,
  ROLE_CHANGED_MESSAGE,
} from '@/presentation/errors/invitation-messages'
import { TOO_MANY_TREE_WRITES_MESSAGE, WRITES_DISABLED_MESSAGE } from '@/presentation/errors/tree-error-messages'
import { failed, succeeded, textEntry, validationFailed, type FormState } from '@/presentation/forms/form-state'
import { changeRoleSchema, inviteSchema } from '@/presentation/schemas/invitation-schema'

type CollaboratorTarget = { readonly treeId: string; readonly invitationId: string }

/** Bound to its tree by the collaborators page; only the owner may invite. */
export async function sendInvitationAction(
  treeId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const values = { email: textEntry(formData, 'email'), role: textEntry(formData, 'role') }
  const parsed = inviteSchema.safeParse(values)
  if (!parsed.success) return validationFailed(parsed.error, values)
  if (!(await withinWriteBudget(currentUser.id))) return failed(TOO_MANY_TREE_WRITES_MESSAGE, values)

  const result = await whenWritesEnabled(() =>
    container.sendInvitation().execute({ treeId, viewerId: currentUser.id, ...parsed.data }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, values)
  if (!result.ok) return failed(INVITATION_ERRORS[result.error.kind], values)
  revalidatePath(`/tree/${treeId}/collaborators`)
  return succeeded(INVITATION_SENT_MESSAGE)
}

/** Bound to its invitation by the collaborators page; only the owner may change a role. */
export async function changeCollaboratorRoleAction(
  target: CollaboratorTarget,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const values = { role: textEntry(formData, 'role') }
  const parsed = changeRoleSchema.safeParse(values)
  if (!parsed.success) return validationFailed(parsed.error, values)

  const result = await whenWritesEnabled(() =>
    container.changeCollaboratorRole().execute({ ...target, viewerId: currentUser.id, ...parsed.data }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(INVITATION_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}/collaborators`)
  return succeeded(ROLE_CHANGED_MESSAGE)
}

/** Bound to its invitation by the confirmation page; only the owner may revoke. */
export async function revokeInvitationAction(target: CollaboratorTarget): Promise<FormState> {
  const currentUser = await requireCurrentUser()

  const result = await whenWritesEnabled(() =>
    container.revokeInvitation().execute({ ...target, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(INVITATION_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}/collaborators`)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  redirect(`/tree/${target.treeId}/collaborators`)
}

/** Bound to its token by the accept page; the account's email is checked again by the use case. */
export async function acceptInvitationAction(token: string): Promise<FormState> {
  const currentUser = await requireCurrentUser()

  const result = await whenWritesEnabled(() =>
    container.respondToInvitation().execute({ token, viewerId: currentUser.id, decision: 'ACCEPTED' }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(INVITATION_ERRORS[result.error.kind])
  redirect(`/tree/${result.value.treeId}`)
}

export async function rejectInvitationAction(token: string): Promise<FormState> {
  const currentUser = await requireCurrentUser()

  const result = await whenWritesEnabled(() =>
    container.respondToInvitation().execute({ token, viewerId: currentUser.id, decision: 'REJECTED' }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(INVITATION_ERRORS[result.error.kind])
  redirect('/dashboard')
}
