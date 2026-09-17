import 'server-only'
import { ListContactRequestsUseCase } from '@/core/use-cases/list-contact-requests'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { ContactRequestReader } from '@/core/use-cases/ports/contact-request-reader'
import type { DiscoverableMemberDirectory } from '@/core/use-cases/ports/discoverable-member-directory'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { RespondToContactRequestUseCase } from '@/core/use-cases/respond-to-contact-request'
import { SearchDiscoverableMembersUseCase } from '@/core/use-cases/search-discoverable-members'
import { SendContactRequestUseCase } from '@/core/use-cases/send-contact-request'
import { WithdrawContactRequestUseCase } from '@/core/use-cases/withdraw-contact-request'
import { lazy } from '@/infrastructure/di/lazy'

export type ContactRequestWriteDeps = {
  readonly directory: DiscoverableMemberDirectory
  readonly contactRequests: ContactRequestReader
  readonly trees: TreeReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/**
 * The contact-request and discoverable-search use cases, each built lazily like the rest of the
 * container.
 * reason: kept apart from `container.ts` so that it stays under the size limit.
 */
export function contactRequestUseCases(deps: () => ContactRequestWriteDeps) {
  return {
    sendContactRequest: lazy(() => new SendContactRequestUseCase(deps())),
    respondToContactRequest: lazy(() => new RespondToContactRequestUseCase(deps())),
    withdrawContactRequest: lazy(() => new WithdrawContactRequestUseCase(deps())),
    listContactRequests: lazy(() => new ListContactRequestsUseCase(deps())),
    searchDiscoverableMembers: lazy(() => new SearchDiscoverableMembersUseCase(deps())),
  }
}
