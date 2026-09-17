import type { ChangeCollaboratorRoleError } from '@/core/use-cases/change-collaborator-role'
import type { RespondToInvitationError } from '@/core/use-cases/respond-to-invitation'
import type { RevokeInvitationError } from '@/core/use-cases/revoke-invitation'
import type { SendInvitationError } from '@/core/use-cases/send-invitation'

export const INVITATION_SENT_MESSAGE = 'Invitation envoyée.'
export const ROLE_CHANGED_MESSAGE = 'Rôle modifié.'

type InvitationErrorKind =
  | SendInvitationError['kind']
  | RespondToInvitationError['kind']
  | ChangeCollaboratorRoleError['kind']
  | RevokeInvitationError['kind']

export const INVITATION_ERRORS: Readonly<Record<InvitationErrorKind, string>> = {
  TREE_NOT_FOUND: 'Cet arbre n’existe plus.',
  AUTHENTICATION_REQUIRED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  ACCESS_DENIED: 'Vous n’avez plus accès à cet arbre.',
  TREE_MANAGEMENT_FORBIDDEN: 'Seul le propriétaire peut gérer les collaborateurs de cet arbre.',
  INVALID_EMAIL: 'Adresse email invalide.',
  ALREADY_COLLABORATOR: 'Cette personne collabore déjà sur cet arbre.',
  INVITATION_NOT_FOUND: 'Cette invitation n’existe plus.',
  INVITATION_EMAIL_MISMATCH: 'Cette invitation est adressée à un autre compte.',
  INVITATION_ALREADY_RESOLVED: 'Cette invitation a déjà été traitée.',
  INVITATION_EXPIRED: 'Ce lien d’invitation a expiré.',
  INVITATION_NOT_ACCEPTED: 'Cette invitation n’a pas encore été acceptée.',
}
