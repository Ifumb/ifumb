import { err, ok, type Result } from '@/core/shared/result'
import type {
  NormalizedPhoto,
  PhotoProcessor,
  PhotoUnreadable,
} from '@/core/use-cases/ports/photo-processor'

/** Stand-in for the image re-encoder: every readable file becomes a tiny WebP. */
export class FakePhotoProcessor implements PhotoProcessor {
  readonly received: Uint8Array[] = []
  private unreadable = false

  refuseEverything(): void {
    this.unreadable = true
  }

  async normalize(bytes: Uint8Array): Promise<Result<NormalizedPhoto, PhotoUnreadable>> {
    this.received.push(bytes)
    if (this.unreadable) return err({ kind: 'PHOTO_UNREADABLE' })
    return ok({ bytes: Uint8Array.from([0x52, 0x49]), contentType: 'image/webp' })
  }
}
