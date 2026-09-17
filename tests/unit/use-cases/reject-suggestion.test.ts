import { describe, expect, it } from 'vitest'
import { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'
import { RejectSuggestionUseCase } from '@/core/use-cases/reject-suggestion'
import { CROSS_TREE_NOW, crossTreeWorld, OWNER_ID, TARGET_TREE_ID } from '@tests/support/cross-tree-world'

const SOURCE_TREE_ID = 'tree_diallo'

function seedSuggestion(world: ReturnType<typeof crossTreeWorld>) {
  const suggestion = CrossTreeSuggestion.propose({
    id: 'sug_1',
    treeId: SOURCE_TREE_ID,
    memberId: 'mbr_awa',
    targetTreeId: TARGET_TREE_ID,
    targetMemberId: 'mbr_awa_target',
    confidence: 'HIGH',
    now: CROSS_TREE_NOW,
  })
  world.suggestions.seed(suggestion)
  return suggestion
}

describe('RejectSuggestionUseCase', () => {
  it('resolves the suggestion to REJECTED, without opening any connection request', async () => {
    const world = crossTreeWorld()
    seedSuggestion(world)
    const useCase = new RejectSuggestionUseCase(world.deps())

    const result = await useCase.execute({
      treeId: SOURCE_TREE_ID,
      viewerId: OWNER_ID,
      suggestionId: 'sug_1',
    })

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.resolvedCrossTreeSuggestions).toHaveLength(1)
    expect(world.unitOfWork.resolvedCrossTreeSuggestions[0]?.status).toBe('REJECTED')
    expect(world.unitOfWork.createdConnectionRequests).toHaveLength(0)
  })

  it('refuses a suggestion that does not exist', async () => {
    const world = crossTreeWorld()
    const useCase = new RejectSuggestionUseCase(world.deps())

    const result = await useCase.execute({
      treeId: SOURCE_TREE_ID,
      viewerId: OWNER_ID,
      suggestionId: 'sug_missing',
    })

    expect(!result.ok && result.error.kind).toBe('SUGGESTION_NOT_FOUND')
  })

  it('refuses a suggestion already resolved', async () => {
    const world = crossTreeWorld()
    const suggestion = seedSuggestion(world)
    const rejected = suggestion.reject(CROSS_TREE_NOW)
    world.suggestions.seed(rejected.ok ? rejected.value : suggestion)
    const useCase = new RejectSuggestionUseCase(world.deps())

    const result = await useCase.execute({
      treeId: SOURCE_TREE_ID,
      viewerId: OWNER_ID,
      suggestionId: 'sug_1',
    })

    expect(!result.ok && result.error.kind).toBe('SUGGESTION_ALREADY_RESOLVED')
  })
})
