import { z } from 'zod'
import { PartialDate } from '@/core/shared/value-objects/partial-date'

/** A date typed in three separate fields, any of which may be left empty. */
export type PartialDateParts = {
  readonly day: string
  readonly month: string
  readonly year: string
}

export const DATE_PART_MESSAGES = {
  yearFormat: 'L’année doit comporter quatre chiffres',
  yearRequired: 'L’année est requise si vous indiquez un jour ou un mois',
  monthRequired: 'Le mois est requis si vous indiquez un jour',
  impossible: 'Cette date n’existe pas',
} as const

const YEAR_PATTERN = /^\d{4}$/
const NUMBER_PATTERN = /^\d{1,2}$/

/** The date the parts describe, null when all are empty, or the message explaining the problem. */
export function composePartialDate(
  parts: PartialDateParts,
): { readonly date: PartialDate | null } | { readonly message: string } {
  const [day, month, year] = [parts.day.trim(), parts.month.trim(), parts.year.trim()]
  if (!day && !month && !year) return { date: null }
  if (!year) return { message: DATE_PART_MESSAGES.yearRequired }
  if (!YEAR_PATTERN.test(year)) return { message: DATE_PART_MESSAGES.yearFormat }
  if (day && !month) return { message: DATE_PART_MESSAGES.monthRequired }
  const numbers = [month, day].filter(Boolean)
  if (!numbers.every((part) => NUMBER_PATTERN.test(part))) {
    return { message: DATE_PART_MESSAGES.impossible }
  }
  const parsed = PartialDate.parse(
    [year, ...numbers.map((part) => part.padStart(2, '0'))].join('-'),
  )
  return parsed.ok ? { date: parsed.value } : { message: DATE_PART_MESSAGES.impossible }
}

/** The three fields of a stored date, as the form shows them. */
export function partialDateParts(date: PartialDate | null): PartialDateParts {
  return {
    day: date?.day ? String(date.day) : '',
    month: date?.month ? String(date.month) : '',
    year: date ? String(date.year) : '',
  }
}

export const datePartSchema = z.string().max(4, DATE_PART_MESSAGES.impossible)
