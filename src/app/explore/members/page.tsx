import type { Metadata } from 'next'
import { loadDiscoverableMembers, loadPublicMembers } from '@/app/explore/load-explore'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { toDiscoverableMemberSearchViewModel } from '@/presentation/mappers/discoverable-member-view-models'
import { toMemberSearchViewModel } from '@/presentation/mappers/explore-view-models'
import {
  parseDiscoverableMemberSearch,
  parsePublicMemberSearch,
} from '@/presentation/schemas/explore-schema'
import { DiscoverableMemberSearchView } from '@/presentation/views/discoverable-member-search-view'
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
  const params = await searchParams
  const [publicOutcome, discoverableOutcome, currentUser] = await Promise.all([
    loadPublicMembers(parsePublicMemberSearch(params)),
    loadDiscoverableMembers(parseDiscoverableMemberSearch(params)),
    currentUserOrNull(),
  ])
  return (
    <div className="space-y-8">
      <ExploreHeaderView />
      {publicOutcome.kind === 'rate-limited' ? (
        <RateLimitedView />
      ) : (
        <PublicMemberSearchView search={toMemberSearchViewModel(publicOutcome.value)} />
      )}
      {discoverableOutcome.kind === 'ok' && (
        <DiscoverableMemberSearchView
          search={toDiscoverableMemberSearchViewModel(discoverableOutcome.value)}
          signedIn={currentUser !== null}
        />
      )}
    </div>
  )
}
