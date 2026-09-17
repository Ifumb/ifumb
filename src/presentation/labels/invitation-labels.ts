import type { InvitationStatus } from '@/core/entities/invitation'

export const INVITATION_STATUS_LABELS: Readonly<Record<InvitationStatus, string>> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
}
