import type { Certainty, Gender } from '@/core/entities/member'
import type { Filiation, UnionType } from '@/core/entities/union'

/** Labels carried over from the legacy member profile and union forms. */
export const GENDER_LABELS: Readonly<Record<Gender, string>> = {
  MALE: 'Masculin',
  FEMALE: 'Féminin',
  OTHER: 'Autre',
  UNKNOWN: 'Inconnu',
}

export const CERTAINTY_LABELS: Readonly<Record<Certainty, string>> = {
  CONFIRMED: 'Confirmée',
  APPROXIMATE: 'Approximative',
  UNKNOWN: 'Inconnue',
}

export const UNION_TYPE_LABELS: Readonly<Record<UnionType, string>> = {
  MARRIAGE: 'Mariage',
  PARTNERSHIP: 'Union libre',
  BIOLOGICAL: 'Lien biologique',
}

export const FILIATION_LABELS: Readonly<Record<Filiation, string>> = {
  BIOLOGICAL: 'Biologique',
  ADOPTIVE: 'Adoptif',
  RECOGNIZED: 'Reconnu légalement',
}

export const NOT_RECORDED = 'Non renseigné'
