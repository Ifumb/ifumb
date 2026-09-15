import type { AuditValue } from '@/core/entities/audit-change'
import { PartialDate } from '@/core/shared/value-objects/partial-date'
import { formatPartialDate } from '@/presentation/formatting/partial-date-format'
import { AUDIT_FIELD_VALUE_LABELS, AUDIT_VALUE_LABELS } from '@/presentation/labels/audit-labels'
import { NOT_RECORDED } from '@/presentation/labels/member-labels'

const LOCALE = 'fr-FR'
const dateTimeFormat = (timeZone?: string) =>
  new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long', timeStyle: 'short', timeZone })

/**
 * A recorded value as a reader sees it. Dates recorded as text (with or without a time) read as
 * dates at their own precision: the legacy page showed "1954-01-01" as a bare "1954". A field with
 * labels of its own reads them first: `BIOLOGICAL` is a union type or a filiation.
 */
export function formatAuditValue(value: AuditValue, field?: string): string {
  if (value === null || value === '') return NOT_RECORDED
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'number') return String(value)
  // A photo is stored by its address, which means nothing to a reader of the history.
  if (field === 'photoUrl') return 'Enregistrée'
  const fieldLabel = field === undefined ? undefined : AUDIT_FIELD_VALUE_LABELS[field]?.[value]
  if (fieldLabel) return fieldLabel
  const date = PartialDate.parse(value)
  if (date.ok) return formatPartialDate(date.value)
  return AUDIT_VALUE_LABELS[value] ?? value
}

/** "1 mars 2026 à 10:20", in the given time zone; the runtime's own when absent. */
export function formatDateTime(iso: string, timeZone?: string): string {
  return dateTimeFormat(timeZone).format(new Date(iso))
}
