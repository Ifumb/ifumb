import type { ClaimMemberError } from '@/core/use-cases/claim-member'

export const CLAIM_ERRORS: Readonly<Record<ClaimMemberError['kind'], string>> = {
  TREE_NOT_FOUND: 'Cet arbre n’existe plus.',
  AUTHENTICATION_REQUIRED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  ACCESS_DENIED: 'Vous n’avez plus accès à cet arbre.',
  MEMBER_NOT_FOUND: 'Ce membre n’existe plus.',
  ALREADY_CLAIMED: 'Cette fiche a déjà été revendiquée par quelqu’un d’autre.',
  ALREADY_CLAIMED_ELSEWHERE: 'Vous avez déjà revendiqué une fiche dans un autre arbre.',
}
