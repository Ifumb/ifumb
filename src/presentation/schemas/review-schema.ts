import { z } from 'zod'
import { REJECTION_COMMENT_MAX_LENGTH } from '@/core/entities/pending-change'

export const REVIEW_COMMENT_ENTRIES = ['comment'] as const

/** Query param the single-item review actions redirect through, to carry their result. */
export const RESULT_PARAM = 'review'
export const REVIEW_RESULTS = ['approved', 'rejected'] as const
export type ReviewResult = (typeof REVIEW_RESULTS)[number]

/** The single-item review result named in the URL, if any and if it is one of the two expected. */
export function parseReviewResult(
  searchParams: Readonly<Record<string, string | string[] | undefined>>,
): ReviewResult | null {
  const value = searchParams[RESULT_PARAM]
  const raw = Array.isArray(value) ? value[0] : value
  return (REVIEW_RESULTS as readonly string[]).includes(raw ?? '') ? (raw as ReviewResult) : null
}

/** An empty comment becomes `null`: the entity itself treats the two the same. */
export const reviewCommentSchema = z.object({
  comment: z
    .string()
    .max(REJECTION_COMMENT_MAX_LENGTH, `Le commentaire dépasse ${REJECTION_COMMENT_MAX_LENGTH} caractères`)
    .transform((value) => value.trim() || null),
})
