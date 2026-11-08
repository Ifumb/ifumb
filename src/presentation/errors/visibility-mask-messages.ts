import type { SetMemberVisibilityMaskError } from '@/core/use-cases/set-member-visibility-mask'

export const MEMBER_MASKED_MESSAGE = 'Dates, lieux, photo et biographie masqués pour le public.'
export const MEMBER_UNMASKED_MESSAGE = 'Fiche à nouveau visible en entier pour le public.'

export const SET_VISIBILITY_MASK_ERRORS: Readonly<
  Record<SetMemberVisibilityMaskError['kind'], string>
> = {
  TREE_NOT_FOUND: 'Cet arbre n’existe plus.',
  AUTHENTICATION_REQUIRED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  ACCESS_DENIED: 'Vous n’avez plus accès à cet arbre.',
  MEMBER_NOT_FOUND: 'Ce membre n’existe plus.',
  MEMBER_EDIT_FORBIDDEN: 'Seul le propriétaire, ou le compte qui a revendiqué cette fiche, peut changer ce réglage.',
  MEMBER_IS_DECEASED: 'Le masquage ne concerne que les personnes vivantes.',
}
