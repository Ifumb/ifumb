import type { UpdateTreeError } from '@/core/use-cases/update-tree'

export const TREE_UPDATED_MESSAGE = 'Les modifications de l’arbre ont été enregistrées.'

export const TREE_UNCHANGED_MESSAGE = 'Aucune modification à enregistrer.'

export const TOO_MANY_TREE_WRITES_MESSAGE =
  'Trop de modifications en peu de temps. Patientez quelques minutes avant de réessayer.'

export const WRITES_DISABLED_MESSAGE =
  'Les enregistrements sont désactivés sur cet environnement : aucune donnée n’a été modifiée.'

export const UPDATE_TREE_ERRORS: Readonly<Record<UpdateTreeError['kind'], string>> = {
  TREE_NOT_FOUND: 'Cet arbre n’existe plus.',
  AUTHENTICATION_REQUIRED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  ACCESS_DENIED: 'Vous n’avez plus accès à cet arbre.',
  TREE_MANAGEMENT_FORBIDDEN: 'Seul le propriétaire peut modifier cet arbre.',
}
