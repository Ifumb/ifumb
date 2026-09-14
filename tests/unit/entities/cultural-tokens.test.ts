import { describe, expect, it } from 'vitest'
import { culturalTokens, distinctCulturalTokens } from '@/core/entities/cultural-tokens'

describe('culturalTokens', () => {
  it('splits, trims and drops blanks', () => {
    expect(culturalTokens(' Peul, ,Malinké ')).toEqual(['Peul', 'Malinké'])
  })

  it('returns no token for null', () => {
    expect(culturalTokens(null)).toEqual([])
  })
})

describe('distinctCulturalTokens', () => {
  it('merges several texts into distinct tokens in French order', () => {
    expect(distinctCulturalTokens(['Peul, Éwé', null, 'Bambara,Peul', 'Wolof'])).toEqual([
      'Bambara',
      'Éwé',
      'Peul',
      'Wolof',
    ])
  })
})
