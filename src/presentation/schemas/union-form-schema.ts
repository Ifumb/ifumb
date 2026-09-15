import { z } from 'zod'
import type { UnionDetailsEntry } from '@/core/use-cases/union-write-access'
import { dateFromEntries, datePartSchema } from '@/presentation/schemas/partial-date-fields'
import { searchTextParam } from '@/presentation/schemas/search-param-fields'

export const UNION_TYPES = ['MARRIAGE', 'PARTNERSHIP', 'BIOLOGICAL'] as const
export const FILIATIONS = ['BIOLOGICAL', 'ADOPTIVE', 'RECOGNIZED'] as const

export const SAME_PARENT_TWICE_MESSAGE = 'Choisissez deux parents différents'

const fieldsSchema = z.object({
  parent1Id: z.string().trim().min(1, 'Choisissez au moins un parent'),
  parent2Id: z
    .string()
    .trim()
    .transform((id) => id || null),
  type: z.enum(UNION_TYPES, { error: 'Choisissez un type d’union' }),
  startDay: datePartSchema,
  startMonth: datePartSchema,
  startYear: datePartSchema,
  endDay: datePartSchema,
  endMonth: datePartSchema,
  endYear: datePartSchema,
})

/**
 * The union form, as submitted: two parent choices, the second optional, a type and two dates
 * typed as day, month and year. Choosing the same member twice is reported on the second parent.
 */
export const unionFormSchema = fieldsSchema.transform((fields, context): UnionDetailsEntry => {
  const startDate = dateFromEntries(fields, 'start', context)
  const endDate = dateFromEntries(fields, 'end', context)
  if (fields.parent2Id === fields.parent1Id) {
    context.addIssue({ code: 'custom', path: ['parent2Id'], message: SAME_PARENT_TWICE_MESSAGE })
  }
  if (startDate === undefined || endDate === undefined || fields.parent2Id === fields.parent1Id) {
    return z.NEVER
  }
  const { parent1Id, parent2Id, type } = fields
  return { parent1Id, parent2Id, type, startDate, endDate }
})

/** The form linking a child to a union. */
export const unionChildFormSchema = z.object({
  childId: z.string().trim().min(1, 'Choisissez un membre'),
  filiation: z.enum(FILIATIONS, { error: 'Choisissez une filiation' }),
})

/** The member chosen to be unlinked, carried by the button that was pressed. */
export const unionChildRemovalSchema = z.object({ childId: z.string().trim().min(1) })

const newUnionParamsSchema = z.object({ parent: searchTextParam })

/** The member a new union starts from (`?parent=`), when the form was opened from a profile. */
export function parseNewUnionParent(searchParams: Record<string, string | string[] | undefined>) {
  return newUnionParamsSchema.parse(searchParams).parent ?? null
}
