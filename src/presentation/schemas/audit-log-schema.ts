import { z } from 'zod'
import { AUDIT_ACTIONS, type AuditAction } from '@/core/entities/audit-change'
import { firstValue } from '@/presentation/schemas/search-param-fields'

type SearchParams = Record<string, string | string[] | undefined>

export type AuditLogRequest = {
  readonly action?: AuditAction
  readonly fromDay?: string
  readonly toDay?: string
  readonly cursor?: string
}

/** Query parameter names of the history page. */
export const AUDIT_LOG_PARAMS = {
  action: 'action',
  from: 'from',
  to: 'to',
  cursor: 'before',
} as const

const CURSOR_MAX_LENGTH = 200
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const dayParam = z
  .preprocess(firstValue, z.string().regex(DAY_PATTERN).refine(isRealDay).optional())
  .catch(undefined)

const P = AUDIT_LOG_PARAMS
const auditLogSchema = z.object({
  [P.action]: z.preprocess(firstValue, z.enum(AUDIT_ACTIONS).optional()).catch(undefined),
  [P.from]: dayParam,
  [P.to]: dayParam,
  [P.cursor]: z
    .preprocess(firstValue, z.string().min(1).max(CURSOR_MAX_LENGTH).optional())
    .catch(undefined),
})

/** The history page described by the URL; anything unreadable is simply left out. */
export function parseAuditLogRequest(searchParams: SearchParams): AuditLogRequest {
  const { action, from, to, before } = auditLogSchema.parse(searchParams)
  return {
    ...(action && { action }),
    ...(from && { fromDay: from }),
    ...(to && { toDay: to }),
    ...(before && { cursor: before }),
  }
}

/** Rejects days that match the pattern but do not exist, such as 2026-02-30. */
function isRealDay(day: string): boolean {
  const date = new Date(`${day}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(day)
}
