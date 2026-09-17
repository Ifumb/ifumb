import { describe, expect, it } from 'vitest'
import { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'
import { AcceptSuggestionUseCase, CONNECTION_REQUEST_TTL_MS } from '@/core/use-cases/accept-suggestion'
import { CROSS_TREE_NOW, crossTreeWorld, OWNER_ID, TARGET_TREE_ID } from '@tests/support/cross-tree-world'

const SOURCE_TREE_ID = 'tree_diallo'

function seedSuggestion(world: ReturnType<typeof crossTreeWorld>, id = 'sug_1') {
  const suggestion = CrossTreeSuggestion.propose({
    id,
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

describe('AcceptSuggestionUseCase', () => {
  it('resolves the suggestion to ACCEPTED and opens a connection request expiring in 30 days', async () => {
    const world = crossTreeWorld()
    seedSuggestion(world)
    const useCase = new AcceptSuggestionUseCase(world.deps())

    const result = await useCase.execute({
      treeId: SOURCE_TREE_ID,
      viewerId: OWNER_ID,
      suggestionId: 'sug_1',
    })

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.resolvedCrossTreeSuggestions).toHaveLength(1)
    expect(world.unitOfWork.resolvedCrossTreeSuggestions[0]?.status).toBe('ACCEPTED')
    expect(world.unitOfWork.createdConnectionRequests).toHaveLength(1)
    const [request] = world.unitOfWork.createdConnectionRequests
    expect([request?.requesterTreeId, request?.targetTreeId, request?.status]).toEqual([
      SOURCE_TREE_ID,
      TARGET_TREE_ID,
      'PENDING',
    ])
    expect((request?.expiresAt.getTime() ?? 0) - CROSS_TREE_NOW.getTime()).toBe(CONNECTION_REQUEST_TTL_MS)
  })

  it('refuses a suggestion that does not exist', async () => {
    const world = crossTreeWorld()
    const useCase = new AcceptSuggestionUseCase(world.deps())

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
    const accepted = suggestion.accept(CROSS_TREE_NOW)
    world.suggestions.seed(accepted.ok ? accepted.value : suggestion)
    const useCase = new AcceptSuggestionUseCase(world.deps())

    const result = await useCase.execute({
      treeId: SOURCE_TREE_ID,
      viewerId: OWNER_ID,
      suggestionId: 'sug_1',
    })

    expect(!result.ok && result.error.kind).toBe('SUGGESTION_ALREADY_RESOLVED')
  })

  it('refuses a viewer without contribute access to the tree named in the request', async () => {
    const world = crossTreeWorld()
    seedSuggestion(world)
    const useCase = new AcceptSuggestionUseCase(world.deps())

    // OWNER_ID only owns the source tree; on the public target tree they are a mere VIEWER.
    const result = await useCase.execute({
      treeId: TARGET_TREE_ID,
      viewerId: OWNER_ID,
      suggestionId: 'sug_1',
    })

    expect(!result.ok && result.error.kind).toBe('TREE_CONTRIBUTION_FORBIDDEN')
  })
})
