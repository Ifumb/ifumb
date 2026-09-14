'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  TOO_MANY_TREE_WRITES_MESSAGE,
  TREE_UNCHANGED_MESSAGE,
  TREE_UPDATED_MESSAGE,
  UPDATE_TREE_ERRORS,
  WRITES_DISABLED_MESSAGE,
} from '@/presentation/errors/tree-error-messages'
import {
  failed,
  succeeded,
  textEntry,
  validationFailed,
  type FormState,
} from '@/presentation/forms/form-state'
import { treeFormSchema, type TreeFormData } from '@/presentation/schemas/tree-form-schema'

type Accepted = { readonly ok: true; readonly data: TreeFormData }
type Refused = { readonly ok: false; readonly state: FormState }

export async function createTreeAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const accepted = await acceptTreeForm(formData, currentUser.id)
  if (!accepted.ok) return accepted.state

  const created = await whenWritesEnabled(() =>
    container.createTree().execute({ ownerId: currentUser.id, ...accepted.data }),
  )
  if (!created) return failed(WRITES_DISABLED_MESSAGE, valuesOf(formData))
  revalidatePath('/dashboard')
  redirect(`/tree/${created.treeId}`)
}

/** Bound to its tree by the settings page; ownership is checked again by the use case. */
export async function updateTreeAction(
  treeId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const accepted = await acceptTreeForm(formData, currentUser.id)
  if (!accepted.ok) return accepted.state

  const result = await whenWritesEnabled(() =>
    container.updateTree().execute({ treeId, viewerId: currentUser.id, ...accepted.data }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, valuesOf(formData))
  if (!result.ok) return failed(UPDATE_TREE_ERRORS[result.error.kind], valuesOf(formData))
  if (!result.value.changed) return succeeded(TREE_UNCHANGED_MESSAGE)
  revalidatePath(`/tree/${treeId}`)
  revalidatePath('/dashboard')
  return succeeded(TREE_UPDATED_MESSAGE)
}

/** Validation, then the write budget of the user: nothing is stored before both pass. */
async function acceptTreeForm(formData: FormData, userId: string): Promise<Accepted | Refused> {
  const values = valuesOf(formData)
  const parsed = treeFormSchema.safeParse(values)
  if (!parsed.success) return { ok: false, state: validationFailed(parsed.error, values) }
  if (!(await withinWriteBudget(userId)))
    return { ok: false, state: failed(TOO_MANY_TREE_WRITES_MESSAGE, values) }
  return { ok: true, data: parsed.data }
}

function valuesOf(formData: FormData): Record<string, string> {
  return {
    name: textEntry(formData, 'name'),
    description: textEntry(formData, 'description'),
    visibility: textEntry(formData, 'visibility'),
  }
}
