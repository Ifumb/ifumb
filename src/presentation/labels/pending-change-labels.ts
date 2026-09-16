import type {
  PendingActionKind,
  PendingStatus,
  PendingTargetType,
} from '@/core/entities/pending-change'

export const PENDING_TARGET_TYPE_LABELS: Readonly<Record<PendingTargetType, string>> = {
  MEMBER: 'Membre',
  UNION: 'Union',
}

export const PENDING_ACTION_LABELS: Readonly<Record<PendingActionKind, string>> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
}

export const PENDING_STATUS_LABELS: Readonly<Record<PendingStatus, string>> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
}
