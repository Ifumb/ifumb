'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  computeSuggestionsMessage,
  CROSS_TREE_ERRORS,
} from '@/presentation/errors/cross-tree-messages'
import {
  TOO_MANY_TREE_WRITES_MESSAGE,
  WRITES_DISABLED_MESSAGE,
} from '@/presentation/errors/tree-error-messages'
import { failed, succeeded, type FormState } from '@/presentation/forms/form-state'
import { RESULT_PARAM } from '@/presentation/schemas/cross-tree-review-schema'

const TOO_MANY_COMPUTATIONS_MESSAGE = 'Trop de calculs en peu de temps. Patientez avant de réessayer.'

type SuggestionTarget = { readonly treeId: string; readonly suggestionId: string }
type ConnectionRequestTarget = { readonly treeId: string; readonly connectionRequestId: string }

/** Bound to its tree by the suggestions page; the button stays after a recompute, so the result
 * is shown inline rather than through a redirect (unlike accept/reject below). */
export async function computeSuggestionsAction(treeId: string): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const allowed = await container.allowsAttempt([
    { policy: 'computeSuggestionsByUser', subject: currentUser.id },
  ])
  if (!allowed) return failed(TOO_MANY_COMPUTATIONS_MESSAGE)

  const result = await whenWritesEnabled(() =>
    container.computeSuggestions().execute({ treeId, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(CROSS_TREE_ERRORS[result.error.kind])
  revalidatePath(`/tree/${treeId}/suggestions`)
  return succeeded(computeSuggestionsMessage(result.value))
}

/** Bound to its tree and suggestion by the list; the accepted row leaves the NEW list this same
 * request revalidates — the confirmation lives in the redirect's query param instead. */
export async function acceptSuggestionAction(target: SuggestionTarget): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  if (!(await withinWriteBudget(currentUser.id))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const result = await whenWritesEnabled(() =>
    container.acceptSuggestion().execute({ ...target, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(CROSS_TREE_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}/suggestions`)
  redirect(`/tree/${target.treeId}/suggestions?${RESULT_PARAM}=accepted`)
}

/** Same reasoning as `acceptSuggestionAction`. */
export async function rejectSuggestionAction(target: SuggestionTarget): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  if (!(await withinWriteBudget(currentUser.id))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const result = await whenWritesEnabled(() =>
    container.rejectSuggestion().execute({ ...target, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(CROSS_TREE_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}/suggestions`)
  redirect(`/tree/${target.treeId}/suggestions?${RESULT_PARAM}=rejected`)
}

/** Bound to its tree and request by the list; the approved row leaves the PENDING list this same
 * request revalidates — same reasoning as `acceptSuggestionAction`. */
export async function approveConnectionRequestAction(
  target: ConnectionRequestTarget,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  if (!(await withinWriteBudget(currentUser.id))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const result = await whenWritesEnabled(() =>
    container.approveConnectionRequest().execute({ ...target, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(CROSS_TREE_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}/connection-requests`)
  revalidatePath(`/tree/${target.treeId}/links`)
  redirect(`/tree/${target.treeId}/connection-requests?${RESULT_PARAM}=approved`)
}

/** Same reasoning as `approveConnectionRequestAction`. */
export async function refuseConnectionRequestAction(
  target: ConnectionRequestTarget,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  if (!(await withinWriteBudget(currentUser.id))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const result = await whenWritesEnabled(() =>
    container.refuseConnectionRequest().execute({ ...target, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(CROSS_TREE_ERRORS[result.error.kind])
  revalidatePath(`/tree/${target.treeId}/connection-requests`)
  redirect(`/tree/${target.treeId}/connection-requests?${RESULT_PARAM}=refused`)
}
