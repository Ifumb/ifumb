import { describe, expect, it } from 'vitest'
import { CrossTreeConnectionRequest } from '@/core/entities/connection-request'
import { RefuseConnectionRequestUseCase } from '@/core/use-cases/refuse-connection-request'
import { CROSS_TREE_NOW, crossTreeWorld, EDITOR_ID, TARGET_OWNER_ID, TARGET_TREE_ID } from '@tests/support/cross-tree-world'

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

describe('RefuseConnectionRequestUseCase', () => {
  it('resolves the request to REFUSED, without creating any link', async () => {
    const world = crossTreeWorld()
    seedRequest(world, new Date(CROSS_TREE_NOW.getTime() + THIRTY_DAYS_MS))
    const useCase = new RefuseConnectionRequestUseCase(world.deps())

    const result = await useCase.execute({
      treeId: TARGET_TREE_ID,
      viewerId: TARGET_OWNER_ID,
      connectionRequestId: 'cxr_1',
    })

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.resolvedConnectionRequests).toHaveLength(1)
    expect(world.unitOfWork.resolvedConnectionRequests[0]?.status).toBe('REFUSED')
    expect(world.unitOfWork.createdCrossTreeLinks).toHaveLength(0)
  })

  it('refuses a request past its expiry, even though it was never swept first', async () => {
    const world = crossTreeWorld()
    seedRequest(world, new Date(CROSS_TREE_NOW.getTime() - 1))
    const useCase = new RefuseConnectionRequestUseCase(world.deps())

    const result = await useCase.execute({
      treeId: TARGET_TREE_ID,
      viewerId: TARGET_OWNER_ID,
      connectionRequestId: 'cxr_1',
    })

    expect(!result.ok && result.error.kind).toBe('CONNECTION_REQUEST_EXPIRED')
  })

  it('refuses anyone but the target tree owner', async () => {
    const world = crossTreeWorld()
    seedRequest(world, new Date(CROSS_TREE_NOW.getTime() + THIRTY_DAYS_MS))
    const useCase = new RefuseConnectionRequestUseCase(world.deps())

    const result = await useCase.execute({
      treeId: TARGET_TREE_ID,
      viewerId: EDITOR_ID,
      connectionRequestId: 'cxr_1',
    })

    expect(!result.ok && result.error.kind).toBe('TREE_MANAGEMENT_FORBIDDEN')
  })
})
