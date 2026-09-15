import type { AuditAction } from '@/core/entities/audit-change'
import {
  CERTAINTY_LABELS,
  FILIATION_LABELS,
  GENDER_LABELS,
  UNION_TYPE_LABELS,
} from '@/presentation/labels/member-labels'
import { ROLE_LABELS, VISIBILITY_LABELS } from '@/presentation/labels/tree-labels'

/** How an action reads at a glance; always shown with its text label, never by colour alone. */
export type AuditTone = 'creation' | 'update' | 'deletion'

export const AUDIT_ACTION_LABELS: Readonly<Record<AuditAction, string>> = {
  MEMBER_CREATED: 'Membre créé',
  MEMBER_UPDATED: 'Membre modifié',
  MEMBER_DELETED: 'Membre supprimé',
  MEMBER_CLAIMED: 'Membre revendiqué',
  UNION_CREATED: 'Union créée',
  UNION_UPDATED: 'Union modifiée',
  UNION_DELETED: 'Union supprimée',
  INVITATION_SENT: 'Invitation envoyée',
  INVITATION_ACCEPTED: 'Invitation acceptée',
  INVITATION_REJECTED: 'Invitation refusée',
  INVITATION_REVOKED: 'Invitation révoquée',
  ROLE_CHANGED: 'Rôle modifié',
  TREE_CREATED: 'Arbre créé',
  TREE_UPDATED: 'Arbre modifié',
  TREE_DELETED: 'Arbre supprimé',
  PENDING_CHANGE_APPROVED: 'Modification approuvée',
  PENDING_CHANGE_REJECTED: 'Modification rejetée',
}

export const AUDIT_ACTION_TONES: Readonly<Record<AuditAction, AuditTone>> = {
  MEMBER_CREATED: 'creation',
  MEMBER_UPDATED: 'update',
  MEMBER_DELETED: 'deletion',
  MEMBER_CLAIMED: 'update',
  UNION_CREATED: 'creation',
  UNION_UPDATED: 'update',
  UNION_DELETED: 'deletion',
  INVITATION_SENT: 'creation',
  INVITATION_ACCEPTED: 'creation',
  INVITATION_REJECTED: 'deletion',
  INVITATION_REVOKED: 'deletion',
  ROLE_CHANGED: 'update',
  TREE_CREATED: 'creation',
  TREE_UPDATED: 'update',
  TREE_DELETED: 'deletion',
  PENDING_CHANGE_APPROVED: 'creation',
  PENDING_CHANGE_REJECTED: 'deletion',
}

/** Technical fields the legacy app recorded, meaningless to a reader of the history. */
export const HIDDEN_AUDIT_FIELDS: ReadonlySet<string> = new Set([
  'id',
  'treeId',
  'claimedByUserId',
  'addedChild',
  'removedChild',
  'parent1Id',
  'parent2Id',
  'authorId',
  'resolvedById',
])

export const AUDIT_FIELD_LABELS: Readonly<Record<string, string>> = {
  firstName: 'Prénom',
  lastName: 'Nom',
  nickname: 'Surnom',
  gender: 'Genre',
  birthDate: 'Naissance',
  birthDateApprox: 'Date de naissance approximative',
  deathDate: 'Décès',
  birthPlace: 'Lieu de naissance',
  tribe: 'Tribu',
  clan: 'Clan',
  ethnicity: 'Ethnie',
  originRegion: 'Région d’origine',
  biography: 'Biographie',
  certainty: 'Certitude',
  name: 'Nom de l’arbre',
  description: 'Description',
  visibility: 'Visibilité',
  type: 'Type d’union',
  startDate: 'Début',
  endDate: 'Fin',
  email: 'Email',
  role: 'Rôle',
  status: 'Statut',
  parent1Name: 'Parent 1',
  parent2Name: 'Parent 2',
  addedChildName: 'Enfant ajouté',
  removedChildName: 'Enfant retiré',
  childrenNames: 'Enfants',
  filiation: 'Filiation',
}

const STATUS_LABELS: Readonly<Record<string, string>> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  REVOKED: 'Révoquée',
}

/** Enumerated values an audit entry may record, with their reader-facing label. */
export const AUDIT_VALUE_LABELS: Readonly<Record<string, string>> = {
  ...GENDER_LABELS,
  ...CERTAINTY_LABELS,
  ...UNION_TYPE_LABELS,
  ...VISIBILITY_LABELS,
  ...ROLE_LABELS,
  ...STATUS_LABELS,
}

/** Values whose label depends on the field that records them. */
export const AUDIT_FIELD_VALUE_LABELS: Readonly<Record<string, Readonly<Record<string, string>>>> =
  {
    filiation: FILIATION_LABELS,
  }
