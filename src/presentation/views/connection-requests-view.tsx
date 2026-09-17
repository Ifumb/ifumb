import Link from 'next/link'
import {
  approveConnectionRequestAction,
  refuseConnectionRequestAction,
} from '@/app/actions/cross-tree-actions'
import { ApproveConnectionRequestForm } from '@/presentation/components/forms/approve-connection-request-form'
import { RefuseConnectionRequestForm } from '@/presentation/components/forms/refuse-connection-request-form'
import { LocalDateTime } from '@/presentation/components/ui/local-date-time'
import type { ConnectionRequestItemViewModel } from '@/presentation/mappers/connection-request-view-models'
import type { ConnectionRequestResult } from '@/presentation/schemas/cross-tree-review-schema'

type ConnectionRequestsViewProps = Readonly<{
  treeId: string
  treeName: string
  treeHref: `/tree/${string}`
  items: readonly ConnectionRequestItemViewModel[]
  /** Same pattern as `SuggestionsView`: the resolved item has just left this list. */
  result: ConnectionRequestResult | null
}>

const RESULT_MESSAGES: Readonly<Record<ConnectionRequestResult, string>> = {
  approved: 'Demande de connexion approuvée : le lien entre les deux arbres est établi.',
  refused: 'Demande de connexion refusée.',
}

export function ConnectionRequestsView({
  treeId,
  treeName,
  treeHref,
  items,
  result,
}: ConnectionRequestsViewProps) {
  return (
    <section aria-labelledby="connection-requests-title" className="space-y-6">
      <p>
        <Link href={treeHref}>Retour à {treeName}</Link>
      </p>
      <h1 id="connection-requests-title" className="text-3xl font-bold">
        Demandes de connexion — {treeName}
      </h1>
      <p role="status">
        {result && `${RESULT_MESSAGES[result]} `}
        {items.length > 0
          ? `${items.length} demande(s) en attente.`
          : 'Aucune demande de connexion en attente.'}
      </p>
      {items.length > 0 && (
        <ol className="space-y-4">
          {items.map((item) => (
            <ConnectionRequestItem key={item.id} treeId={treeId} item={item} />
          ))}
        </ol>
      )}
    </section>
  )
}

function ConnectionRequestItem({
  treeId,
  item,
}: Readonly<{ treeId: string; item: ConnectionRequestItemViewModel }>) {
  const target = { treeId, connectionRequestId: item.id }
  const itemLabel = `${item.requesterMemberName}, arbre ${item.requesterTreeName}`
  return (
    <li className="space-y-3 rounded-lg border border-earth-sand bg-white p-4">
      <h2 className="text-lg font-semibold">
        {item.requesterMemberName}, de l’arbre {item.requesterTreeName}, pourrait être{' '}
        {item.targetMemberName}
      </h2>
      <p className="text-sm text-earth-bark">
        Demandée le <LocalDateTime iso={item.createdAtIso} /> · expire le{' '}
        <LocalDateTime iso={item.expiresAtIso} />
      </p>
      <div className="flex flex-wrap gap-6 border-t border-earth-sand pt-3">
        <ApproveConnectionRequestForm
          action={approveConnectionRequestAction.bind(null, target)}
          itemLabel={itemLabel}
        />
        <RefuseConnectionRequestForm
          action={refuseConnectionRequestAction.bind(null, target)}
          itemLabel={itemLabel}
        />
      </div>
    </li>
  )
}
