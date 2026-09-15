import 'server-only'
import type { NormalizedPhoto } from '@/core/use-cases/ports/photo-processor'
import type { PhotoStorage } from '@/core/use-cases/ports/photo-storage'

type SavedPhoto = { readonly path: string; readonly contentType: string }

/** Test double of the photo storage, publishing under a fixed base URL. */
export class InMemoryPhotoStorage implements PhotoStorage {
  static readonly PUBLIC_BASE = 'https://photos.test/public/member-photos/'

  readonly saved: SavedPhoto[] = []
  readonly removed: string[] = []
  private removalsFail = false

  /** Makes every removal reject, as an unreachable storage would. */
  failRemovals(): void {
    this.removalsFail = true
  }

  async save(path: string, photo: NormalizedPhoto): Promise<string> {
    this.saved.push({ path, contentType: photo.contentType })
    return `${InMemoryPhotoStorage.PUBLIC_BASE}${path}`
  }

  async remove(url: string): Promise<void> {
    if (this.removalsFail) throw new Error('Simulated storage failure')
    if (url.startsWith(InMemoryPhotoStorage.PUBLIC_BASE)) this.removed.push(url)
  }
}
