import Link from 'next/link'
import { approvePendingChangeAction, rejectPendingChangeAction } from '@/app/actions/review-actions'
import { ApproveChangeForm } from '@/presentation/components/forms/approve-change-form'
import { RejectChangeForm } from '@/presentation/components/forms/reject-change-form'
import { LocalDateTime } from '@/presentation/components/ui/local-date-time'
import type {
  PendingChangeItemViewModel,
  PendingChangesViewModel,
} from '@/presentation/mappers/pending-change-view-models'
import type { ReviewResult } from '@/presentation/schemas/review-schema'

type PendingChangesProps = Readonly<{
  list: PendingChangesViewModel
  /** Named in the URL by `approvePendingChangeAction`/`rejectPendingChangeAction` on success —
   * the item they resolved has just left this very list, so the confirmation lives here instead,
   * in a region that survives that change. */
  reviewResult: ReviewResult | null
  bulkResult?: string | null
}>

const STATUS_CLASS_NAMES: Readonly<Record<string, string>> = {
  true: 'bg-accent-light text-foreground',
  false: 'bg-earth-sand text-foreground',
}

const REVIEW_RESULT_MESSAGES: Readonly<Record<ReviewResult, string>> = {
  approved: 'Modification approuvée et appliquée à l’arbre.',
  rejected: 'Modification rejetée.',
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function PendingChangesView({ list, reviewResult, bulkResult }: PendingChangesProps) {
  const pendingCount = list.items.filter((item) => item.isPending).length
  return (
    <section aria-labelledby="pending-title" className="space-y-6">
      <p>
        <Link href={list.treeHref}>Retour à {list.treeName}</Link>
      </p>
      <h1 id="pending-title" className="text-3xl font-bold">
        {list.canReview ? `Modifications en attente — ${list.treeName}` : 'Mes propositions'}
      </h1>
      <p role="status">
        {list.canReview && bulkResult && `${bulkResult} `}
        {reviewResult && `${REVIEW_RESULT_MESSAGES[reviewResult]} `}
        {list.status}
      </p>
      {list.canReview && pendingCount > 1 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href={`/tree/${list.treeId}/pending/approve-all`}>Tout approuver</Link>
          <Link href={`/tree/${list.treeId}/pending/reject-all`}>Tout rejeter</Link>
        </div>
      )}
      {list.items.length > 0 && (
        <ol className="space-y-4">
          {list.items.map((item) => (
            <PendingChangeItem
              key={item.id}
              item={item}
              treeId={list.treeId}
              canReview={list.canReview}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

type PendingChangeItemProps = Readonly<{
  item: PendingChangeItemViewModel
  treeId: string
  canReview: boolean
}>

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
function PendingChangeItem({ item, treeId, canReview }: PendingChangeItemProps) {
  const target = { treeId, pendingChangeId: item.id }
  return (
    <li className="space-y-3 rounded-lg border border-earth-sand bg-white p-4">
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
      {canReview && item.isPending && (
        <div className="flex flex-wrap gap-6 border-t border-earth-sand pt-3">
          <ApproveChangeForm
            action={approvePendingChangeAction.bind(null, target)}
            itemLabel={item.title}
          />
          <RejectChangeForm
            action={rejectPendingChangeAction.bind(null, target)}
            itemLabel={item.title}
          />
        </div>
      )}
    </li>
  )
}
