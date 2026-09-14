import type { Route } from 'next'
import type { Page } from '@/core/shared/page'

export type PaginationViewModel = {
  readonly label: string
  /** Null on the first page: there is nothing before it. */
  readonly previousHref: Route | null
  /** Null on the last page. */
  readonly nextHref: Route | null
}

/** Previous and next links of a listing; null when everything fits on one page. */
export function toPaginationViewModel(
  page: Page<unknown>,
  hrefFor: (pageNumber: number) => Route,
): PaginationViewModel | null {
  if (page.totalPages <= 1) return null
  return {
    label: `Page ${page.page} sur ${page.totalPages}`,
    previousHref: page.page > 1 ? hrefFor(Math.min(page.page, page.totalPages) - 1) : null,
    nextHref: page.page < page.totalPages ? hrefFor(page.page + 1) : null,
  }
}
