/** Query param the single-item suggestion/connection-request actions redirect through, to carry
 * their result — the resolved item leaves the NEW/PENDING list that same request revalidates
 * (same reason as `review-schema.ts`, modules 2.6b/2.7/3.1/3.2). */
export const RESULT_PARAM = 'result'

export const SUGGESTION_RESULTS = ['accepted', 'rejected'] as const
export type SuggestionResult = (typeof SUGGESTION_RESULTS)[number]

export const CONNECTION_REQUEST_RESULTS = ['approved', 'refused'] as const
export type ConnectionRequestResult = (typeof CONNECTION_REQUEST_RESULTS)[number]

export function parseSuggestionResult(
  searchParams: Readonly<Record<string, string | string[] | undefined>>,
): SuggestionResult | null {
  return parseResult(searchParams, SUGGESTION_RESULTS)
}

export function parseConnectionRequestResult(
  searchParams: Readonly<Record<string, string | string[] | undefined>>,
): ConnectionRequestResult | null {
  return parseResult(searchParams, CONNECTION_REQUEST_RESULTS)
}

function parseResult<T extends string>(
  searchParams: Readonly<Record<string, string | string[] | undefined>>,
  allowed: readonly T[],
): T | null {
  const value = searchParams[RESULT_PARAM]
  const raw = Array.isArray(value) ? value[0] : value
  return (allowed as readonly string[]).includes(raw ?? '') ? (raw as T) : null
}
