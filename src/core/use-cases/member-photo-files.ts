import 'server-only'
import type { PhotoStorage } from '@/core/use-cases/ports/photo-storage'

/**
 * Removes a photo file that no member refers to any more.
 * reason: the database is the reference. Once it no longer points at a file, failing to remove
 * that file must not undo or fail the user's change: an orphan file is the lesser harm, and the
 * storage has already reported the failure.
 */
export async function discardPhotoFile(
  storage: PhotoStorage | null,
  url: string | null,
): Promise<void> {
  if (!storage || !url) return
  await storage.remove(url).catch(() => undefined)
}
