import type { Metadata } from 'next'
import { loadPublicMembers } from '@/app/explore/load-explore'
import { toMemberSearchViewModel } from '@/presentation/mappers/explore-view-models'
import { parsePublicMemberSearch } from '@/presentation/schemas/explore-schema'
import { ExploreHeaderView } from '@/presentation/views/explore-header-view'
import { PublicMemberSearchView } from '@/presentation/views/public-member-search-view'
import { RateLimitedView } from '@/presentation/views/rate-limited-view'

type MemberSearchPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

export const metadata: Metadata = {
  title: 'Rechercher un membre',
  description: 'Retrouvez un membre des arbres généalogiques publics par nom, tribu ou région.',
  // Search results: followed to the public profiles, which are indexed themselves.
  robots: { index: false, follow: true },
}

export default async function MemberSearchPage({ searchParams }: MemberSearchPageProps) {
  const outcome = await loadPublicMembers(parsePublicMemberSearch(await searchParams))
  return (
    <div className="space-y-8">
      <ExploreHeaderView />
      {outcome.kind === 'rate-limited' ? (
        <RateLimitedView />
      ) : (
        <PublicMemberSearchView search={toMemberSearchViewModel(outcome.value)} />
      )}
    </div>
  )
}
