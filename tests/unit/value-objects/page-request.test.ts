import { describe, expect, it } from 'vitest'
import { emptyPage, pageOf } from '@/core/shared/page'
import { DomainError } from '@/core/shared/errors/domain-error'
import { MAX_PAGE_SIZE, PageRequest } from '@/core/shared/value-objects/page-request'

describe('PageRequest', () => {
  it('computes the offset of a page', () => {
    expect(PageRequest.of(3, 20).offset).toBe(40)
  })

  it.each([0, -1, 1.5])('rejects page %s', (page) => {
    expect(() => PageRequest.of(page, 20)).toThrow(DomainError)
  })

  it('rejects an empty page size', () => {
    expect(() => PageRequest.of(1, 0)).toThrow(DomainError)
  })

  it('caps the page size', () => {
    expect(PageRequest.of(1, 500).size).toBe(MAX_PAGE_SIZE)
  })

  it('cannot be mutated', () => {
    expect(Object.isFrozen(PageRequest.of(1, 20))).toBe(true)
  })
})

describe('pageOf', () => {
  it('counts the total pages', () => {
    expect(pageOf(['a'], 41, PageRequest.of(3, 20))).toEqual({
      items: ['a'],
      total: 41,
      page: 3,
      pageSize: 20,
      totalPages: 3,
    })
  })

  it('has at least one page, even without any item', () => {
    expect(emptyPage(PageRequest.of(1, 20))).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })
  })
})
