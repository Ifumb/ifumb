import type { Metadata } from 'next'
import { loadPublicTrees } from '@/app/explore/load-explore'
import { toTreeExplorationViewModel } from '@/presentation/mappers/explore-view-models'
import { isRefinedTreeSearch, parsePublicTreeSearch } from '@/presentation/schemas/explore-schema'
import { ExploreHeaderView } from '@/presentation/views/explore-header-view'
import { PublicTreeExplorationView } from '@/presentation/views/public-tree-exploration-view'
import { RateLimitedView } from '@/presentation/views/rate-limited-view'

type ExplorePageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

export async function generateMetadata({ searchParams }: ExplorePageProps): Promise<Metadata> {
  const search = parsePublicTreeSearch(await searchParams)
  return {
    title: 'Explorer les arbres publics',
    description: 'Parcourez les arbres généalogiques publics, par nom, tribu ou ethnie.',
    alternates: { canonical: '/explore' },
    // The plain listing is the page to index; filtered and later pages repeat it.
    robots: { index: !isRefinedTreeSearch(search), follow: true },
  }
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const outcome = await loadPublicTrees(parsePublicTreeSearch(await searchParams))
  return (
    <div className="space-y-8">
      <ExploreHeaderView />
      {outcome.kind === 'rate-limited' ? (
        <RateLimitedView />
      ) : (
        <PublicTreeExplorationView exploration={toTreeExplorationViewModel(outcome.value)} />
      )}
    </div>
  )
}
