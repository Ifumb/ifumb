import type { MemberSummary } from '@/core/use-cases/member-views'
import type { UnionDetails } from '@/core/use-cases/union-views'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'
import { lifespanLabel } from '@/presentation/formatting/partial-date-format'
import type { SubmitLabels } from '@/presentation/forms/form-fields'
import { FILIATION_LABELS, UNION_TYPE_LABELS } from '@/presentation/labels/member-labels'
import { FILIATIONS, UNION_TYPES } from '@/presentation/schemas/union-form-schema'
import { partialDateParts } from '@/presentation/schemas/partial-date-fields'

/** The union form's entries, as text: what the inputs show and what is echoed back on error. */
export type UnionFormValues = Readonly<Record<string, string>>

export const PARENT1_FIELD = {
  name: 'parent1Id',
  label: 'Parent 1',
  placeholder: 'Choisir un membre',
} as const
export const PARENT2_FIELD = { name: 'parent2Id', label: 'Parent 2', placeholder: 'Parent inconnu' }
export const UNION_TYPE_FIELD = { name: 'type', label: 'Type d’union' } as const
export const START_DATE_FIELD = { name: 'startDate', prefix: 'start', label: 'Début' } as const
export const END_DATE_FIELD = { name: 'endDate', prefix: 'end', label: 'Fin' } as const

const TYPE_HINTS: Readonly<Record<(typeof UNION_TYPES)[number], string>> = {
  MARRIAGE: 'Union célébrée, qu’elle soit civile, religieuse ou coutumière.',
  PARTNERSHIP: 'Couple non marié.',
  BIOLOGICAL: 'Deux parents d’un même enfant, sans union de couple.',
}

export const UNION_TYPE_OPTIONS = UNION_TYPES.map((value) => ({
  value,
  label: UNION_TYPE_LABELS[value],
  hint: TYPE_HINTS[value],
}))

/** Every field, in the order of the form, for the error summary's links. */
export const UNION_FORM_FIELDS = [
  PARENT1_FIELD,
  PARENT2_FIELD,
  UNION_TYPE_FIELD,
  START_DATE_FIELD,
  END_DATE_FIELD,
]

/** The names of every submitted entry, dates being split in three. */
export const UNION_FORM_ENTRIES = ['parent1Id', 'parent2Id', 'type'].concat(
  ['start', 'end'].flatMap((prefix) => ['Day', 'Month', 'Year'].map((p) => prefix + p)),
)

export const CHILD_FIELD = { name: 'childId', label: 'Enfant', placeholder: 'Choisir un membre' }
export const FILIATION_FIELD = { name: 'filiation', label: 'Filiation' } as const
export const FILIATION_OPTIONS = FILIATIONS.map((value) => ({
  value,
  label: FILIATION_LABELS[value],
}))

/** A member as a choice in a list: the name, with the lifespan to tell namesakes apart. */
export function memberOption(member: MemberSummary): SelectOption {
  const name = [member.firstName, member.lastName].filter(Boolean).join(' ')
  const lifespan = lifespanLabel(member.birthDate, member.deathDate)
  return { value: member.id, label: lifespan ? `${name} (${lifespan})` : name }
}

/** A new union, its first parent chosen already when the form was opened from a member. */
export function newUnionValues(parentId: string | null): UnionFormValues {
  return { type: 'BIOLOGICAL', parent1Id: parentId ?? '' }
}

export function unionFormValues(union: UnionDetails): UnionFormValues {
  const [start, end] = [partialDateParts(union.startDate), partialDateParts(union.endDate)]
  const [parent1Id, parent2Id] = [union.parent1Id, union.parent2Id].filter(Boolean)
  return {
    parent1Id: parent1Id ?? '',
    parent2Id: parent2Id ?? '',
    type: union.type,
    ...{ startDay: start.day, startMonth: start.month, startYear: start.year },
    ...{ endDay: end.day, endMonth: end.month, endYear: end.year },
  }
}

export const CREATE_UNION_SUBMIT: SubmitLabels = {
  label: 'Créer l’union',
  pendingLabel: 'Création…',
}

export const UPDATE_UNION_SUBMIT: SubmitLabels = {
  label: 'Enregistrer les modifications',
  pendingLabel: 'Enregistrement…',
}
