import type { AcceptSuggestionError } from '@/core/use-cases/accept-suggestion'
import type { ApproveConnectionRequestError } from '@/core/use-cases/approve-connection-request'
import type { ComputeSuggestionsResult } from '@/core/use-cases/compute-suggestions'
import type { RefuseConnectionRequestError } from '@/core/use-cases/refuse-connection-request'
import type { RejectSuggestionError } from '@/core/use-cases/reject-suggestion'
import type { TreeContributionError } from '@/core/use-cases/tree-contribution-access'
import type { TreeManagementError } from '@/core/use-cases/tree-management-access'
import type { TreeReadError } from '@/core/use-cases/tree-read-access'

export const SUGGESTION_ACCEPTED_MESSAGE = 'Correspondance acceptée : demande de connexion envoyée.'
export const SUGGESTION_REJECTED_MESSAGE = 'Suggestion rejetée.'
export const CONNECTION_REQUEST_APPROVED_MESSAGE = 'Demande de connexion approuvée : lien créé.'
export const CONNECTION_REQUEST_REFUSED_MESSAGE = 'Demande de connexion refusée.'

export function computeSuggestionsMessage(result: ComputeSuggestionsResult): string {
  return result.computed === 0
    ? 'Aucune nouvelle correspondance trouvée.'
    : `${result.computed} correspondance(s) trouvée(s).`
}

type CrossTreeErrorKind =
  | TreeReadError['kind']
  | TreeContributionError['kind']
  | TreeManagementError['kind']
  | AcceptSuggestionError['kind']
  | RejectSuggestionError['kind']
  | ApproveConnectionRequestError['kind']
  | RefuseConnectionRequestError['kind']

export const CROSS_TREE_ERRORS: Readonly<Record<CrossTreeErrorKind, string>> = {
  TREE_NOT_FOUND: 'Cet arbre n’existe plus.',
  AUTHENTICATION_REQUIRED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  ACCESS_DENIED: 'Vous n’avez pas accès à cet arbre.',
  TREE_CONTRIBUTION_FORBIDDEN:
    'Seuls le propriétaire de l’arbre et ses éditeurs peuvent gérer les suggestions.',
  TREE_MANAGEMENT_FORBIDDEN: 'Seul le propriétaire de l’arbre peut gérer les demandes de connexion.',
  SUGGESTION_NOT_FOUND: 'Cette suggestion n’existe plus.',
  SUGGESTION_ALREADY_RESOLVED: 'Cette suggestion a déjà été traitée.',
  CONNECTION_REQUEST_NOT_FOUND: 'Cette demande de connexion n’existe plus.',
  CONNECTION_REQUEST_ALREADY_RESOLVED: 'Cette demande de connexion a déjà été traitée.',
  CONNECTION_REQUEST_EXPIRED: 'Cette demande de connexion a expiré.',
}
