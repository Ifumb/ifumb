import type { PartialDate } from '@/core/shared/value-objects/partial-date'

/**
 * False only when the death is certainly before the birth, whatever the unknown parts may be.
 * reason: the legacy check padded missing parts with the first day, and so refused a birth in
 * "1950-06" with a death in "1950", which may well be in order.
 */
export function datesInOrder(birth: PartialDate | null, death: PartialDate | null): boolean {
  if (!birth || !death) return true
  return lastPossibleDay(death) >= firstPossibleDay(birth)
}

function firstPossibleDay({ year, month, day }: PartialDate): number {
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1)
}

function lastPossibleDay({ year, month, day }: PartialDate): number {
  if (day !== null && month !== null) return Date.UTC(year, month - 1, day)
  // Day 0 of the following month is the last day of this one.
  return month === null ? Date.UTC(year, 11, 31) : Date.UTC(year, month, 0)
}
