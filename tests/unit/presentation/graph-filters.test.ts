import { describe, expect, it } from 'vitest'
import type { MemberNodeData, PositionedNode } from '@/presentation/graph/family-graph-types'
import {
  activeFilterCount,
  filterOptions,
  matchesFilters,
  NO_FILTERS,
  visibleNodeIds,
  withFilter,
} from '@/presentation/graph/graph-filters'
import { nodesWithinHops } from '@/presentation/graph/neighbourhood'

function memberNode(id: string, overrides: Partial<MemberNodeData> = {}): PositionedNode {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      kind: 'member',
      name: id,
      href: `/tree/t/member/${id}`,
      initial: 'X',
      lifespan: null,
      tribesLabel: null,
      photoSrc: null,
      approximate: false,
      pending: null,
      relativeGenerationLabel: null,
      tribes: [],
      ethnicities: [],
      gender: null,
      generation: 0,
      ...overrides,
    },
  }
}

const unionNode: PositionedNode = {
  id: 'union_1',
  position: { x: 0, y: 0 },
  data: {
    ...{ kind: 'union', typeLabel: 'Mariage', icon: 'heart', pending: null },
    ...{ href: '/tree/tree_1/union/union_1', label: 'Mariage' },
  },
}

const nodes = [
  memberNode('moussa', { tribes: ['Peul', 'Malinké'], gender: 'MALE' }),
  memberNode('awa', { tribes: ['Éwé'], ethnicities: ['Wolof'], gender: 'FEMALE' }),
  memberNode('fatou', { generation: 1, gender: 'FEMALE' }),
  memberNode('alone', { generation: 1 }),
  unionNode,
]

const edges = [
  { id: 'e1', source: 'moussa', target: 'union_1' },
  { id: 'e2', source: 'awa', target: 'union_1' },
  { id: 'e3', source: 'union_1', target: 'fatou' },
]

describe('filterOptions', () => {
  it('lists distinct tribes and ethnicities in French order, and generations', () => {
    expect(filterOptions(nodes)).toEqual({
      tribes: ['Éwé', 'Malinké', 'Peul'],
      ethnicities: ['Wolof'],
      generations: [0, 1],
    })
  })
})

describe('matchesFilters', () => {
  const moussa = nodes[0]!.data as MemberNodeData

  it.each([
    [{ tribe: 'Malinké' }, true],
    [{ tribe: 'Éwé' }, false],
    [{ ethnicity: 'Wolof' }, false],
    [{ gender: 'MALE' as const }, true],
    [{ generation: '1' }, false],
    [{ generation: '0', gender: 'MALE' as const }, true],
  ])('with %o matches: %s', (patch, expected) => {
    expect(matchesFilters(moussa, { ...NO_FILTERS, ...patch })).toBe(expected)
  })
})

describe('visibleNodeIds', () => {
  it('shows everything without filters', () => {
    expect(visibleNodeIds(nodes, edges, NO_FILTERS)).toEqual(new Set(nodes.map((n) => n.id)))
  })

  it('keeps a union linked to a matching member', () => {
    const visible = visibleNodeIds(nodes, edges, { ...NO_FILTERS, gender: 'FEMALE' })

    expect(visible).toEqual(new Set(['awa', 'fatou', 'union_1']))
  })

  it('hides a union left without any visible member', () => {
    const visible = visibleNodeIds(nodes, edges, { ...NO_FILTERS, generation: '1', gender: 'MALE' })

    expect(visible).toEqual(new Set())
  })
})

describe('withFilter', () => {
  it('sets one filter from a form value', () => {
    expect(withFilter(NO_FILTERS, 'tribe', 'Peul')).toEqual({ ...NO_FILTERS, tribe: 'Peul' })
  })

  it('keeps a known gender and clears an unknown one', () => {
    const female = withFilter(NO_FILTERS, 'gender', 'FEMALE')

    expect([female.gender, withFilter(female, 'gender', 'NOPE').gender]).toEqual(['FEMALE', ''])
  })
})

describe('activeFilterCount', () => {
  it('counts the filters set', () => {
    expect(activeFilterCount({ ...NO_FILTERS, tribe: 'Peul', generation: '0' })).toBe(2)
  })
})

describe('nodesWithinHops', () => {
  it('reaches partners and children through their union in two hops', () => {
    expect(nodesWithinHops('moussa', 2, edges)).toEqual(
      new Set(['moussa', 'union_1', 'awa', 'fatou']),
    )
  })

  it('stops at the requested distance', () => {
    expect(nodesWithinHops('moussa', 1, edges)).toEqual(new Set(['moussa', 'union_1']))
  })

  it('keeps an isolated member on its own', () => {
    expect(nodesWithinHops('alone', 2, edges)).toEqual(new Set(['alone']))
  })
})
