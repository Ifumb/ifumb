'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { acceptWrite, whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  TOO_MANY_TREE_WRITES_MESSAGE,
  WRITES_DISABLED_MESSAGE,
} from '@/presentation/errors/tree-error-messages'
import {
  ADD_UNION_CHILD_ERRORS,
  CREATE_UNION_ERRORS,
  REMOVE_UNION_CHILD_ERRORS,
  UNION_UNCHANGED_MESSAGE,
  UNION_WRITE_ERRORS,
  UPDATE_UNION_ERRORS,
  childLinkedMessage,
  childUnlinkedMessage,
} from '@/presentation/errors/union-error-messages'
import { failed, failedAt, succeeded, type FormState } from '@/presentation/forms/form-state'
import { UNION_FORM_ENTRIES } from '@/presentation/forms/union-form'
import {
  unionChildFormSchema,
  unionChildRemovalSchema,
  unionFormSchema,
} from '@/presentation/schemas/union-form-schema'

type UnionTarget = { readonly treeId: string; readonly unionId: string }

const UNION_FORM = { schema: unionFormSchema, entries: UNION_FORM_ENTRIES }
const CHILD_FORM = { schema: unionChildFormSchema, entries: ['childId', 'filiation'] }
const REMOVAL_FORM = { schema: unionChildRemovalSchema, entries: ['childId'] }

const unionPath = ({ treeId, unionId }: UnionTarget) => `/tree/${treeId}/union/${unionId}` as const

/** Bound to its tree by the page; the owner's role and every member are checked by the use case. */
export async function createUnionAction(
  treeId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptWrite(formData, UNION_FORM)
  if (!accepted.ok) return accepted.state

  const { data, viewerId, values } = accepted
  const result = await whenWritesEnabled(() =>
    container.createUnion().execute({ treeId, viewerId, ...data }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, values)
  if (!result.ok) return failedAt(CREATE_UNION_ERRORS[result.error.kind], values)
  revalidatePath(`/tree/${treeId}`, 'layout')
  redirect(unionPath({ treeId, unionId: result.value.unionId }))
}

/** Bound to its union by the page; cycles and parents from elsewhere are refused by the use case. */
export async function updateUnionAction(
  target: UnionTarget,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptWrite(formData, UNION_FORM)
  if (!accepted.ok) return accepted.state

  const { data, viewerId, values } = accepted
  const result = await whenWritesEnabled(() =>
    container.updateUnion().execute({ ...target, viewerId, ...data }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, values)
  if (!result.ok) return failedAt(UPDATE_UNION_ERRORS[result.error.kind], values)
  if (!result.value.changed) return succeeded(UNION_UNCHANGED_MESSAGE)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  redirect(unionPath(target))
}

/** Bound to its union by the confirmation page; only the owner may delete. */
export async function deleteUnionAction(target: UnionTarget): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  if (!(await withinWriteBudget(currentUser.id))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const viewerId = currentUser.id
  const result = await whenWritesEnabled(() =>
    container.deleteUnion().execute({ ...target, viewerId }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(UNION_WRITE_ERRORS[result.error.kind].message)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  redirect(`/tree/${target.treeId}`)
}

/** Bound to its union; the chosen member comes from the form and is checked by the use case. */
export async function addUnionChildAction(
  target: UnionTarget,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptWrite(formData, CHILD_FORM)
  if (!accepted.ok) return accepted.state

  const { data, viewerId, values } = accepted
  const result = await whenWritesEnabled(() =>
    container.addUnionChild().execute({ ...target, viewerId, ...data }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, values)
  if (!result.ok) return failedAt(ADD_UNION_CHILD_ERRORS[result.error.kind], values)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  return succeeded(childLinkedMessage(result.value.childName))
}

/** Bound to its union; the pressed button names the child, whose link is checked by the use case. */
export async function removeUnionChildAction(
  target: UnionTarget,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptWrite(formData, REMOVAL_FORM)
  if (!accepted.ok) return accepted.state

  const { data, viewerId } = accepted
  const result = await whenWritesEnabled(() =>
    container.removeUnionChild().execute({ ...target, viewerId, ...data }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(REMOVE_UNION_CHILD_ERRORS[result.error.kind].message)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  return succeeded(childUnlinkedMessage(result.value.childName))
}
