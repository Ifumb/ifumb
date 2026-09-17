import type { ToggleMemberDiscoverableError } from '@/core/use-cases/toggle-member-discoverable'

export const MEMBER_MADE_DISCOVERABLE_MESSAGE = 'Membre rendu découvrable dans la recherche globale.'
export const MEMBER_MADE_UNDISCOVERABLE_MESSAGE = 'Membre retiré de la recherche globale.'

export const TOGGLE_DISCOVERABLE_ERRORS: Readonly<Record<ToggleMemberDiscoverableError['kind'], string>> = {
  TREE_NOT_FOUND: 'Cet arbre n’existe plus.',
  AUTHENTICATION_REQUIRED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  ACCESS_DENIED: 'Vous n’avez plus accès à cet arbre.',
  MEMBER_NOT_FOUND: 'Ce membre n’existe plus.',
  MEMBER_EDIT_FORBIDDEN: 'Seul le propriétaire, ou le compte qui a revendiqué cette fiche, peut changer ce réglage.',
}
