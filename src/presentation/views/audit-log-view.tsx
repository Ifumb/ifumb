import Form from 'next/form'
import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { DateField } from '@/presentation/components/ui/date-field'
import { LabelledSelect } from '@/presentation/components/ui/labelled-select'
import { LocalDateTime } from '@/presentation/components/ui/local-date-time'
import type { AuditTone } from '@/presentation/labels/audit-labels'
import type {
  AuditChangeViewModel,
  AuditEntryViewModel,
  AuditLogViewModel,
} from '@/presentation/mappers/audit-log-view-models'
import { AUDIT_LOG_PARAMS as P } from '@/presentation/schemas/audit-log-schema'

type LogProps = Readonly<{ log: AuditLogViewModel }>

const TONE_CLASS_NAMES: Readonly<Record<AuditTone, string>> = {
  creation: 'bg-forest text-earth-ivory',
  update: 'bg-accent-light text-foreground',
  deletion: 'bg-brand-dark text-earth-ivory',
}

export function AuditLogView({ log }: LogProps) {
  return (
    <section aria-labelledby="history-title" className="space-y-6">
      <p>
        <Link href={log.treeHref}>Retour à {log.treeName}</Link>
      </p>
      <h1 id="history-title" className="text-3xl font-bold">
        Journal — {log.treeName}
      </h1>
      <AuditLogFilters log={log} />
      <p role="status">{log.status}</p>
      {log.entries.length > 0 && (
        <ol className="space-y-3">
          {log.entries.map((entry) => (
            <AuditEntryItem key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
      <AuditLogPagination log={log} />
    </section>
  )
}

function AuditLogFilters({ log }: LogProps) {
  return (
    <Form action={log.action} className="flex flex-wrap items-end gap-3">
      <LabelledSelect
        id="history-action"
        name={P.action}
        label="Type d’action"
        placeholder="Toutes les actions"
        options={log.actionOptions}
        defaultValue={log.filters.action}
      />
      <DayRangeFields log={log} />
      <Button type="submit" variant="secondary">
        Filtrer
      </Button>
      {log.hasFilters && <ResetLink href={log.action} />}
    </Form>
  )
}

function ResetLink({ href }: Readonly<{ href: AuditLogViewModel['action'] }>) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center">
      Réinitialiser
    </Link>
  )
}

/** Days are calendar days in UTC, both included. */
function DayRangeFields({ log }: LogProps) {
  return (
    <>
      <DateField
        id="history-from"
        name={P.from}
        label="Depuis le"
        defaultValue={log.filters.from}
      />
      <DateField id="history-to" name={P.to} label="Jusqu’au" defaultValue={log.filters.to} />
    </>
  )
}

function AuditEntryItem({ entry }: Readonly<{ entry: AuditEntryViewModel }>) {
  return (
    <li className="space-y-2 rounded-lg border border-earth-sand bg-white p-4">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`rounded-full px-2 text-sm font-semibold ${TONE_CLASS_NAMES[entry.tone]}`}>
          {entry.actionLabel}
        </span>
        <LocalDateTime iso={entry.createdAtIso} />
        <span>par {entry.authorName}</span>
      </p>
      {entry.changes.length > 0 && (
        <ul className="space-y-1 text-sm">
          {entry.changes.map((change) => (
            <AuditChangeItem key={change.label} change={change} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** Each change reads as a sentence: the arrow is decorative, its meaning is spelled out. */
function AuditChangeItem({ change }: Readonly<{ change: AuditChangeViewModel }>) {
  return (
    <li>
      <span className="font-medium">{change.label} : </span>
      {change.before !== null && (
        <span className={change.after === null ? 'line-through' : ''}>{change.before}</span>
      )}
      {change.before !== null && change.after === null && (
        <span className="sr-only"> (supprimé)</span>
      )}
      {change.before !== null && change.after !== null && (
        <>
          <span aria-hidden="true"> → </span>
          <span className="sr-only"> remplacé par </span>
        </>
      )}
      {change.after !== null && <span className="font-semibold">{change.after}</span>}
    </li>
  )
}

function AuditLogPagination({ log }: LogProps) {
  if (!log.olderHref && !log.newestHref) return null
  return (
    <nav aria-label="Pagination du journal" className="flex flex-wrap justify-center gap-6">
      {log.newestHref && <Link href={log.newestHref}>Revenir aux plus récentes</Link>}
      {log.olderHref && <Link href={log.olderHref}>Entrées plus anciennes</Link>}
    </nav>
  )
}
