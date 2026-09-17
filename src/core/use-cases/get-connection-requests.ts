import 'server-only'
import { ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type {
  ConnectionRequestReader,
  ConnectionRequestView,
} from '@/core/use-cases/ports/connection-request-reader'
import type { ConnectionRequestWriter } from '@/core/use-cases/ports/connection-request-writer'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { manageableTree, type TreeManagementError } from '@/core/use-cases/tree-management-access'

export type GetConnectionRequestsInput = { readonly treeId: string; readonly viewerId: string }

type GetConnectionRequestsDeps = {
  readonly trees: TreeReader
  readonly connectionRequests: ConnectionRequestReader
  /** Only ever the lazy expiry sweep here — resolving a request is a real business write, kept
   * inside the unit of work, not this standalone dependency (mirrors `notifications` in module 2.7). */
  readonly connectionRequestWriter: Pick<ConnectionRequestWriter, 'expireStale'>
  readonly clock: Clock
}

/** For the target tree's owner: pending connection requests, after purging the stale ones. */
export class GetConnectionRequestsUseCase {
  constructor(private readonly deps: GetConnectionRequestsDeps) {}

  async execute(
    input: GetConnectionRequestsInput,
  ): Promise<Result<readonly ConnectionRequestView[], TreeManagementError>> {
    const access = await manageableTree(this.deps.trees, input)
    if (!access.ok) return access

    await this.deps.connectionRequestWriter.expireStale(input.treeId, this.deps.clock.now())
    return ok(await this.deps.connectionRequests.listPendingForTree(input.treeId))
  }
}
