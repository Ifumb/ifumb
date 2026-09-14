import { describe, expect, it } from 'vitest'
import { lineageHref } from '@/presentation/graph/graph-view-urls'
import { parseGraphView } from '@/presentation/schemas/graph-view-schema'

describe('parseGraphView', () => {
  it.each([{}, { view: 'unknown' }, { view: ['nope'] }])(
    'shows the whole graph for %o',
    (params) => {
      expect(parseGraphView(params)).toEqual({ kind: 'overview' })
    },
  )

  it('reads a lineage with its depths', () => {
    expect(parseGraphView({ view: 'lineage', member: 'm1', up: '2', down: '0' })).toEqual({
      kind: 'lineage',
      memberId: 'm1',
      ancestors: 2,
      descendants: 0,
    })
  })

  it('uses the legacy depths when they are missing or unreadable', () => {
    expect(parseGraphView({ view: 'lineage', member: 'm1', up: '-3', down: 'many' })).toMatchObject(
      {
        ancestors: 1,
        descendants: 4,
      },
    )
  })

  it('caps the depths', () => {
    expect(parseGraphView({ view: 'lineage', member: 'm1', up: '500', down: '21' })).toMatchObject({
      ancestors: 20,
      descendants: 20,
    })
  })

  it('keeps the first value of a repeated parameter', () => {
    expect(parseGraphView({ view: 'kinship', a: ['m1', 'm9'], b: 'm2' })).toEqual({
      kind: 'kinship',
      firstId: 'm1',
      secondId: 'm2',
    })
  })

  it.each([
    [{ view: 'lineage' }, 'lineage', 'MISSING_MEMBER'],
    [{ view: 'kinship', a: 'm1' }, 'kinship', 'MISSING_MEMBER'],
    [{ view: 'ancestors', a: ' ', b: 'm2' }, 'ancestors', 'MISSING_MEMBER'],
    [{ view: 'ancestors', a: 'x'.repeat(101), b: 'm2' }, 'ancestors', 'MISSING_MEMBER'],
    [{ view: 'kinship', a: 'm1', b: 'm1' }, 'kinship', 'SAME_MEMBER'],
  ])('reports an incomplete request for %o', (params, view, problem) => {
    expect(parseGraphView(params)).toEqual({ kind: 'incomplete', view, problem })
  })
})

describe('lineageHref', () => {
  it('builds a URL the parser reads back', () => {
    const href = lineageHref('tree_1', 'a b', { ancestors: 3, descendants: 2 })
    const params = Object.fromEntries(new URL(href, 'https://ifumb.test').searchParams)

    expect([href.startsWith('/tree/tree_1/graph?'), parseGraphView(params)]).toEqual([
      true,
      { kind: 'lineage', memberId: 'a b', ancestors: 3, descendants: 2 },
    ])
  })
})
