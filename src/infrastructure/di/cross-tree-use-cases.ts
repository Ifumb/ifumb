import 'server-only'
import { AcceptSuggestionUseCase } from '@/core/use-cases/accept-suggestion'
import { ApproveConnectionRequestUseCase } from '@/core/use-cases/approve-connection-request'
import { ComputeSuggestionsUseCase } from '@/core/use-cases/compute-suggestions'
import { GetConnectionRequestsUseCase } from '@/core/use-cases/get-connection-requests'
import { GetSuggestionsUseCase } from '@/core/use-cases/get-suggestions'
import { ListCrossTreeLinksUseCase } from '@/core/use-cases/list-cross-tree-links'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { ConnectionRequestReader } from '@/core/use-cases/ports/connection-request-reader'
import type { ConnectionRequestWriter } from '@/core/use-cases/ports/connection-request-writer'
import type { CrossTreeLinkReader } from '@/core/use-cases/ports/cross-tree-link-reader'
import type { CrossTreeSuggestionReader } from '@/core/use-cases/ports/cross-tree-suggestion-reader'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeMemberPool } from '@/core/use-cases/ports/tree-member-pool'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { RefuseConnectionRequestUseCase } from '@/core/use-cases/refuse-connection-request'
import { RejectSuggestionUseCase } from '@/core/use-cases/reject-suggestion'
import { lazy } from '@/infrastructure/di/lazy'

export type CrossTreeWriteDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
  readonly pool: TreeMemberPool
  readonly suggestions: CrossTreeSuggestionReader
  readonly connectionRequests: ConnectionRequestReader
  /** Only ever the lazy expiry sweep here — resolving a request is a real business write, kept
   * inside the unit of work, not this standalone dependency (mirrors `notifications` in module 2.7). */
  readonly connectionRequestWriter: Pick<ConnectionRequestWriter, 'expireStale'>
  readonly links: CrossTreeLinkReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/**
 * The cross-tree suggestion, connection-request and link use cases, each built lazily like the
 * rest of the container.
 * reason: kept apart from `container.ts` so that it stays under the size limit.
 */
export function crossTreeUseCases(deps: () => CrossTreeWriteDeps) {
  return {
    computeSuggestions: lazy(() => new ComputeSuggestionsUseCase(deps())),
    getSuggestions: lazy(() => new GetSuggestionsUseCase(deps())),
    acceptSuggestion: lazy(() => new AcceptSuggestionUseCase(deps())),
    rejectSuggestion: lazy(() => new RejectSuggestionUseCase(deps())),
    getConnectionRequests: lazy(() => new GetConnectionRequestsUseCase(deps())),
    approveConnectionRequest: lazy(() => new ApproveConnectionRequestUseCase(deps())),
    refuseConnectionRequest: lazy(() => new RefuseConnectionRequestUseCase(deps())),
    listCrossTreeLinks: lazy(() => new ListCrossTreeLinksUseCase(deps())),
  }
}
