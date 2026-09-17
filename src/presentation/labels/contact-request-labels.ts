import type { ContactRequestStatus } from '@/core/entities/contact-request'

export const CONTACT_REQUEST_STATUS_LABELS: Readonly<Record<ContactRequestStatus, string>> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REFUSED: 'Refusée',
  WITHDRAWN: 'Retirée',
}
