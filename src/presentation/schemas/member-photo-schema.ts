import { z } from 'zod'
import { MEMBER_PHOTO_MAX_BYTES } from '@/core/entities/member-photo'

export const PHOTO_REQUIRED_MESSAGE = 'Choisissez une photo'
export const PHOTO_TOO_LARGE_MESSAGE = 'La photo ne doit pas dépasser 5 Mo'

/** Which button sent the photo form: saving the chosen file, or removing the current photo. */
export const memberPhotoIntentSchema = z.enum(['save', 'remove']).catch('save')

/**
 * The chosen file, as submitted. Only its presence and size are checked here: what it contains is
 * checked by the use case, from its bytes, whatever its name and declared type say.
 */
export const memberPhotoFileSchema = z
  .file({ error: PHOTO_REQUIRED_MESSAGE })
  .min(1, PHOTO_REQUIRED_MESSAGE)
  .max(MEMBER_PHOTO_MAX_BYTES, PHOTO_TOO_LARGE_MESSAGE)
