import 'server-only'
import type { NormalizedPhoto } from '@/core/use-cases/ports/photo-processor'

/** Where member photos are kept and published. */
export interface PhotoStorage {
  /** Stores the photo under a path that was never used; resolves to its public URL. */
  save(path: string, photo: NormalizedPhoto): Promise<string>
  /**
   * Removes a photo this storage published; a URL from anywhere else is left alone. May reject:
   * the storage reports its own failures before rejecting.
   */
  remove(url: string): Promise<void>
}
