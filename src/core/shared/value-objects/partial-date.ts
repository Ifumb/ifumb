import { err, ok, type Result } from '@/core/shared/result'

export type DatePrecision = 'year' | 'month' | 'day'

export type InvalidPartialDate = { readonly kind: 'INVALID_PARTIAL_DATE' }

const PARTIAL_DATE_PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/

/**
 * reason: the legacy migration turned timestamp columns into text with a plain cast, which stores
 * values such as `1954-03-12 00:00:00`; only their day part is meaningful.
 */
const LEGACY_TIMESTAMP_PATTERN =
  /^(\d{4}-\d{2}-\d{2})[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}(?::?\d{2})?)?$/

const INVALID: InvalidPartialDate = { kind: 'INVALID_PARTIAL_DATE' }

/** A genealogical date known to the year, the month or the day. */
export class PartialDate {
  private constructor(
    readonly year: number,
    readonly month: number | null,
    readonly day: number | null,
  ) {
    Object.freeze(this)
  }

  /** Accepts `YYYY`, `YYYY-MM`, `YYYY-MM-DD` and the legacy timestamp text. */
  static parse(raw: string): Result<PartialDate, InvalidPartialDate> {
    const trimmed = raw.trim()
    const dayPart = LEGACY_TIMESTAMP_PATTERN.exec(trimmed)?.[1] ?? trimmed
    const match = PARTIAL_DATE_PATTERN.exec(dayPart)
    if (!match) return err(INVALID)

    const year = Number(match[1])
    const month = match[2] ? Number(match[2]) : null
    const day = match[3] ? Number(match[3]) : null
    if (!isExistingDate(year, month, day)) return err(INVALID)
    return ok(new PartialDate(year, month, day))
  }

  /** The stored form: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. */
  toString(): string {
    const pad = (value: number | null) => (value === null ? [] : [String(value).padStart(2, '0')])
    return [String(this.year).padStart(4, '0'), ...pad(this.month), ...pad(this.day)].join('-')
  }

  get precision(): DatePrecision {
    if (this.day !== null) return 'day'
    return this.month !== null ? 'month' : 'year'
  }
}

const FIRST_MONTH = 1
const LAST_MONTH = 12

function isExistingDate(year: number, month: number | null, day: number | null): boolean {
  if (month === null) return true
  if (month < FIRST_MONTH || month > LAST_MONTH) return false
  if (day === null) return true
  const candidate = new Date(Date.UTC(year, month - 1, day))
  return candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day
}
