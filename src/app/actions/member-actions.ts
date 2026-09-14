'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import type { MemberDetailsInput } from '@/core/entities/member'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  CREATE_MEMBER_ERRORS,
  MEMBER_UNCHANGED_MESSAGE,
  MEMBER_WRITE_ERRORS,
  UPDATE_MEMBER_ERRORS,
} from '@/presentation/errors/member-error-messages'
import {
  TOO_MANY_TREE_WRITES_MESSAGE,
  WRITES_DISABLED_MESSAGE,
} from '@/presentation/errors/tree-error-messages'
import { MEMBER_FORM_ENTRIES } from '@/presentation/forms/member-form'
import {
  failed,
  failedAt,
  succeeded,
  textEntry,
  validationFailed,
  type FormState,
} from '@/presentation/forms/form-state'
import { memberFormSchema } from '@/presentation/schemas/member-form-schema'

type Accepted = {
  readonly ok: true
  readonly details: MemberDetailsInput
  readonly viewerId: string
}
type Refused = { readonly ok: false; readonly state: FormState }

/** Bound to its tree by the page; the owner's role is checked again by the use case. */
export async function createMemberAction(
  treeId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptMemberForm(formData)
  if (!accepted.ok) return accepted.state

  const { details, viewerId } = accepted
  const result = await whenWritesEnabled(() =>
    container.createMember().execute({ treeId, viewerId, ...details }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, valuesOf(formData))
  if (!result.ok) return failedAt(CREATE_MEMBER_ERRORS[result.error.kind], valuesOf(formData))
  revalidatePath(`/tree/${treeId}`, 'layout')
  redirect(`/tree/${treeId}/member/${result.value.memberId}`)
}

/** Bound to its tree and member by the page; the right to edit is checked again by the use case. */
export async function updateMemberAction(
  target: { readonly treeId: string; readonly memberId: string },
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptMemberForm(formData)
  if (!accepted.ok) return accepted.state

  const { details, viewerId } = accepted
  const result = await whenWritesEnabled(() =>
    container.updateMember().execute({ ...target, viewerId, ...details }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, valuesOf(formData))
  if (!result.ok) return failedAt(UPDATE_MEMBER_ERRORS[result.error.kind], valuesOf(formData))
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
  redirect(`/tree/${target.treeId}`)
}

/** The signed-in user, valid details, then the write budget: nothing is stored before all pass. */
async function acceptMemberForm(formData: FormData): Promise<Accepted | Refused> {
  const currentUser = await requireCurrentUser()
  const values = valuesOf(formData)
  const parsed = memberFormSchema.safeParse(values)
  if (!parsed.success) return { ok: false, state: validationFailed(parsed.error, values) }
  if (!(await withinWriteBudget(currentUser.id))) {
    return { ok: false, state: failed(TOO_MANY_TREE_WRITES_MESSAGE, values) }
  }
  return { ok: true, details: parsed.data, viewerId: currentUser.id }
}

function valuesOf(formData: FormData): Record<string, string> {
  return Object.fromEntries(MEMBER_FORM_ENTRIES.map((name) => [name, textEntry(formData, name)]))
}
