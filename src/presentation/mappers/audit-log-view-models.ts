import { AUDIT_ACTIONS, type AuditFieldChange } from '@/core/entities/audit-change'
import type { AuditLogEntryView, AuditLogPage } from '@/core/use-cases/audit-log-views'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'
import { formatAuditValue } from '@/presentation/formatting/audit-value-format'
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_TONES,
  AUDIT_FIELD_LABELS,
  HIDDEN_AUDIT_FIELDS,
  type AuditTone,
} from '@/presentation/labels/audit-labels'
import {
  AUDIT_LOG_PARAMS as P,
  type AuditLogRequest,
} from '@/presentation/schemas/audit-log-schema'

export type HistoryHref = `/tree/${string}/history` | `/tree/${string}/history?${string}`

/** One field of an entry; `before` is null when it was set, `after` null when it was removed. */
export type AuditChangeViewModel = {
  readonly label: string
  readonly before: string | null
  readonly after: string | null
}

export type AuditEntryViewModel = {
  readonly id: string
  readonly actionLabel: string
  readonly tone: AuditTone
  readonly createdAtIso: string
  readonly authorName: string
  readonly changes: readonly AuditChangeViewModel[]
}

export type AuditLogViewModel = {
  readonly treeName: string
  readonly treeHref: `/tree/${string}`
  readonly action: HistoryHref
  readonly filters: { readonly action?: string; readonly from?: string; readonly to?: string }
  readonly actionOptions: readonly SelectOption[]
  readonly hasFilters: boolean
  readonly status: string
  readonly entries: readonly AuditEntryViewModel[]
  readonly olderHref: HistoryHref | null
  readonly newestHref: HistoryHref | null
}

const ACTION_OPTIONS = AUDIT_ACTIONS.map((action) => ({
  value: action,
  label: AUDIT_ACTION_LABELS[action],
}))

export function toAuditLogViewModel(
  page: AuditLogPage,
  request: AuditLogRequest,
): AuditLogViewModel {
  const { action, fromDay, toDay } = page.filter
  const filtersOnly = { action, fromDay, toDay }
  const hasFilters = Boolean(action || fromDay || toDay)
  return {
    treeName: page.tree.name,
    treeHref: `/tree/${page.tree.id}`,
    action: historyHref(page.tree.id, {}),
    filters: { action, from: fromDay, to: toDay },
    actionOptions: ACTION_OPTIONS,
    hasFilters,
    status: statusOf(page.entries.length, hasFilters),
    entries: page.entries.map(toAuditEntryViewModel),
    olderHref: page.nextCursor
      ? historyHref(page.tree.id, { ...filtersOnly, cursor: page.nextCursor })
      : null,
    newestHref: request.cursor ? historyHref(page.tree.id, filtersOnly) : null,
  }
}

function statusOf(count: number, hasFilters: boolean): string {
  if (count > 0) return `${count} entrée${count > 1 ? 's' : ''} affichée${count > 1 ? 's' : ''}.`
  return hasFilters
    ? 'Aucune entrée ne correspond à ces filtres.'
    : 'Aucune entrée dans le journal de cet arbre.'
}

export function toAuditEntryViewModel(entry: AuditLogEntryView): AuditEntryViewModel {
  return {
    id: entry.id,
    actionLabel: AUDIT_ACTION_LABELS[entry.action],
    tone: AUDIT_ACTION_TONES[entry.action],
    createdAtIso: entry.createdAt.toISOString(),
    authorName: [entry.author.firstName, entry.author.lastName].filter(Boolean).join(' '),
    changes: entry.changes.filter((change) => !HIDDEN_AUDIT_FIELDS.has(change.field)).map(toChange),
  }
}

/** Exported for `pending-change-view-models.ts`, which formats a proposal's diff the same way. */
export function toChange(change: AuditFieldChange): AuditChangeViewModel {
  const label = AUDIT_FIELD_LABELS[change.field] ?? change.field
  switch (change.kind) {
    case 'set':
      return { label, before: null, after: formatAuditValue(change.after, change.field) }
    case 'removed':
      return { label, before: formatAuditValue(change.before, change.field), after: null }
    case 'changed':
      return {
        label,
        before: formatAuditValue(change.before, change.field),
        after: formatAuditValue(change.after, change.field),
      }
  }
}

export function historyHref(treeId: string, request: AuditLogRequest): HistoryHref {
  const entries = [
    [P.action, request.action],
    [P.from, request.fromDay],
    [P.to, request.toDay],
    [P.cursor, request.cursor],
  ].flatMap(([key, value]) => (key && value ? [[key, value]] : []))
  const query = new URLSearchParams(entries).toString()
  return query ? `/tree/${treeId}/history?${query}` : `/tree/${treeId}/history`
}
