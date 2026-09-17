import { z } from 'zod'
import { CONTACT_REQUEST_MESSAGE_MAX_LENGTH } from '@/core/entities/contact-request'

export const CONTACT_REQUEST_ENTRIES = ['message'] as const

/** An empty message becomes `null`: the entity itself treats the two the same. */
export const contactRequestSchema = z.object({
  message: z
    .string()
    .max(
      CONTACT_REQUEST_MESSAGE_MAX_LENGTH,
      `Le message dépasse ${CONTACT_REQUEST_MESSAGE_MAX_LENGTH} caractères`,
    )
    .transform((value) => value.trim() || null),
})
