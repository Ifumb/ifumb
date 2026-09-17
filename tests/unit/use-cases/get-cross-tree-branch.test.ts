import { describe, expect, it } from 'vitest'
import { CrossTreeLink } from '@/core/entities/cross-tree-link'
import { GetCrossTreeBranchUseCase } from '@/core/use-cases/get-cross-tree-branch'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import { InMemoryCrossTreeLinkReader } from '@/infrastructure/persistence/in-memory/in-memory-cross-tree-link-reader'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { aMember, memberId } from '@tests/support/family-fixtures'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'

const SOURCE_TREE_ID = 'tree_diallo'
const FOREIGN_TREE_ID = 'tree_toure'
const FOREIGN_OWNER_ID = 'usr_foreign_owner'
const LINK_ID = 'ctl_1'
const NOW = new Date('2026-09-17T00:00:00Z')

function world(foreignVisibility: 'PRIVATE' | 'SHARED' | 'PUBLIC' = 'PRIVATE') {
  const trees = new InMemoryTreeReader()
  trees.seed(
    aStoredTree({ acceptedInvitations: [{ userId: EDITOR_ID, role: 'EDITOR' }] }),
    aStoredTree({
      tree: aTree({
        id: TreeId.fromString(FOREIGN_TREE_ID),
        name: 'Famille Touré',
        visibility: foreignVisibility,
        ownerId: UserId.fromString(FOREIGN_OWNER_ID),
      }),
      ownerName: { firstName: 'Moussa', lastName: 'Touré' },
    }),
  )
  const families = new InMemoryFamilyReader()
  families.seed(FOREIGN_TREE_ID, {
    members: [aMember({ id: memberId('mbr_fatou_target'), firstName: 'Fatou', lastName: 'Touré' })],
    unions: [],
  })
  const links = new InMemoryCrossTreeLinkReader()
  links.seed(
    CrossTreeLink.create({
      id: LINK_ID,
      tree1Id: SOURCE_TREE_ID,
      member1Id: 'mbr_awa',
      tree2Id: FOREIGN_TREE_ID,
      member2Id: 'mbr_fatou_target',
      createdAt: NOW,
    }),
  )
  return { trees, families, links, deps: () => ({ trees, families, links }) }
}

describe('GetCrossTreeBranchUseCase', () => {
  it('grants access to a foreign PRIVATE tree through a valid link — the link is the authorization', async () => {
    const { deps } = world('PRIVATE')
    const useCase = new GetCrossTreeBranchUseCase(deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: OWNER_ID, linkId: LINK_ID })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.foreignGraph.tree.name).toBe('Famille Touré')
    expect(result.ok && result.value.foreignGraph.members.map((m) => m.id)).toEqual([
      'mbr_fatou_target',
    ])
  })

  it('never carries pending-change markers on foreign members', async () => {
    const { deps } = world('PRIVATE')
    const useCase = new GetCrossTreeBranchUseCase(deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: OWNER_ID, linkId: LINK_ID })

    expect(result.ok && result.value.foreignGraph.members.every((m) => m.pendingAction === null)).toBe(
      true,
    )
  })

  it('refuses a viewer with no access to the local tree, whatever the link says', async () => {
    const { deps } = world('PRIVATE')
    const useCase = new GetCrossTreeBranchUseCase(deps())

    const result = await useCase.execute({
      treeId: SOURCE_TREE_ID,
      viewerId: 'usr_stranger',
      linkId: LINK_ID,
    })

    expect(!result.ok && result.error.kind).toBe('ACCESS_DENIED')
  })

  it('404s when the link does not exist', async () => {
    const { deps } = world('PRIVATE')
    const useCase = new GetCrossTreeBranchUseCase(deps())

    const result = await useCase.execute({
      treeId: SOURCE_TREE_ID,
      viewerId: OWNER_ID,
      linkId: 'ctl_missing',
    })

    expect(!result.ok && result.error.kind).toBe('CROSS_TREE_LINK_NOT_FOUND')
  })

  it('404s when the link exists but does not touch the requested tree', async () => {
    const { trees, families, links } = world('PRIVATE')
    links.seed(
      CrossTreeLink.create({
        id: 'ctl_unrelated',
        tree1Id: 'tree_other_a',
        member1Id: 'mbr_a',
        tree2Id: 'tree_other_b',
        member2Id: 'mbr_b',
        createdAt: NOW,
      }),
    )
    const useCase = new GetCrossTreeBranchUseCase({ trees, families, links })

    const result = await useCase.execute({
      treeId: SOURCE_TREE_ID,
      viewerId: OWNER_ID,
      linkId: 'ctl_unrelated',
    })

    expect(!result.ok && result.error.kind).toBe('CROSS_TREE_LINK_NOT_FOUND')
  })

  it('also works for an editor of the local tree, not only its owner', async () => {
    const { deps } = world('PRIVATE')
    const useCase = new GetCrossTreeBranchUseCase(deps())

    const result = await useCase.execute({
      treeId: SOURCE_TREE_ID,
      viewerId: EDITOR_ID,
      linkId: LINK_ID,
    })

    expect(result.ok).toBe(true)
  })
})
