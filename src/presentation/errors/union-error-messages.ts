import type { AddUnionChildError } from '@/core/use-cases/add-union-child'
import type { CreateUnionError } from '@/core/use-cases/create-union'
import type { RemoveUnionChildError } from '@/core/use-cases/remove-union-child'
import type { UpdateUnionError } from '@/core/use-cases/update-union'
import type { UnionWriteError } from '@/core/use-cases/union-write-access'
import { SAME_PARENT_TWICE_MESSAGE } from '@/presentation/schemas/union-form-schema'

type Placement = { readonly field?: string; readonly message: string }

export const UNION_UNCHANGED_MESSAGE = 'Aucune modification à enregistrer.'
export const UNION_PROPOSED_MESSAGE =
  'Proposition envoyée au propriétaire de l’arbre, en attente de sa validation.'

export const childLinkedMessage = (name: string) =>
  `Lien ajouté : ${name} est enfant de cette union.`
export const childUnlinkedMessage = (name: string) => `Lien retiré entre cette union et ${name}.`

/** Why a union could not be written, before its own checks. */
export const UNION_WRITE_ERRORS: Readonly<Record<UnionWriteError['kind'], Placement>> = {
  TREE_NOT_FOUND: { message: 'Cet arbre n’existe plus.' },
  AUTHENTICATION_REQUIRED: { message: 'Votre session a expiré. Reconnectez-vous puis réessayez.' },
  ACCESS_DENIED: { message: 'Vous n’avez plus accès à cet arbre.' },
  UNION_MANAGEMENT_FORBIDDEN: {
    message: 'Seul le propriétaire de l’arbre peut modifier ses unions.',
  },
  UNION_NOT_FOUND: { message: 'Cette union n’existe plus.' },
}

const DETAILS_ERRORS = {
  PARENT_NOT_FOUND: { message: 'Un des parents choisis n’appartient plus à cet arbre.' },
  SAME_PARENT_TWICE: { field: 'parent2Id', message: SAME_PARENT_TWICE_MESSAGE },
  END_BEFORE_START: { field: 'endDate', message: 'La fin ne peut pas précéder le début' },
} as const

export const CREATE_UNION_ERRORS: Readonly<Record<CreateUnionError['kind'], Placement>> = {
  ...UNION_WRITE_ERRORS,
  ...DETAILS_ERRORS,
}

export const UPDATE_UNION_ERRORS: Readonly<Record<UpdateUnionError['kind'], Placement>> = {
  ...UNION_WRITE_ERRORS,
  ...DETAILS_ERRORS,
  FAMILY_CYCLE: {
    message: 'Un parent ne peut pas être un enfant de cette union, ni descendre de l’un d’eux.',
  },
}

export const ADD_UNION_CHILD_ERRORS: Readonly<Record<AddUnionChildError['kind'], Placement>> = {
  ...UNION_WRITE_ERRORS,
  CHILD_NOT_FOUND: { field: 'childId', message: 'Ce membre n’appartient plus à cet arbre' },
  CHILD_IS_PARENT: { field: 'childId', message: 'Ce membre est déjà parent dans cette union' },
  ALREADY_CHILD: { field: 'childId', message: 'Ce membre est déjà enfant de cette union' },
  FAMILY_CYCLE: {
    field: 'childId',
    message: 'Ce membre est un ancêtre d’un des parents : il ne peut pas être leur enfant',
  },
  SAME_PARENTS_UNION_EXISTS: {
    field: 'childId',
    message: 'Ce membre est déjà enfant d’une autre union de ces deux parents',
  },
}

export const REMOVE_UNION_CHILD_ERRORS: Readonly<Record<RemoveUnionChildError['kind'], Placement>> =
  {
    ...UNION_WRITE_ERRORS,
    NOT_A_CHILD: { message: 'Ce membre n’est plus rattaché à cette union.' },
  }
