import type { RespondToContactRequestError } from '@/core/use-cases/respond-to-contact-request'
import type { SendContactRequestError } from '@/core/use-cases/send-contact-request'
import type { WithdrawContactRequestError } from '@/core/use-cases/withdraw-contact-request'

export const CONTACT_REQUEST_SENT_MESSAGE = 'Demande de contact envoyée.'
export const CONTACT_REQUEST_RESPONDED_MESSAGE = 'Réponse enregistrée.'
export const CONTACT_REQUEST_WITHDRAWN_MESSAGE = 'Demande retirée.'

type ContactRequestErrorKind =
  | SendContactRequestError['kind']
  | RespondToContactRequestError['kind']
  | WithdrawContactRequestError['kind']

export const CONTACT_REQUEST_ERRORS: Readonly<Record<ContactRequestErrorKind, string>> = {
  MEMBER_NOT_FOUND: 'Ce membre n’existe plus.',
  MEMBER_NOT_DISCOVERABLE: 'Ce membre n’est plus découvrable.',
  CANNOT_CONTACT_OWN_MEMBER: 'Vous ne pouvez pas vous contacter vous-même.',
  CONTACT_REQUEST_ALREADY_ACTIVE: 'Une demande est déjà en cours pour ce membre.',
  CONTACT_REQUEST_NOT_FOUND: 'Cette demande de contact n’existe plus.',
  NOT_TREE_OWNER: 'Seul le propriétaire de l’arbre peut répondre à cette demande.',
  NOT_REQUESTER: 'Seul l’auteur de la demande peut la retirer.',
  CONTACT_REQUEST_ALREADY_RESOLVED: 'Cette demande a déjà été traitée.',
}
