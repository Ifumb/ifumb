'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { whenWritesEnabled } from '@/app/actions/write-guards'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  CONTACT_REQUEST_ERRORS,
  CONTACT_REQUEST_RESPONDED_MESSAGE,
  CONTACT_REQUEST_SENT_MESSAGE,
  CONTACT_REQUEST_WITHDRAWN_MESSAGE,
} from '@/presentation/errors/contact-request-messages'
import { WRITES_DISABLED_MESSAGE } from '@/presentation/errors/tree-error-messages'
import {
  failed,
  succeeded,
  textEntry,
  validationFailed,
  type FormState,
} from '@/presentation/forms/form-state'
import { contactRequestSchema } from '@/presentation/schemas/contact-request-schema'

const TOO_MANY_CONTACT_REQUESTS_MESSAGE =
  'Trop de demandes envoyées en peu de temps. Patientez avant de réessayer.'

/** Bound to its member by the search results; only a signed-in visitor may send one. */
export async function sendContactRequestAction(
  memberId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const values = { message: textEntry(formData, 'message') }
  const parsed = contactRequestSchema.safeParse(values)
  if (!parsed.success) return validationFailed(parsed.error, values)

  const allowed = await container.allowsAttempt([
    { policy: 'contactRequestByUser', subject: currentUser.id },
  ])
  if (!allowed) return failed(TOO_MANY_CONTACT_REQUESTS_MESSAGE, values)

  const result = await whenWritesEnabled(() =>
    container.sendContactRequest().execute({
      requesterId: currentUser.id,
      memberId,
      message: parsed.data.message,
    }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE, values)
  if (!result.ok) return failed(CONTACT_REQUEST_ERRORS[result.error.kind], values)
  revalidatePath('/explore/members')
  return succeeded(CONTACT_REQUEST_SENT_MESSAGE)
}

/** Bound to its request by the inbox; only the concerned tree's owner may respond. */
export async function respondToContactRequestAction(
  contactRequestId: string,
  decision: 'ACCEPTED' | 'REFUSED',
): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const result = await whenWritesEnabled(() =>
    container.respondToContactRequest().execute({ contactRequestId, viewerId: currentUser.id, decision }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(CONTACT_REQUEST_ERRORS[result.error.kind])
  revalidatePath('/contact-requests')
  return succeeded(CONTACT_REQUEST_RESPONDED_MESSAGE)
}

/** Bound to its request by the outbox; only the requester may withdraw their own. */
export async function withdrawContactRequestAction(contactRequestId: string): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const result = await whenWritesEnabled(() =>
    container.withdrawContactRequest().execute({ contactRequestId, viewerId: currentUser.id }),
  )
  if (!result) return failed(WRITES_DISABLED_MESSAGE)
  if (!result.ok) return failed(CONTACT_REQUEST_ERRORS[result.error.kind])
  revalidatePath('/contact-requests')
  return succeeded(CONTACT_REQUEST_WITHDRAWN_MESSAGE)
}
