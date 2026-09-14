import { z } from 'zod'

export const SEARCH_QUERY_MAX_LENGTH = 100

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value)

const memberSearchSchema = z.object({
  q: z.preprocess(
    firstValue,
    z
      .string()
      .trim()
      .transform((query) => query.slice(0, SEARCH_QUERY_MAX_LENGTH))
      .optional(),
  ),
})

/** The member search typed in the URL (`?q=`), normalized; undefined when there is none. */
export function parseMemberSearch(searchParams: Record<string, string | string[] | undefined>) {
  const parsed = memberSearchSchema.safeParse(searchParams)
  return parsed.success && parsed.data.q ? parsed.data.q : undefined
}
