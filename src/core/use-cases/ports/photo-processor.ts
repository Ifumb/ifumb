import 'server-only'
import type { Result } from '@/core/shared/result'

/** A photo ready to be stored: re-encoded, bounded in size, without any embedded metadata. */
export type NormalizedPhoto = {
  readonly bytes: Uint8Array
  readonly contentType: 'image/webp'
}

export type PhotoUnreadable = { readonly kind: 'PHOTO_UNREADABLE' }

/** Turns an accepted image file into the photo that is stored. */
export interface PhotoProcessor {
  /** Fails when the content cannot be decoded as an image, or is unreasonably large once decoded. */
  normalize(bytes: Uint8Array): Promise<Result<NormalizedPhoto, PhotoUnreadable>>
}
