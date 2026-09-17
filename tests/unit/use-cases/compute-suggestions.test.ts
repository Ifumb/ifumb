import { describe, expect, it } from 'vitest'
import { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'
import type { MatchableMember } from '@/core/entities/member-matching'
import { ComputeSuggestionsUseCase } from '@/core/use-cases/compute-suggestions'
import { aMember } from '@tests/support/family-fixtures'
import {
  CROSS_TREE_NOW,
  crossTreeWorld,
  EDITOR_ID,
  OWNER_ID,
  TARGET_TREE_ID,
} from '@tests/support/cross-tree-world'

const SOURCE_TREE_ID = 'tree_diallo'
const SOURCE_MEMBER_ID = 'mbr_awa'
const TARGET_MEMBER_ID = 'mbr_awa_target'

function seedMatchingPair(world: ReturnType<typeof crossTreeWorld>) {
  world.families.seed(SOURCE_TREE_ID, {
    members: [aMember({ firstName: 'Awa', lastName: 'Diallo' })],
    unions: [],
  })
  const candidate: MatchableMember = {
    treeId: TARGET_TREE_ID,
    memberId: TARGET_MEMBER_ID,
    firstName: 'Awa',
    lastName: 'Diallo',
    birthYear: null,
    culturalTokens: [],
  }
  world.pool.seed(candidate)
}

describe('ComputeSuggestionsUseCase', () => {
  it('upserts a matched pair, for the OWNER', async () => {
    const world = crossTreeWorld()
    seedMatchingPair(world)
    const useCase = new ComputeSuggestionsUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: OWNER_ID })

    expect(result.ok && result.value.computed).toBe(1)
    expect(world.unitOfWork.upsertedCrossTreeSuggestions).toHaveLength(1)
    const [suggestion] = world.unitOfWork.upsertedCrossTreeSuggestions
    expect([suggestion?.targetTreeId, suggestion?.targetMemberId, suggestion?.status]).toEqual([
      TARGET_TREE_ID,
      TARGET_MEMBER_ID,
      'NEW',
    ])
  })

  it('also runs for an EDITOR, not only the OWNER', async () => {
    const world = crossTreeWorld()
    seedMatchingPair(world)
    const useCase = new ComputeSuggestionsUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: EDITOR_ID })

    expect(result.ok).toBe(true)
  })

  it('refuses a stranger with no access to the source tree', async () => {
    const world = crossTreeWorld()
    seedMatchingPair(world)
    const useCase = new ComputeSuggestionsUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: 'usr_stranger' })

    expect(!result.ok && result.error.kind).toBe('ACCESS_DENIED')
  })

  it('never touches a pair already ACCEPTED, even when it would still match', async () => {
    const world = crossTreeWorld()
    seedMatchingPair(world)
    world.suggestions.seed(
      CrossTreeSuggestion.create({
        id: 'sug_existing',
        treeId: SOURCE_TREE_ID,
        memberId: SOURCE_MEMBER_ID,
        targetTreeId: TARGET_TREE_ID,
        targetMemberId: TARGET_MEMBER_ID,
        confidence: 'HIGH',
        status: 'ACCEPTED',
        createdAt: CROSS_TREE_NOW,
        updatedAt: CROSS_TREE_NOW,
      }),
    )
    const useCase = new ComputeSuggestionsUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: OWNER_ID })

    expect(result.ok && result.value.computed).toBe(0)
    expect(world.unitOfWork.upsertedCrossTreeSuggestions).toHaveLength(0)
  })

  it('computes nothing when the candidate pool has no match', async () => {
    const world = crossTreeWorld()
    world.families.seed(SOURCE_TREE_ID, {
      members: [aMember({ firstName: 'Awa', lastName: 'Diallo' })],
      unions: [],
    })
    const useCase = new ComputeSuggestionsUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: OWNER_ID })

    expect(result.ok && result.value.computed).toBe(0)
  })
})
