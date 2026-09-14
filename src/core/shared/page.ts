import type { PageRequest } from '@/core/shared/value-objects/page-request'

/** One page of a listing, with what is needed to move to the others. */
export type Page<T> = {
  readonly items: readonly T[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
  /** Never below 1, so that an empty listing still has its first page. */
  readonly totalPages: number
}

export function pageOf<T>(items: readonly T[], total: number, request: PageRequest): Page<T> {
  return {
    items,
    total,
    page: request.page,
    pageSize: request.size,
    totalPages: Math.max(1, Math.ceil(total / request.size)),
  }
}

export function emptyPage<T>(request: PageRequest): Page<T> {
  return pageOf<T>([], 0, request)
}
