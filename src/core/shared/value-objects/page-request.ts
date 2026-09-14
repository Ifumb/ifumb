import { DomainError } from '@/core/shared/errors/domain-error'

/** The largest page a listing serves, whatever is asked (the legacy explore limit). */
export const MAX_PAGE_SIZE = 50

/** One page of a listing: a 1-based page number and a bounded size. */
export class PageRequest {
  private constructor(
    readonly page: number,
    readonly size: number,
  ) {
    Object.freeze(this)
  }

  static of(page: number, size: number): PageRequest {
    if (!Number.isInteger(page) || page < 1) {
      throw new DomainError('PageRequest.page must be a positive integer', { page })
    }
    if (!Number.isInteger(size) || size < 1) {
      throw new DomainError('PageRequest.size must be a positive integer', { size })
    }
    return new PageRequest(page, Math.min(size, MAX_PAGE_SIZE))
  }

  /** How many items come before this page. */
  get offset(): number {
    return (this.page - 1) * this.size
  }
}
