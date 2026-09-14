import { z } from 'zod'
import { SEARCH_TEXT_MAX_LENGTH, searchTextParam } from '@/presentation/schemas/search-param-fields'

export const SEARCH_QUERY_MAX_LENGTH = SEARCH_TEXT_MAX_LENGTH

const memberSearchSchema = z.object({ q: searchTextParam })

/** The member search typed in the URL (`?q=`), normalized; undefined when there is none. */
export function parseMemberSearch(searchParams: Record<string, string | string[] | undefined>) {
  return memberSearchSchema.parse(searchParams).q
}
