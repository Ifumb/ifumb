import type { MemberDetails } from '@/core/use-cases/member-views'
import type { SubmitLabels } from '@/presentation/forms/form-fields'
import { CERTAINTY_LABELS, GENDER_LABELS } from '@/presentation/labels/member-labels'
import { CERTAINTIES, GENDERS } from '@/presentation/schemas/member-form-schema'
import { partialDateParts } from '@/presentation/schemas/partial-date-fields'

/** The member form's entries, as text: what the inputs show and what is echoed back on error. */
export type MemberFormValues = Readonly<Record<string, string>>

export type TextFieldSpec = {
  readonly name: string
  readonly label: string
  readonly autoComplete: string
  readonly required?: boolean
}

const text = (name: string, label: string, autoComplete = 'off'): TextFieldSpec => ({
  name,
  label,
  autoComplete,
  required: false,
})

export const MEMBER_FIELD_SPECS = {
  firstName: { ...text('firstName', 'Prénom'), required: true },
  lastName: text('lastName', 'Nom'),
  nickname: text('nickname', 'Surnom'),
  birthPlace: text('birthPlace', 'Lieu de naissance'),
  tribe: text('tribe', 'Tribu'),
  clan: text('clan', 'Clan'),
  ethnicity: text('ethnicity', 'Ethnie'),
  originRegion: text('originRegion', 'Région d’origine'),
} as const

export const GENDER_FIELD = {
  name: 'gender',
  label: 'Genre',
  placeholder: 'Non renseigné',
} as const
export const CERTAINTY_FIELD = { name: 'certainty', label: 'Certitude des informations' } as const
export const BIRTH_DATE_FIELD = { name: 'birthDate', prefix: 'birth', label: 'Date de naissance' }
export const DEATH_DATE_FIELD = { name: 'deathDate', prefix: 'death', label: 'Date de décès' }
export const BIRTH_APPROX_FIELD = {
  name: 'birthDateApprox',
  label: 'Date de naissance approximative',
}
export const BIOGRAPHY_FIELD = {
  name: 'biography',
  label: 'Biographie',
  hint: 'Facultatif : parcours, métiers, anecdotes transmises…',
} as const

export const DATE_HINT = 'Laissez vides les parties inconnues : l’année seule suffit.'

export const GENDER_OPTIONS = GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] }))
export const CERTAINTY_OPTIONS = CERTAINTIES.map((value) => ({
  value,
  label: CERTAINTY_LABELS[value],
}))

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, index, 1)),
  ),
}))

/** Every field, in the order of the form, for the error summary's links. */
export const MEMBER_FORM_FIELDS = [
  MEMBER_FIELD_SPECS.firstName,
  MEMBER_FIELD_SPECS.lastName,
  MEMBER_FIELD_SPECS.nickname,
  GENDER_FIELD,
  CERTAINTY_FIELD,
  BIRTH_DATE_FIELD,
  BIRTH_APPROX_FIELD,
  DEATH_DATE_FIELD,
  MEMBER_FIELD_SPECS.birthPlace,
  MEMBER_FIELD_SPECS.tribe,
  MEMBER_FIELD_SPECS.clan,
  MEMBER_FIELD_SPECS.ethnicity,
  MEMBER_FIELD_SPECS.originRegion,
  BIOGRAPHY_FIELD,
]

/** The names of every submitted entry, dates being split in three. */
export const MEMBER_FORM_ENTRIES = [
  ...Object.keys(MEMBER_FIELD_SPECS),
  'gender',
  'certainty',
  'birthDay',
  'birthMonth',
  'birthYear',
  'birthDateApprox',
  'deathDay',
  'deathMonth',
  'deathYear',
  'biography',
]

export const NEW_MEMBER_VALUES: MemberFormValues = { certainty: 'CONFIRMED' }

export function memberFormValues(member: MemberDetails): MemberFormValues {
  const [birth, death] = [partialDateParts(member.birthDate), partialDateParts(member.deathDate)]
  const texts = Object.keys(MEMBER_FIELD_SPECS).map((name) => [
    name,
    member[name as keyof typeof MEMBER_FIELD_SPECS] ?? '',
  ])
  return {
    ...Object.fromEntries(texts),
    gender: member.gender ?? '',
    certainty: member.certainty,
    ...{ birthDay: birth.day, birthMonth: birth.month, birthYear: birth.year },
    ...{ deathDay: death.day, deathMonth: death.month, deathYear: death.year },
    birthDateApprox: member.birthDateApprox ? 'on' : '',
    biography: member.biography ?? '',
  }
}

export const CREATE_MEMBER_SUBMIT: SubmitLabels = {
  label: 'Ajouter le membre',
  pendingLabel: 'Ajout…',
}

export const UPDATE_MEMBER_SUBMIT: SubmitLabels = {
  label: 'Enregistrer les modifications',
  pendingLabel: 'Enregistrement…',
}
