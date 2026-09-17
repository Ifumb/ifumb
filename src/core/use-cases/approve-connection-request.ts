import 'server-only'
import type {
  ConnectionRequestAlreadyResolved,
  ConnectionRequestExpired,
} from '@/core/entities/connection-request'
import { CrossTreeLink } from '@/core/entities/cross-tree-link'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { ConnectionRequestReader } from '@/core/use-cases/ports/connection-request-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { manageableTree, type TreeManagementError } from '@/core/use-cases/tree-management-access'

export type ApproveConnectionRequestInput = {
  readonly treeId: string
  readonly viewerId: string
  readonly connectionRequestId: string
}

export type ApproveConnectionRequestError =
  | TreeManagementError
  | { readonly kind: 'CONNECTION_REQUEST_NOT_FOUND' }
  | ConnectionRequestAlreadyResolved
  | ConnectionRequestExpired

type ApproveConnectionRequestDeps = {
  readonly trees: TreeReader
  readonly connectionRequests: ConnectionRequestReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** The target tree's owner confirms the match: establishes the `CrossTreeLink`. */
export class ApproveConnectionRequestUseCase {
  constructor(private readonly deps: ApproveConnectionRequestDeps) {}

  async execute(
    input: ApproveConnectionRequestInput,
  ): Promise<Result<void, ApproveConnectionRequestError>> {
    const access = await manageableTree(this.deps.trees, input)
    if (!access.ok) return access

    const request = await this.deps.connectionRequests.findById(input.connectionRequestId)
    if (!request || request.targetTreeId !== input.treeId) {
      return err({ kind: 'CONNECTION_REQUEST_NOT_FOUND' })
    }

    const now = this.deps.clock.now()
    const approved = request.approve({ resolvedByUserId: input.viewerId, now })
    if (!approved.ok) return approved

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.connectionRequests.resolve(approved.value)
      await context.crossTreeLinks.create(
        CrossTreeLink.establish({
          id: this.deps.ids.next(),
          tree1Id: request.requesterTreeId,
          member1Id: request.requesterMemberId,
          tree2Id: request.targetTreeId,
          member2Id: request.targetMemberId,
          now,
        }),
      )
    })
    return ok(undefined)
  }
}
