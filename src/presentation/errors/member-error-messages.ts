import type { CreateMemberError } from '@/core/use-cases/create-member'
import type { MemberWriteError } from '@/core/use-cases/member-write-access'
import type { UpdateMemberError } from '@/core/use-cases/update-member'

type Placement = { readonly field?: string; readonly message: string }

export const MEMBER_UNCHANGED_MESSAGE = 'Aucune modification à enregistrer.'

const SESSION_EXPIRED = 'Votre session a expiré. Reconnectez-vous puis réessayez.'
const NO_ACCESS = 'Vous n’avez plus accès à cet arbre.'
const OWNER_ONLY = 'Seul le propriétaire de l’arbre peut ajouter ou supprimer un membre.'

const DEATH_BEFORE_BIRTH: Placement = {
  field: 'deathDate',
  message: 'La date de décès ne peut pas précéder la date de naissance',
}

export const CREATE_MEMBER_ERRORS: Readonly<Record<CreateMemberError['kind'], Placement>> = {
  TREE_NOT_FOUND: { message: 'Cet arbre n’existe plus.' },
  AUTHENTICATION_REQUIRED: { message: SESSION_EXPIRED },
  ACCESS_DENIED: { message: NO_ACCESS },
  MEMBER_MANAGEMENT_FORBIDDEN: { message: OWNER_ONLY },
  DEATH_BEFORE_BIRTH,
}

/** Why a member could not be deleted, or edited before its own checks. */
export const MEMBER_WRITE_ERRORS: Readonly<Record<MemberWriteError['kind'], Placement>> = {
  TREE_NOT_FOUND: { message: 'Cet arbre n’existe plus.' },
  AUTHENTICATION_REQUIRED: { message: SESSION_EXPIRED },
  ACCESS_DENIED: { message: NO_ACCESS },
  MEMBER_NOT_FOUND: { message: 'Ce membre n’existe plus.' },
  MEMBER_EDIT_FORBIDDEN: { message: 'Vous ne pouvez pas modifier ce membre.' },
  MEMBER_MANAGEMENT_FORBIDDEN: { message: OWNER_ONLY },
}

export const UPDATE_MEMBER_ERRORS: Readonly<Record<UpdateMemberError['kind'], Placement>> = {
  ...MEMBER_WRITE_ERRORS,
  DEATH_BEFORE_BIRTH,
}
