import { describe, expect, it } from 'vitest'
import { CrossTreeLink } from '@/core/entities/cross-tree-link'
import { ListCrossTreeLinksUseCase } from '@/core/use-cases/list-cross-tree-links'
import type { CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'
import { CROSS_TREE_NOW, crossTreeWorld, TARGET_TREE_ID } from '@tests/support/cross-tree-world'

const SOURCE_TREE_ID = 'tree_diallo'

function aLinkView(): CrossTreeLinkView {
  return {
    link: CrossTreeLink.establish({
      id: 'ctl_1',
      tree1Id: SOURCE_TREE_ID,
      member1Id: 'mbr_awa',
      tree2Id: TARGET_TREE_ID,
      member2Id: 'mbr_awa_target',
      now: CROSS_TREE_NOW,
    }),
    linkedTreeName: 'Famille Touré',
    linkedMemberName: 'Awa Touré',
    ownMemberName: 'Awa Diallo',
  }
}

describe('ListCrossTreeLinksUseCase', () => {
  it('lists links for anyone who can already read the tree, without a role check', async () => {
    const world = crossTreeWorld()
    world.links.seedView(SOURCE_TREE_ID, aLinkView())
    const useCase = new ListCrossTreeLinksUseCase(world.deps())

    // The target tree is PUBLIC, so even an anonymous visitor can read it.
    const result = await useCase.execute({ treeId: TARGET_TREE_ID })

    expect(result.ok).toBe(true)
  })

  it('refuses a visitor with no access to a private tree', async () => {
    const world = crossTreeWorld()
    const useCase = new ListCrossTreeLinksUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID })

    expect(!result.ok && result.error.kind).toBe('AUTHENTICATION_REQUIRED')
  })

  it('returns the seeded links for the tree asked about', async () => {
    const world = crossTreeWorld()
    world.links.seedView(SOURCE_TREE_ID, aLinkView())
    const useCase = new ListCrossTreeLinksUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: 'usr_owner' })

    expect(result.ok && result.value).toHaveLength(1)
  })
})
