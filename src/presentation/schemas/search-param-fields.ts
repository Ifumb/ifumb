import { z } from 'zod'

/** Longest search text kept from a URL; anything beyond is cut. */
export const SEARCH_TEXT_MAX_LENGTH = 100

// A page number far beyond any listing only yields an empty page; the cap keeps the offset sane.
const MAX_PAGE_NUMBER = 10_000

/** A repeated query parameter (`?q=a&q=b`) counts for its first value. */
export const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value)

/** Free text from the URL: trimmed and cut; undefined when blank. */
export const searchTextParam = z
  .preprocess(firstValue, z.string().optional())
  .catch(undefined)
  .transform((text) => text?.trim().slice(0, SEARCH_TEXT_MAX_LENGTH) || undefined)

/** A 1-based page number from the URL; the first page when missing or unreadable. */
export const pageParam = z
  .preprocess(firstValue, z.coerce.number().int().min(1).max(MAX_PAGE_NUMBER))
  .catch(1)
