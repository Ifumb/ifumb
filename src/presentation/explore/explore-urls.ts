import {
  EXPLORE_PARAMS as P,
  type PublicMemberSearchRequest,
  type PublicTreeSearch,
} from '@/presentation/schemas/explore-schema'

export type ExploreTreesHref = '/explore' | `/explore?${string}`
export type ExploreMembersHref = '/explore/members' | `/explore/members?${string}`

export function exploreTreesHref(search: PublicTreeSearch): ExploreTreesHref {
  const query = queryString({
    [P.text]: search.text,
    [P.tribe]: search.tribe,
    [P.ethnicity]: search.ethnicity,
    [P.page]: pageValue(search.page),
  })
  return query ? `/explore?${query}` : '/explore'
}

export function exploreMembersHref(search: PublicMemberSearchRequest): ExploreMembersHref {
  const query = queryString({ [P.text]: search.query, [P.page]: pageValue(search.page) })
  return query ? `/explore/members?${query}` : '/explore/members'
}

/** Same query text, but the discoverable section's own page — never the public section's. */
export function discoverableMembersHref(
  query: string | undefined,
  page: number,
): ExploreMembersHref {
  const value = queryString({ [P.text]: query, [P.discoverablePage]: pageValue(page) })
  return value ? `/explore/members?${value}` : '/explore/members'
}

/** The first page is the default: it stays out of the URL. */
function pageValue(page: number): string | undefined {
  return page > 1 ? String(page) : undefined
}

function queryString(params: Readonly<Record<string, string | undefined>>): string {
  const entries = Object.entries(params).flatMap(([key, value]) => (value ? [[key, value]] : []))
  return new URLSearchParams(entries).toString()
}
