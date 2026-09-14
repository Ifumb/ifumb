import 'server-only'
import {
  AUDIT_ACTIONS,
  type AuditAction,
  type AuditDiff,
  type AuditSnapshot,
  type AuditValue,
} from '@/core/entities/audit-change'
import type { AuditEntry } from '@/core/use-cases/audit-log-views'
import type { Prisma } from '@/infrastructure/persistence/prisma/generated/client'

export const AUDIT_ENTRY_ROW_INCLUDE = {
  author: { select: { firstName: true, lastName: true } },
} as const satisfies Prisma.AuditLogInclude

type AuditEntryRow = Prisma.AuditLogGetPayload<{ include: typeof AUDIT_ENTRY_ROW_INCLUDE }>

export function toAuditEntry(row: AuditEntryRow): AuditEntry {
  return {
    id: row.id,
    action: toAuditAction(row.action),
    targetType: row.targetType,
    targetId: row.targetId,
    author: row.author,
    createdAt: row.createdAt,
    diff: toAuditDiff(row.diff),
  }
}

function toAuditAction(action: string): AuditAction {
  const known = AUDIT_ACTIONS.find((candidate) => candidate === action)
  if (!known) throw new Error(`Unknown audit action ${action}`)
  return known
}

/**
 * reason: `diff` is free JSON written by the legacy app over several versions. Anything but an
 * object with `before` and `after` objects reads as "nothing recorded" rather than failing the page.
 */
export function toAuditDiff(json: Prisma.JsonValue): AuditDiff {
  if (!isJsonObject(json)) return { before: null, after: null }
  return { before: toSnapshot(json.before), after: toSnapshot(json.after) }
}

function toSnapshot(json: Prisma.JsonValue | undefined): AuditSnapshot | null {
  if (json === undefined || !isJsonObject(json)) return null
  return Object.fromEntries(
    Object.entries(json).map(([field, value]) => [field, toAuditValue(value)]),
  )
}

/** Scalars are kept as they are; nested arrays and objects are kept as their JSON text. */
function toAuditValue(json: Prisma.JsonValue | undefined): AuditValue {
  if (json === undefined || json === null) return null
  return typeof json === 'object' ? JSON.stringify(json) : json
}

function isJsonObject(json: Prisma.JsonValue): json is Prisma.JsonObject {
  return typeof json === 'object' && json !== null && !Array.isArray(json)
}
