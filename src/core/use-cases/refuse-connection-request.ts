import 'server-only'
import type {
  ConnectionRequestAlreadyResolved,
  ConnectionRequestExpired,
} from '@/core/entities/connection-request'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { ConnectionRequestReader } from '@/core/use-cases/ports/connection-request-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { manageableTree, type TreeManagementError } from '@/core/use-cases/tree-management-access'

export type RefuseConnectionRequestInput = {
  readonly treeId: string
  readonly viewerId: string
  readonly connectionRequestId: string
}

export type RefuseConnectionRequestError =
  | TreeManagementError
  | { readonly kind: 'CONNECTION_REQUEST_NOT_FOUND' }
  | ConnectionRequestAlreadyResolved
  | ConnectionRequestExpired

type RefuseConnectionRequestDeps = {
  readonly trees: TreeReader
  readonly connectionRequests: ConnectionRequestReader
  readonly unitOfWork: UnitOfWork
  readonly clock: Clock
}

/** The target tree's owner declines the match; no link is created. */
export class RefuseConnectionRequestUseCase {
  constructor(private readonly deps: RefuseConnectionRequestDeps) {}

  async execute(
    input: RefuseConnectionRequestInput,
  ): Promise<Result<void, RefuseConnectionRequestError>> {
    const access = await manageableTree(this.deps.trees, input)
    if (!access.ok) return access

    const request = await this.deps.connectionRequests.findById(input.connectionRequestId)
    if (!request || request.targetTreeId !== input.treeId) {
      return err({ kind: 'CONNECTION_REQUEST_NOT_FOUND' })
    }

    const now = this.deps.clock.now()
    const refused = request.refuse({ resolvedByUserId: input.viewerId, now })
    if (!refused.ok) return refused

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.connectionRequests.resolve(refused.value)
    })
    return ok(undefined)
  }
}
