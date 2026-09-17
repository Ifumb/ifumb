import Link from 'next/link'
import {
  acceptSuggestionAction,
  computeSuggestionsAction,
  rejectSuggestionAction,
} from '@/app/actions/cross-tree-actions'
import { AcceptSuggestionForm } from '@/presentation/components/forms/accept-suggestion-form'
import { ComputeSuggestionsForm } from '@/presentation/components/forms/compute-suggestions-form'
import { RejectSuggestionForm } from '@/presentation/components/forms/reject-suggestion-form'
import { LocalDateTime } from '@/presentation/components/ui/local-date-time'
import type { SuggestionItemViewModel } from '@/presentation/mappers/suggestion-view-models'
import type { SuggestionResult } from '@/presentation/schemas/cross-tree-review-schema'

type SuggestionsViewProps = Readonly<{
  treeId: string
  treeName: string
  treeHref: `/tree/${string}`
  items: readonly SuggestionItemViewModel[]
  /** Named in the URL by `acceptSuggestionAction`/`rejectSuggestionAction` on success — the item
   * they resolved has just left this very list, so the confirmation lives here instead, in a
   * region that survives that change (same pattern as `PendingChangesView`). */
  result: SuggestionResult | null
}>

const RESULT_MESSAGES: Readonly<Record<SuggestionResult, string>> = {
  accepted: 'Correspondance acceptée : demande de connexion envoyée au propriétaire de l’arbre cible.',
  rejected: 'Suggestion rejetée.',
}

export function SuggestionsView({ treeId, treeName, treeHref, items, result }: SuggestionsViewProps) {
  return (
    <section aria-labelledby="suggestions-title" className="space-y-6">
      <p>
        <Link href={treeHref}>Retour à {treeName}</Link>
      </p>
      <h1 id="suggestions-title" className="text-3xl font-bold">
        Suggestions inter-arbres — {treeName}
      </h1>
      <p role="status">
        {result && `${RESULT_MESSAGES[result]} `}
        {items.length > 0 ? `${items.length} suggestion(s) à traiter.` : 'Aucune suggestion à traiter.'}
      </p>
      <ComputeSuggestionsForm action={computeSuggestionsAction.bind(null, treeId)} />
      {items.length > 0 && (
        <ol className="space-y-4">
          {items.map((item) => (
            <SuggestionItem key={item.id} treeId={treeId} item={item} />
          ))}
        </ol>
      )}
    </section>
  )
}

function SuggestionItem({ treeId, item }: Readonly<{ treeId: string; item: SuggestionItemViewModel }>) {
  const target = { treeId, suggestionId: item.id }
  const itemLabel = `${item.targetMemberName}, arbre ${item.targetTreeName}`
  return (
    <li className="space-y-3 rounded-lg border border-earth-sand bg-white p-4">
      <h2 className="text-lg font-semibold">
        {item.memberName} pourrait être {item.targetMemberName}, de l’arbre {item.targetTreeName}
      </h2>
      <p className="text-sm text-earth-bark">
        {item.confidenceLabel} · <LocalDateTime iso={item.createdAtIso} />
      </p>
      <div className="flex flex-wrap gap-6 border-t border-earth-sand pt-3">
        <AcceptSuggestionForm action={acceptSuggestionAction.bind(null, target)} itemLabel={itemLabel} />
        <RejectSuggestionForm action={rejectSuggestionAction.bind(null, target)} itemLabel={itemLabel} />
      </div>
    </li>
  )
}
