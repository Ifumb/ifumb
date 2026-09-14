import 'server-only'
import type { PublicTreeExploration } from '@/core/use-cases/explore-public-trees'
import type { PublicMemberSearch } from '@/core/use-cases/search-public-members'
import { container } from '@/infrastructure/di/container'
import { currentClientIp } from '@/infrastructure/http/client-ip'
import type {
  PublicMemberSearchRequest,
  PublicTreeSearch,
} from '@/presentation/schemas/explore-schema'

export type Limited<T> =
  { readonly kind: 'ok'; readonly value: T } | { readonly kind: 'rate-limited' }

/**
 * reason: the attempt is charged while rendering, not in a Server Action — these searches are
 * GET pages. Anonymous searches over public data are cheap to script, and costly to serve.
 */
async function withinSearchBudget<T>(search: () => Promise<T>): Promise<Limited<T>> {
  const subject = await currentClientIp()
  const allowed = await container.allowsAttempt([{ policy: 'publicSearchByIp', subject }])
  return allowed ? { kind: 'ok', value: await search() } : { kind: 'rate-limited' }
}

export function loadPublicTrees(search: PublicTreeSearch): Promise<Limited<PublicTreeExploration>> {
  return withinSearchBudget(() => container.exploreTrees().execute(search))
}

/** A blank query searches nothing, so it costs nothing against the budget either. */
export async function loadPublicMembers(
  request: PublicMemberSearchRequest,
): Promise<Limited<PublicMemberSearch>> {
  const run = () => container.searchMembers().execute(request)
  if (!request.query) return { kind: 'ok', value: await run() }
  return withinSearchBudget(run)
}
