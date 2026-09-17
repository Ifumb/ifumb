import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import { loadSuggestions } from '@/app/tree/[id]/suggestions/load-suggestions'
import type { GetTreeOverviewError } from '@/core/use-cases/get-tree-overview'
import type { TreeContributionError } from '@/core/use-cases/tree-contribution-access'
import { toSuggestionItems } from '@/presentation/mappers/suggestion-view-models'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'
import { SuggestionsView } from '@/presentation/views/suggestions-view'
import { parseSuggestionResult } from '@/presentation/schemas/cross-tree-review-schema'

type SuggestionsPageProps = Readonly<{
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

export async function generateMetadata({ params }: SuggestionsPageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  if (!result.ok) {
    const title = result.error.kind === 'TREE_NOT_FOUND' ? 'Arbre introuvable' : 'Arbre privé'
    return { title, robots: { index: false } }
  }
  return { title: `Suggestions inter-arbres — ${result.value.name}`, robots: { index: false } }
}

export default async function SuggestionsPage({ params, searchParams }: SuggestionsPageProps) {
  const { id } = await params
  const overview = await loadTreeOverview(id)
  if (!overview.result.ok) return unreadableTree(overview.result.error, overview.signedIn)

  const { signedIn, result } = await loadSuggestions(id)
  if (!result.ok) return unreadableSuggestions(id, result.error, signedIn)

  const query = await searchParams
  return (
    <SuggestionsView
      treeId={id}
      treeName={overview.result.value.name}
      treeHref={`/tree/${id}`}
      items={toSuggestionItems(result.value)}
      result={parseSuggestionResult(query)}
    />
  )
}

function unreadableTree(error: GetTreeOverviewError, signedIn: boolean) {
  if (error.kind === 'TREE_NOT_FOUND') notFound()
  return <PrivateTreeView signedIn={signedIn} />
}

function unreadableSuggestions(treeId: string, error: TreeContributionError, signedIn: boolean) {
  switch (error.kind) {
    case 'TREE_NOT_FOUND':
      notFound()
    case 'TREE_CONTRIBUTION_FORBIDDEN':
      return (
        <RestrictedTreeView
          title="Réservé aux contributeurs"
          message="Les suggestions inter-arbres sont réservées au propriétaire de l’arbre et à ses éditeurs."
          treeHref={`/tree/${treeId}`}
          signedIn={signedIn}
        />
      )
    default:
      return <PrivateTreeView signedIn={signedIn} />
  }
}
