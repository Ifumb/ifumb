import type { PartialDate } from '@/core/shared/value-objects/partial-date'

const LOCALE = 'fr-FR'
const monthYearFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const fullDateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long', timeZone: 'UTC' })

type FormatOptions = { readonly approximate?: boolean }

/** "1954", "mars 1954" or "12 mars 1954", prefixed with "vers" when approximate. */
export function formatPartialDate(date: PartialDate, options: FormatOptions = {}): string {
  const label = datePrecisionLabel(date)
  return options.approximate ? `vers ${label}` : label
}

/** "1932 – 2001", "1932 –" or "? – 2001"; null when neither year is known. */
export function lifespanLabel(birth: PartialDate | null, death: PartialDate | null): string | null {
  if (!birth && !death) return null
  return `${birth?.year ?? '?'} –${death ? ` ${death.year}` : ''}`
}

function datePrecisionLabel(date: PartialDate): string {
  const utc = new Date(Date.UTC(date.year, (date.month ?? 1) - 1, date.day ?? 1))
  switch (date.precision) {
    case 'year':
      return String(date.year)
    case 'month':
      return monthYearFormat.format(utc)
    case 'day':
      return fullDateFormat.format(utc)
  }
}
