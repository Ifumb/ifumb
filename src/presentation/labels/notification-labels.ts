import type { NotificationType } from '@/core/use-cases/ports/notification-writer'

/** What happened, from the reader's side — combined with who and which tree by the mapper. */
export const NOTIFICATION_TYPE_LABELS: Readonly<Record<NotificationType, string>> = {
  PENDING_CHANGE_CREATED: 'a proposé une modification',
  CHANGE_APPROVED: 'a approuvé votre proposition',
  CHANGE_REJECTED: 'a rejeté votre proposition',
  // reason: mapped for the full enum (module 2.9, contact-requests, Phase 3), even though nothing
  // produces either yet.
  CONTACT_REQUEST_RECEIVED: 'a envoyé une demande de contact',
  CONTACT_REQUEST_RESPONDED: 'a répondu à votre demande de contact',
}
