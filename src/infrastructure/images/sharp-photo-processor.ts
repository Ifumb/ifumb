import 'server-only'
import sharp from 'sharp'
import { err, ok, type Result } from '@/core/shared/result'
import type {
  NormalizedPhoto,
  PhotoProcessor,
  PhotoUnreadable,
} from '@/core/use-cases/ports/photo-processor'

/** Longest side of a stored photo: sharp on a profile, far below the size of a camera picture. */
const MAX_EDGE_PX = 1024
/** Decoding refuses larger images (about 8000 × 5000): a small file can expand into a huge one. */
const MAX_INPUT_PIXELS = 40_000_000
const WEBP_QUALITY = 82
const DECODABLE_FORMATS: ReadonlySet<string> = new Set(['jpeg', 'png', 'webp'])

/**
 * Re-encodes every photo to WebP, turned upright and bounded in size.
 * reason: re-encoding is what makes a stored photo safe to publish. sharp writes no metadata unless
 * asked to, so the EXIF block of the original — camera, date, GPS position — is left behind, and a
 * file that merely starts like an image cannot carry anything else through.
 */
export class SharpPhotoProcessor implements PhotoProcessor {
  async normalize(bytes: Uint8Array): Promise<Result<NormalizedPhoto, PhotoUnreadable>> {
    try {
      const image = sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' })
      const { format } = await image.metadata()
      if (!DECODABLE_FORMATS.has(format)) return err({ kind: 'PHOTO_UNREADABLE' })
      const output = await image
        .rotate()
        .resize({
          width: MAX_EDGE_PX,
          height: MAX_EDGE_PX,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()
      return ok({ bytes: new Uint8Array(output), contentType: 'image/webp' })
    } catch {
      return err({ kind: 'PHOTO_UNREADABLE' })
    }
  }
}
