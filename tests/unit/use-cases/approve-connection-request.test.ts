import { describe, expect, it } from 'vitest'
import { CrossTreeConnectionRequest } from '@/core/entities/connection-request'
import { ApproveConnectionRequestUseCase } from '@/core/use-cases/approve-connection-request'
import {
  CROSS_TREE_NOW,
  crossTreeWorld,
  EDITOR_ID,
  TARGET_OWNER_ID,
  TARGET_TREE_ID,
} from '@tests/support/cross-tree-world'

const SOURCE_TREE_ID = 'tree_diallo'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function seedRequest(world: ReturnType<typeof crossTreeWorld>, expiresAt: Date) {
  const request = CrossTreeConnectionRequest.open({
    id: 'cxr_1',
    requesterTreeId: SOURCE_TREE_ID,
    requesterMemberId: 'mbr_awa',
    targetTreeId: TARGET_TREE_ID,
    targetMemberId: 'mbr_awa_target',
    initiatedByUserId: EDITOR_ID,
    expiresAt,
    now: CROSS_TREE_NOW,
  })
  world.connectionRequests.seed(request)
  return request
}

describe('ApproveConnectionRequestUseCase', () => {
  it('resolves the request to APPROVED and establishes the link', async () => {
    const world = crossTreeWorld()
    seedRequest(world, new Date(CROSS_TREE_NOW.getTime() + THIRTY_DAYS_MS))
    const useCase = new ApproveConnectionRequestUseCase(world.deps())

    const result = await useCase.execute({
      treeId: TARGET_TREE_ID,
      viewerId: TARGET_OWNER_ID,
      connectionRequestId: 'cxr_1',
    })

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.resolvedConnectionRequests).toHaveLength(1)
    expect(world.unitOfWork.resolvedConnectionRequests[0]?.status).toBe('APPROVED')
    expect(world.unitOfWork.createdCrossTreeLinks).toHaveLength(1)
    const [link] = world.unitOfWork.createdCrossTreeLinks
    expect([link?.tree1Id, link?.member1Id, link?.tree2Id, link?.member2Id]).toEqual([
      SOURCE_TREE_ID,
      'mbr_awa',
      TARGET_TREE_ID,
      'mbr_awa_target',
    ])
  })

  it('refuses a request past its expiry, even though it was never swept first (domain-level fix)', async () => {
    const world = crossTreeWorld()
    seedRequest(world, new Date(CROSS_TREE_NOW.getTime() - 1))
    const useCase = new ApproveConnectionRequestUseCase(world.deps())

    const result = await useCase.execute({
      treeId: TARGET_TREE_ID,
      viewerId: TARGET_OWNER_ID,
      connectionRequestId: 'cxr_1',
    })

    expect(!result.ok && result.error.kind).toBe('CONNECTION_REQUEST_EXPIRED')
    expect(world.unitOfWork.createdCrossTreeLinks).toHaveLength(0)
  })

  it('refuses a request that does not exist', async () => {
    const world = crossTreeWorld()
    const useCase = new ApproveConnectionRequestUseCase(world.deps())

    const result = await useCase.execute({
      treeId: TARGET_TREE_ID,
      viewerId: TARGET_OWNER_ID,
      connectionRequestId: 'cxr_missing',
    })

    expect(!result.ok && result.error.kind).toBe('CONNECTION_REQUEST_NOT_FOUND')
  })

  it('refuses anyone but the target tree owner', async () => {
    const world = crossTreeWorld()
    seedRequest(world, new Date(CROSS_TREE_NOW.getTime() + THIRTY_DAYS_MS))
    const useCase = new ApproveConnectionRequestUseCase(world.deps())

    const result = await useCase.execute({
      treeId: TARGET_TREE_ID,
      viewerId: EDITOR_ID,
      connectionRequestId: 'cxr_1',
    })

    expect(!result.ok && result.error.kind).toBe('TREE_MANAGEMENT_FORBIDDEN')
  })
})
