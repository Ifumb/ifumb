import { describe, expect, it } from 'vitest'
import type { FamilyGraph } from '@/core/use-cases/family-graph-views'
import { toFamilyGraphViewModel } from '@/presentation/graph/layout-family-graph'
import type { PositionedNode } from '@/presentation/graph/family-graph-types'

function member(id: string, firstName: string) {
  return {
    id,
    firstName,
    lastName: null,
    nickname: null,
    birthDate: null,
    birthDateApprox: false,
    deathDate: null,
    tribe: null,
    ethnicity: null,
    gender: null,
    certainty: 'CONFIRMED' as const,
    photoUrl: null,
    tribes: [],
    ethnicities: [],
    generation: 0,
    relativeGeneration: null,
    pendingAction: null,
  }
}

const graph: FamilyGraph = {
  tree: { id: 'tree_1', name: 'Famille Diallo' },
  people: [],
  lineage: null,
  members: [member('child', 'Fatou'), member('mother', 'Awa'), member('father', 'Moussa')],
  unions: [
    {
      id: 'u1',
      type: 'MARRIAGE',
      parentIds: ['father', 'mother'],
      children: [{ childId: 'child', filiation: 'BIOLOGICAL' }],
      pendingAction: null,
    },
  ],
}

const byId = (nodes: readonly PositionedNode[], id: string) => {
  const node = nodes.find((candidate) => candidate.id === id)
  if (!node) throw new Error(`No node ${id}`)
  return node
}

describe('toFamilyGraphViewModel', () => {
  const viewModel = toFamilyGraphViewModel(graph, null)

  it('names the tree and counts its members', () => {
    expect([viewModel.treeName, viewModel.treeHref, viewModel.memberCount]).toEqual([
      'Famille Diallo',
      '/tree/tree_1',
      3,
    ])
  })

  it('places parents above their union, and the union above the child', () => {
    const { nodes } = viewModel
    const union = byId(nodes, 'union_u1').position.y

    expect(byId(nodes, 'member_father').position.y).toBeLessThan(union)
    expect(byId(nodes, 'member_child').position.y).toBeGreaterThan(union)
  })

  it('orders nodes top to bottom, then left to right, for the keyboard order', () => {
    const ids = viewModel.nodes.map((node) => node.id)

    expect(ids.slice(0, 2).sort()).toEqual(['member_father', 'member_mother'])
    expect(ids.slice(2)).toEqual(['union_u1', 'member_child'])
    const [first, second] = viewModel.nodes
    expect(first!.position.x).toBeLessThan(second!.position.x)
  })

  it('lays out the same graph the same way every time', () => {
    expect(toFamilyGraphViewModel(graph, null)).toEqual(viewModel)
  })
})
