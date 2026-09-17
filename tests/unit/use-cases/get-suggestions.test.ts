import { describe, expect, it } from 'vitest'
import { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'
import { GetSuggestionsUseCase } from '@/core/use-cases/get-suggestions'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { SuggestionView } from '@/core/use-cases/ports/cross-tree-suggestion-reader'
import { CROSS_TREE_NOW, crossTreeWorld, EDITOR_ID, OWNER_ID, TARGET_TREE_ID } from '@tests/support/cross-tree-world'
import { aStoredTree, aTree } from '@tests/support/tree-fixtures'

const SOURCE_TREE_ID = 'tree_diallo'
const PRIVATE_TREE_ID = 'tree_private'
const PRIVATE_TREE_OWNER_ID = 'usr_other_owner'

function aSuggestionView(overrides: Partial<SuggestionView> = {}): SuggestionView {
  return {
    suggestion: CrossTreeSuggestion.propose({
      id: 'sug_1',
      treeId: SOURCE_TREE_ID,
      memberId: 'mbr_awa',
      targetTreeId: TARGET_TREE_ID,
      targetMemberId: 'mbr_awa_target',
      confidence: 'HIGH',
      now: CROSS_TREE_NOW,
    }),
    memberName: 'Awa Diallo',
    targetTreeName: 'Famille Touré',
    targetMemberName: 'Awa Touré',
    ...overrides,
  }
}

describe('GetSuggestionsUseCase', () => {
  it('shows a suggestion whose target tree the viewer can read', async () => {
    const world = crossTreeWorld()
    world.suggestions.seed(aSuggestionView().suggestion)
    world.suggestions.seedView(aSuggestionView())
    const useCase = new GetSuggestionsUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: OWNER_ID })

    expect(result.ok && result.value).toHaveLength(1)
  })

  it('hides a suggestion whose target tree the viewer cannot read, even as an editor of the source tree', async () => {
    const world = crossTreeWorld()
    world.trees.seed(
      aStoredTree({
        tree: aTree({
          id: TreeId.fromString(PRIVATE_TREE_ID),
          name: 'Arbre privé',
          visibility: 'PRIVATE',
          ownerId: UserId.fromString(PRIVATE_TREE_OWNER_ID),
        }),
        ownerName: { firstName: 'Autre', lastName: 'Propriétaire' },
      }),
    )
    const view = aSuggestionView({
      suggestion: CrossTreeSuggestion.propose({
        id: 'sug_private',
        treeId: SOURCE_TREE_ID,
        memberId: 'mbr_awa',
        targetTreeId: PRIVATE_TREE_ID,
        targetMemberId: 'mbr_hidden',
        confidence: 'HIGH',
        now: CROSS_TREE_NOW,
      }),
      targetTreeName: 'Arbre privé',
    })
    world.suggestions.seed(view.suggestion)
    world.suggestions.seedView(view)
    const useCase = new GetSuggestionsUseCase(world.deps())

    // EDITOR_ID is an editor of the source tree, but has no access at all to the private target tree.
    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: EDITOR_ID })

    expect(result.ok && result.value).toHaveLength(0)
  })

  it('shows a mix correctly: only the readable-target suggestion survives the filter', async () => {
    const world = crossTreeWorld()
    world.trees.seed(
      aStoredTree({
        tree: aTree({
          id: TreeId.fromString(PRIVATE_TREE_ID),
          name: 'Arbre privé',
          visibility: 'PRIVATE',
          ownerId: UserId.fromString(PRIVATE_TREE_OWNER_ID),
        }),
        ownerName: { firstName: 'Autre', lastName: 'Propriétaire' },
      }),
    )
    const readable = aSuggestionView()
    const hidden = aSuggestionView({
      suggestion: CrossTreeSuggestion.propose({
        id: 'sug_private',
        treeId: SOURCE_TREE_ID,
        memberId: 'mbr_awa',
        targetTreeId: PRIVATE_TREE_ID,
        targetMemberId: 'mbr_hidden',
        confidence: 'HIGH',
        now: CROSS_TREE_NOW,
      }),
      targetTreeName: 'Arbre privé',
    })
    world.suggestions.seed(readable.suggestion)
    world.suggestions.seedView(readable)
    world.suggestions.seed(hidden.suggestion)
    world.suggestions.seedView(hidden)
    const useCase = new GetSuggestionsUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: OWNER_ID })

    expect(result.ok && result.value.map((view) => view.suggestion.id)).toEqual(['sug_1'])
  })

  it('refuses a viewer with no access to the source tree itself', async () => {
    const world = crossTreeWorld()
    const useCase = new GetSuggestionsUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: 'usr_stranger' })

    expect(!result.ok && result.error.kind).toBe('ACCESS_DENIED')
  })
})
