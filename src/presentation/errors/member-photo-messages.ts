import type { ChangeMemberPhotoError } from '@/core/use-cases/change-member-photo'
import { MEMBER_WRITE_ERRORS } from '@/presentation/errors/member-error-messages'
import {
  PHOTO_REQUIRED_MESSAGE,
  PHOTO_TOO_LARGE_MESSAGE,
} from '@/presentation/schemas/member-photo-schema'

type Placement = { readonly field?: string; readonly message: string }

export const PHOTO_FIELD = { name: 'photo', label: 'Nouvelle photo' } as const

export const PHOTO_HINT =
  'JPEG, PNG ou WebP, 5 Mo au maximum. ' +
  'Les informations cachées de la photo, comme le lieu de prise de vue, sont retirées.'

export const PHOTO_SAVED_MESSAGE = 'La photo a été enregistrée.'
export const PHOTO_REMOVED_MESSAGE = 'La photo a été retirée.'
export const NO_PHOTO_MESSAGE = 'Ce membre n’a pas de photo à retirer.'
export const TOO_MANY_PHOTOS_MESSAGE =
  'Trop de photos envoyées en peu de temps. Patientez avant d’en envoyer une autre.'

export const PHOTO_STORAGE_UNAVAILABLE_MESSAGE =
  'Les photos ne peuvent pas être enregistrées sur cet environnement : aucun stockage n’est configuré.'

export const CHANGE_MEMBER_PHOTO_ERRORS: Readonly<
  Record<ChangeMemberPhotoError['kind'], Placement>
> = {
  ...MEMBER_WRITE_ERRORS,
  PHOTO_EMPTY: { field: PHOTO_FIELD.name, message: PHOTO_REQUIRED_MESSAGE },
  PHOTO_TOO_LARGE: { field: PHOTO_FIELD.name, message: PHOTO_TOO_LARGE_MESSAGE },
  PHOTO_FORMAT_UNSUPPORTED: {
    field: PHOTO_FIELD.name,
    message: 'Choisissez une photo au format JPEG, PNG ou WebP',
  },
  PHOTO_UNREADABLE: {
    field: PHOTO_FIELD.name,
    message: 'Cette image ne peut pas être lue : essayez une autre photo',
  },
  PHOTO_STORAGE_UNAVAILABLE: { message: PHOTO_STORAGE_UNAVAILABLE_MESSAGE },
}
