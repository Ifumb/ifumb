import Link from 'next/link'
import { LocalDateTime } from '@/presentation/components/ui/local-date-time'
import type {
  PendingChangeItemViewModel,
  PendingChangesViewModel,
} from '@/presentation/mappers/pending-change-view-models'

type PendingChangesProps = Readonly<{ list: PendingChangesViewModel }>

const STATUS_CLASS_NAMES: Readonly<Record<string, string>> = {
  true: 'bg-accent-light text-foreground',
  false: 'bg-earth-sand text-foreground',
}

export function PendingChangesView({ list }: PendingChangesProps) {
  return (
    <section aria-labelledby="pending-title" className="space-y-6">
      <p>
        <Link href={list.treeHref}>Retour à {list.treeName}</Link>
      </p>
      <h1 id="pending-title" className="text-3xl font-bold">
        {list.canReview ? `Modifications en attente — ${list.treeName}` : 'Mes propositions'}
      </h1>
      <p role="status">{list.status}</p>
      {list.items.length > 0 && (
        <ol className="space-y-4">
          {list.items.map((item) => (
            <PendingChangeItem key={item.id} item={item} />
          ))}
        </ol>
      )}
    </section>
  )
}

function PendingChangeItem({ item }: Readonly<{ item: PendingChangeItemViewModel }>) {
  return (
    <li className="space-y-2 rounded-lg border border-earth-sand bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">
          {item.title}, proposée par {item.authorName}
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-sm ${STATUS_CLASS_NAMES[String(item.isPending)]}`}
        >
          {item.statusLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        <LocalDateTime iso={item.createdAtIso} />
      </p>
      {item.changes.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th scope="col" className="text-left font-medium">
                Champ
              </th>
              <th scope="col" className="text-left font-medium">
                Avant
              </th>
              <th scope="col" className="text-left font-medium">
                Après
              </th>
            </tr>
          </thead>
          <tbody>
            {item.changes.map((change) => (
              <tr key={change.label}>
                <th scope="row" className="text-left font-normal">
                  {change.label}
                </th>
                <td>{change.before ?? '—'}</td>
                <td>{change.after ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </li>
  )
}
