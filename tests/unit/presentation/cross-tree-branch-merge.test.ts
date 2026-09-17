import { describe, expect, it } from 'vitest'
import { CrossTreeLink } from '@/core/entities/cross-tree-link'
import type { CrossTreeBranch } from '@/core/use-cases/get-cross-tree-branch'
import type { FamilyGraph } from '@/core/use-cases/family-graph-views'
import type { CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'
import { mergeForeignBranch, toMergedFamilyGraphViewModel } from '@/presentation/graph/layout-family-graph'
import { toUnlaidGraph } from '@/presentation/graph/family-graph-view-models'

const NOW = new Date('2026-09-17T10:00:00Z')
const LOCAL_TREE_ID = 'tree_diallo'
const FOREIGN_TREE_ID = 'tree_toure'

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

const localGraph: FamilyGraph = {
  tree: { id: LOCAL_TREE_ID, name: 'Famille Diallo' },
  people: [],
  lineage: null,
  members: [member('mbr_awa', 'Awa')],
  unions: [],
}

const foreignGraph: FamilyGraph = {
  tree: { id: FOREIGN_TREE_ID, name: 'Famille Touré' },
  people: [],
  lineage: null,
  members: [member('mbr_awa_target', 'Awa'), member('mbr_fatou_target', 'Fatou')],
  unions: [
    {
      id: 'u_foreign',
      type: 'MARRIAGE',
      parentIds: ['mbr_awa_target', 'mbr_fatou_target'],
      children: [],
      pendingAction: null,
    },
  ],
}

function aLink(overrides: Partial<Parameters<typeof CrossTreeLink.create>[0]> = {}) {
  return CrossTreeLink.create({
    id: 'ctl_1',
    tree1Id: LOCAL_TREE_ID,
    member1Id: 'mbr_awa',
    tree2Id: FOREIGN_TREE_ID,
    member2Id: 'mbr_awa_target',
    createdAt: NOW,
    ...overrides,
  })
}

function aBranch(overrides: Partial<CrossTreeBranch> = {}): CrossTreeBranch {
  return { link: aLink(), foreignGraph, ...overrides }
}

describe('mergeForeignBranch', () => {
  it('drops the foreign pivot node and rewrites its edges onto the local bridge member', () => {
    const local = toUnlaidGraph(localGraph, null)

    const merged = mergeForeignBranch(local, aBranch(), LOCAL_TREE_ID, null)

    const ids = merged.nodes.map((node) => node.id)
    expect(ids).toContain('member_mbr_awa') // the local bridge member, unchanged
    expect(ids).toContain('member_mbr_fatou_target') // the foreign spouse, kept
    expect(ids).toContain('union_u_foreign')
    expect(ids).not.toContain('member_mbr_awa_target') // the foreign pivot: dropped

    const parentEdge = merged.edges.find((edge) => edge.target === 'union_u_foreign')
    expect(parentEdge?.source).toBe('member_mbr_awa') // remapped from the dropped pivot node
  })

  it('marks every merged-in node as foreign, except the local bridge member itself', () => {
    const local = toUnlaidGraph(localGraph, null)

    const merged = mergeForeignBranch(local, aBranch(), LOCAL_TREE_ID, null)

    const bridge = merged.nodes.find((node) => node.id === 'member_mbr_awa')
    const spouse = merged.nodes.find((node) => node.id === 'member_mbr_fatou_target')
    expect(bridge?.data.foreign).toBeNull()
    expect(spouse?.data.foreign).toEqual({ treeId: FOREIGN_TREE_ID, treeName: 'Famille Touré' })
  })

  it('never duplicates a node reached through two different branches into the same foreign tree', () => {
    const local = toUnlaidGraph(localGraph, null)
    const onceMerged = mergeForeignBranch(local, aBranch(), LOCAL_TREE_ID, null)

    const twiceMerged = mergeForeignBranch(
      onceMerged,
      aBranch({ link: aLink({ id: 'ctl_2' }) }),
      LOCAL_TREE_ID,
      null,
    )

    const occurrences = twiceMerged.nodes.filter((node) => node.id === 'member_mbr_fatou_target')
    expect(occurrences).toHaveLength(1)
  })

  it('leaves the accumulator untouched when the link does not actually touch the local tree', () => {
    const local = toUnlaidGraph(localGraph, null)
    const unrelated = aBranch({ link: aLink({ tree1Id: 'tree_other_a', tree2Id: 'tree_other_b' }) })

    const merged = mergeForeignBranch(local, unrelated, LOCAL_TREE_ID, null)

    expect(merged).toEqual(local)
  })
})

describe('toMergedFamilyGraphViewModel', () => {
  it('shows the local bridge member as expanded once its branch is included', () => {
    const links: readonly CrossTreeLinkView[] = [
      { link: aLink(), linkedTreeName: 'Famille Touré', linkedMemberName: 'Awa', ownMemberName: 'Awa' },
    ]

    const viewModel = toMergedFamilyGraphViewModel(localGraph, links, [aBranch()], null)

    const bridge = viewModel.nodes.find((node) => node.id === 'member_mbr_awa')
    expect(bridge?.data.kind === 'member' && bridge.data.bridgeLinks).toEqual([
      { linkId: 'ctl_1', treeName: 'Famille Touré', expanded: true },
    ])
  })

  it('counts every member actually in the merged graph, not just the local tree’s own', () => {
    const viewModel = toMergedFamilyGraphViewModel(localGraph, [], [aBranch()], null)

    // The local Awa, plus the foreign Fatou (the spouse — the pivot itself is folded onto Awa).
    expect(viewModel.memberCount).toBe(2)
  })
})
