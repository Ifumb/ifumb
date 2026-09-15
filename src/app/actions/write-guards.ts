import 'server-only'
import type { z } from 'zod'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { BusinessWritesDisabledError } from '@/infrastructure/config/business-writes'
import { container } from '@/infrastructure/di/container'
import { TOO_MANY_TREE_WRITES_MESSAGE } from '@/presentation/errors/tree-error-messages'
import {
  failed,
  textEntry,
  validationFailed,
  type FormState,
} from '@/presentation/forms/form-state'

export type AcceptedWrite<T> = {
  readonly ok: true
  readonly data: T
  readonly viewerId: string
  /** The submitted text entries, echoed back when the write is refused later. */
  readonly values: Record<string, string>
}

export type RefusedWrite = { readonly ok: false; readonly state: FormState }

/** Charges one write to the user's budget, shared by every change made inside trees. */
export function withinWriteBudget(userId: string): Promise<boolean> {
  return container.allowsAttempt([{ policy: 'treeWriteByUser', subject: userId }])
}

/** The signed-in user, valid entries, then the write budget: nothing is stored before all pass. */
export async function acceptWrite<T>(
  formData: FormData,
  form: { readonly schema: z.ZodType<T>; readonly entries: readonly string[] },
): Promise<AcceptedWrite<T> | RefusedWrite> {
  const currentUser = await requireCurrentUser()
  const values = Object.fromEntries(form.entries.map((name) => [name, textEntry(formData, name)]))
  const parsed = form.schema.safeParse(values)
  if (!parsed.success) return { ok: false, state: validationFailed(parsed.error, values) }
  if (!(await withinWriteBudget(currentUser.id))) {
    return { ok: false, state: failed(TOO_MANY_TREE_WRITES_MESSAGE, values) }
  }
  return { ok: true, data: parsed.data, viewerId: currentUser.id, values }
}

/** Runs a write; null when this environment has business writes turned off (ADR 0005). */
export async function whenWritesEnabled<T>(write: () => Promise<T>): Promise<T | null> {
  try {
    return await write()
  } catch (error) {
    if (error instanceof BusinessWritesDisabledError) return null
    throw error
  }
}
