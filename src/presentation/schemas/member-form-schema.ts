import { z } from 'zod'
import { MEMBER_TEXT_LIMITS, type MemberDetailsInput } from '@/core/entities/member'
import { dateFromEntries, datePartSchema } from '@/presentation/schemas/partial-date-fields'

export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const
export const CERTAINTIES = ['CONFIRMED', 'APPROXIMATE', 'UNKNOWN'] as const

const tooLong = (limit: number) => `Ce champ ne peut pas dépasser ${limit} caractères`

const optionalText = (field: Exclude<keyof typeof MEMBER_TEXT_LIMITS, 'firstName'>) =>
  z
    .string()
    .trim()
    .max(MEMBER_TEXT_LIMITS[field], tooLong(MEMBER_TEXT_LIMITS[field]))
    .transform((text) => text || null)

const fieldsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Le prénom est requis')
    .max(MEMBER_TEXT_LIMITS.firstName, tooLong(MEMBER_TEXT_LIMITS.firstName)),
  lastName: optionalText('lastName'),
  nickname: optionalText('nickname'),
  gender: z
    .enum([...GENDERS, ''], { error: 'Choisissez un genre' })
    .transform((gender) => gender || null),
  certainty: z.enum(CERTAINTIES, { error: 'Choisissez un niveau de certitude' }),
  birthDay: datePartSchema,
  birthMonth: datePartSchema,
  birthYear: datePartSchema,
  birthDateApprox: z.string().transform((checked) => checked === 'on'),
  deathDay: datePartSchema,
  deathMonth: datePartSchema,
  deathYear: datePartSchema,
  birthPlace: optionalText('birthPlace'),
  tribe: optionalText('tribe'),
  clan: optionalText('clan'),
  ethnicity: optionalText('ethnicity'),
  originRegion: optionalText('originRegion'),
  biography: optionalText('biography'),
})

type MemberFields = z.infer<typeof fieldsSchema>

/**
 * The member form, as submitted: flat text entries in, the details of a member out. A date is typed
 * as day, month and year; its problems are reported on the date as a whole.
 */
export const memberFormSchema = fieldsSchema.transform((fields, context): MemberDetailsInput => {
  const birthDate = dateFromEntries(fields, 'birth', context)
  const deathDate = dateFromEntries(fields, 'death', context)
  if (birthDate === undefined || deathDate === undefined) return z.NEVER
  return {
    ...pickTexts(fields),
    gender: fields.gender,
    certainty: fields.certainty,
    birthDate,
    birthDateApprox: fields.birthDateApprox,
    deathDate,
  }
})

function pickTexts({ firstName, lastName, nickname, birthPlace, ...rest }: MemberFields) {
  const { tribe, clan, ethnicity, originRegion, biography } = rest
  return {
    firstName,
    lastName,
    nickname,
    birthPlace,
    tribe,
    clan,
    ethnicity,
    originRegion,
    biography,
  }
}
