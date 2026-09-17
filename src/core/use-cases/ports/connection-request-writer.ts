import 'server-only'
import type { CrossTreeConnectionRequest } from '@/core/entities/connection-request'

/** Write side of cross-tree connection requests. */
export interface ConnectionRequestWriter {
  create(request: CrossTreeConnectionRequest): Promise<void>
  resolve(request: CrossTreeConnectionRequest): Promise<void>
  /**
   * The lazy sweep the legacy app also relied on: flips `PENDING` rows past their `expiresAt` to
   * `EXPIRED`, for one target tree. `approve`/`refuse` no longer depend on this running first
   * (module 3.2, decision 3 — the entity re-checks expiry itself), but the list should still read
   * honestly.
   */
  expireStale(targetTreeId: string, now: Date): Promise<void>
}
