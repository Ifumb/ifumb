import { describe, expect, it } from 'vitest'
import { bulkReviewMessage } from '@/presentation/schemas/bulk-review-result'

describe('bulk review confirmation', () => {
  it('preserves applied and skipped counts in a shareable confirmation', () => {
    expect(bulkReviewMessage({ review: 'bulk', approved: '2', rejected: '0', skipped: '1' })).toBe(
      '2 approuvée(s), 1 ignorée(s) (dépassée(s) ou déjà traitée(s)).',
    )
  })
  it.each([
    {},
    { review: 'approved' },
    { review: 'bulk', approved: '-1', rejected: '0', skipped: '0' },
    { review: 'bulk', approved: ['2'], rejected: '0', skipped: '0' },
    { review: 'bulk', approved: 'Infinity', rejected: '0', skipped: '0' },
  ])('rejects an invalid confirmation %o', (query) => {
    expect(bulkReviewMessage(query)).toBeNull()
  })
  it('explains an empty batch', () => {
    expect(bulkReviewMessage({ review: 'bulk', approved: '0', rejected: '0', skipped: '0' })).toBe(
      'Aucune proposition à traiter.',
    )
  })
})
