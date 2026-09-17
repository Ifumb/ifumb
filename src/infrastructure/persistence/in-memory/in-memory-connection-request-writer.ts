import 'server-only'
import type { CrossTreeConnectionRequest } from '@/core/entities/connection-request'
import type { ConnectionRequestWriter } from '@/core/use-cases/ports/connection-request-writer'

type ExpiredSweep = { readonly targetTreeId: string; readonly now: Date }

/**
 * Test double of the standalone connection request writer — the one used outside a transaction,
 * for the lazy expiry sweep (mirrors `InMemoryNotificationWriter`). `create`/`resolve` exist here
 * too so a test can seed through the same port its use case depends on.
 */
export class InMemoryConnectionRequestWriter implements ConnectionRequestWriter {
  readonly created: CrossTreeConnectionRequest[] = []
  readonly resolved: CrossTreeConnectionRequest[] = []
  readonly expiredSweeps: ExpiredSweep[] = []

  async create(request: CrossTreeConnectionRequest): Promise<void> {
    this.created.push(request)
  }

  async resolve(request: CrossTreeConnectionRequest): Promise<void> {
    this.resolved.push(request)
  }

  async expireStale(targetTreeId: string, now: Date): Promise<void> {
    this.expiredSweeps.push({ targetTreeId, now })
  }
}
