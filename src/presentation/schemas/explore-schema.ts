import { z } from 'zod'
import { pageParam, searchTextParam } from '@/presentation/schemas/search-param-fields'

type SearchParams = Record<string, string | string[] | undefined>

export type PublicTreeSearch = {
  readonly text?: string
  readonly tribe?: string
  readonly ethnicity?: string
  readonly page: number
}

export type PublicMemberSearchRequest = { readonly query?: string; readonly page: number }
export type DiscoverableMemberSearchRequest = { readonly query?: string; readonly page: number }

/** Query parameter names of the explore pages. */
export const EXPLORE_PARAMS = {
  text: 'q',
  tribe: 'tribe',
  ethnicity: 'ethnicity',
  page: 'page',
  /** The discoverable section pages separately from the public one, on the same query text. */
  discoverablePage: 'dpage',
} as const

const P = EXPLORE_PARAMS

const publicTreeSearchSchema = z.object({
  [P.text]: searchTextParam,
  [P.tribe]: searchTextParam,
  [P.ethnicity]: searchTextParam,
  [P.page]: pageParam,
})

const publicMemberSearchSchema = z.object({
  [P.text]: searchTextParam,
  [P.page]: pageParam,
  [P.discoverablePage]: pageParam,
})

export function parsePublicTreeSearch(searchParams: SearchParams): PublicTreeSearch {
  const { q, tribe, ethnicity, page } = publicTreeSearchSchema.parse(searchParams)
  return { page, ...(q && { text: q }), ...(tribe && { tribe }), ...(ethnicity && { ethnicity }) }
}

export function parsePublicMemberSearch(searchParams: SearchParams): PublicMemberSearchRequest {
  const { q, page } = publicMemberSearchSchema.parse(searchParams)
  return { page, ...(q && { query: q }) }
}

export function parseDiscoverableMemberSearch(
  searchParams: SearchParams,
): DiscoverableMemberSearchRequest {
  const { q, dpage } = publicMemberSearchSchema.parse(searchParams)
  return { page: dpage, ...(q && { query: q }) }
}

/** True when the listing is narrowed or paged: such a page is not worth indexing. */
export function isRefinedTreeSearch(search: PublicTreeSearch): boolean {
  return Boolean(search.text || search.tribe || search.ethnicity) || search.page > 1
}
