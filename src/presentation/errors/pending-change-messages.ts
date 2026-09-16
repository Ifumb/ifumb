import type { ApprovePendingChangeError } from '@/core/use-cases/approve-pending-change'
import type { RejectPendingChangeError } from '@/core/use-cases/reject-pending-change'

type Placement = { readonly field?: string; readonly message: string }

export const CHANGE_APPROVED_MESSAGE = 'Modification approuvée et appliquée à l’arbre.'
export const CHANGE_REJECTED_MESSAGE = 'Modification rejetée.'

type ReviewErrorKind = ApprovePendingChangeError['kind'] | RejectPendingChangeError['kind']

/** Why a proposal could not be reviewed. */
export const REVIEW_ERRORS: Readonly<Record<ReviewErrorKind, Placement>> = {
  TREE_NOT_FOUND: { message: 'Cet arbre n’existe plus.' },
  AUTHENTICATION_REQUIRED: { message: 'Votre session a expiré. Reconnectez-vous puis réessayez.' },
  ACCESS_DENIED: { message: 'Vous n’avez plus accès à cet arbre.' },
  REVIEW_FORBIDDEN: { message: 'Seul le propriétaire de l’arbre peut revoir les propositions.' },
  PENDING_CHANGE_NOT_FOUND: { message: 'Cette proposition n’existe plus.' },
  ALREADY_RESOLVED: { message: 'Cette proposition a déjà été traitée.' },
  CHANGE_OUTDATED: {
    message:
      'L’état de la fiche a changé depuis cette proposition : relisez-la avant de la traiter.',
  },
  PROPOSAL_UNREADABLE: { message: 'Cette proposition est illisible et ne peut pas être appliquée.' },
  DEATH_BEFORE_BIRTH: { message: 'La proposition indique un décès avant la naissance.' },
  PARENT_NOT_FOUND: { message: 'Un des parents proposés n’appartient plus à cet arbre.' },
  SAME_PARENT_TWICE: { message: 'La proposition indique deux fois le même parent.' },
  END_BEFORE_START: { message: 'La proposition indique une fin avant le début.' },
  FAMILY_CYCLE: { message: 'La proposition créerait un cycle dans la famille.' },
}
