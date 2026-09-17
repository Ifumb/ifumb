import 'server-only'
import type { CrossTreeConnectionRequest } from '@/core/entities/connection-request'
import type {
  ConnectionRequestReader,
  ConnectionRequestView,
} from '@/core/use-cases/ports/connection-request-reader'

/** Test double of the connection request reader. */
export class InMemoryConnectionRequestReader implements ConnectionRequestReader {
  private readonly byId = new Map<string, CrossTreeConnectionRequest>()
  private readonly views = new Map<string, ConnectionRequestView>()

  seed(request: CrossTreeConnectionRequest): void {
    this.byId.set(request.id, request)
  }

  /** Seeds what `listPendingForTree` shows for this request; `seed` it too, separately. */
  seedView(view: ConnectionRequestView): void {
    this.views.set(view.request.id, view)
  }

  async listPendingForTree(targetTreeId: string): Promise<readonly ConnectionRequestView[]> {
    return [...this.views.values()].filter(
      (view) => view.request.targetTreeId === targetTreeId && view.request.isPending,
    )
  }

  async findById(id: string): Promise<CrossTreeConnectionRequest | null> {
    return this.byId.get(id) ?? null
  }
}
