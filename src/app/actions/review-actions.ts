'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { acceptWrite, whenWritesEnabled, withinWriteBudget } from '@/app/actions/write-guards'
import type { ReviewAllOutcome } from '@/core/use-cases/review-all-pending-changes'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { REVIEW_ERRORS } from '@/presentation/errors/pending-change-messages'
import {
  TOO_MANY_TREE_WRITES_MESSAGE,
  WRITES_DISABLED_MESSAGE,
} from '@/presentation/errors/tree-error-messages'
import { failed, succeeded, type FormState } from '@/presentation/forms/form-state'
import {
  RESULT_PARAM,
  REVIEW_COMMENT_ENTRIES,
  reviewCommentSchema,
} from '@/presentation/schemas/review-schema'

type ReviewTarget = { readonly treeId: string; readonly pendingChangeId: string }

const COMMENT_FORM = { schema: reviewCommentSchema, entries: REVIEW_COMMENT_ENTRIES }

/**
 * Bound to its tree and proposal by the list; only the owner reaches this far.
 * reason: redirects on success, rather than returning a message through `useActionState` — the
 * approved item leaves the PENDING list this same request revalidates, so a message attached to
 * it would never survive to be announced. The query param carries it instead, read by the page.
 */
export async function approvePendingChangeAction(target: ReviewTarget): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  if (!(await withinWriteBudget(currentUser.id))) return failed(TOO_MANY_TREE_WRITES_MESSAGE)

  const result = await whenWritesEnabled(() =>
    container.approvePendingChange().execute({ ...target, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(REVIEW_ERRORS[result.error.kind].message)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  redirect(`/tree/${target.treeId}/pending?${RESULT_PARAM}=approved`)
}

/** Bound to its tree and proposal by the list; the comment is optional. Same reason as above. */
export async function rejectPendingChangeAction(
  target: ReviewTarget,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptWrite(formData, COMMENT_FORM)
  if (!accepted.ok) return accepted.state

  const result = await whenWritesEnabled(() =>
    container
      .rejectPendingChange()
      .execute({ ...target, viewerId: accepted.viewerId, comment: accepted.data.comment }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, accepted.values)
  if (!result.ok) return failed(REVIEW_ERRORS[result.error.kind].message, accepted.values)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  redirect(`/tree/${target.treeId}/pending?${RESULT_PARAM}=rejected`)
}

/** Bound to its tree and the chosen decision by the confirmation page. */
export async function reviewAllPendingChangesAction(
  target: { readonly treeId: string; readonly decision: 'APPROVED' | 'REJECTED' },
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const accepted = await acceptWrite(formData, COMMENT_FORM)
  if (!accepted.ok) return accepted.state

  const result = await whenWritesEnabled(() =>
    container.reviewAllPendingChanges().execute({
      treeId: target.treeId,
      viewerId: accepted.viewerId,
      decision: target.decision,
      comment: accepted.data.comment,
    }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, accepted.values)
  if (!result.ok) return failed(REVIEW_ERRORS[result.error.kind].message, accepted.values)
  revalidatePath(`/tree/${target.treeId}`, 'layout')
  return succeeded(reviewAllMessage(result.value))
}

function reviewAllMessage(outcome: ReviewAllOutcome): string {
  const parts = [
    outcome.approved > 0 ? `${outcome.approved} approuvée(s)` : null,
    outcome.rejected > 0 ? `${outcome.rejected} rejetée(s)` : null,
    outcome.skipped > 0 ? `${outcome.skipped} ignorée(s) (dépassée(s) ou déjà traitée(s))` : null,
  ].filter((part): part is string => part !== null)
  return parts.length > 0 ? `${parts.join(', ')}.` : 'Aucune proposition à traiter.'
}
