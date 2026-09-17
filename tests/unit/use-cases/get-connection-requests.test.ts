import { describe, expect, it } from 'vitest'
import { CrossTreeConnectionRequest } from '@/core/entities/connection-request'
import { GetConnectionRequestsUseCase } from '@/core/use-cases/get-connection-requests'
import type { ConnectionRequestView } from '@/core/use-cases/ports/connection-request-reader'
import { CROSS_TREE_NOW, crossTreeWorld, EDITOR_ID, OWNER_ID, TARGET_TREE_ID } from '@tests/support/cross-tree-world'

const SOURCE_TREE_ID = 'tree_diallo'

function aRequestView(overrides: Partial<ConnectionRequestView> = {}): ConnectionRequestView {
  return {
    request: CrossTreeConnectionRequest.open({
      id: 'cxr_1',
      requesterTreeId: SOURCE_TREE_ID,
      requesterMemberId: 'mbr_awa',
      targetTreeId: TARGET_TREE_ID,
      targetMemberId: 'mbr_awa_target',
      initiatedByUserId: OWNER_ID,
      expiresAt: new Date(CROSS_TREE_NOW.getTime() + 30 * 24 * 60 * 60 * 1000),
      now: CROSS_TREE_NOW,
    }),
    requesterTreeName: 'Famille Diallo',
    requesterMemberName: 'Awa Diallo',
    targetMemberName: 'Awa Touré',
    ...overrides,
  }
}

describe('GetConnectionRequestsUseCase', () => {
  it('lists pending requests, for the target tree owner', async () => {
    const world = crossTreeWorld()
    const view = aRequestView()
    world.connectionRequests.seed(view.request)
    world.connectionRequests.seedView(view)
    const useCase = new GetConnectionRequestsUseCase(world.deps())

    // TARGET_TREE_ID's owner is `usr_target_owner`, seeded by `crossTreeWorld`.
    const result = await useCase.execute({ treeId: TARGET_TREE_ID, viewerId: 'usr_target_owner' })

    expect(result.ok && result.value).toHaveLength(1)
  })

  it('sweeps stale requests before serving the list', async () => {
    const world = crossTreeWorld()
    const useCase = new GetConnectionRequestsUseCase(world.deps())

    await useCase.execute({ treeId: TARGET_TREE_ID, viewerId: 'usr_target_owner' })

    expect(world.connectionRequestWriter.expiredSweeps).toEqual([
      { targetTreeId: TARGET_TREE_ID, now: CROSS_TREE_NOW },
    ])
  })

  it('refuses anyone but the target tree owner, even a signed-in visitor of its public tree', async () => {
    const world = crossTreeWorld()
    const useCase = new GetConnectionRequestsUseCase(world.deps())

    const result = await useCase.execute({ treeId: TARGET_TREE_ID, viewerId: EDITOR_ID })

    expect(!result.ok && result.error.kind).toBe('TREE_MANAGEMENT_FORBIDDEN')
  })

  it('refuses the source tree owner asking about their own tree — only the target tree owner may list', async () => {
    const world = crossTreeWorld()
    const useCase = new GetConnectionRequestsUseCase(world.deps())

    const result = await useCase.execute({ treeId: SOURCE_TREE_ID, viewerId: EDITOR_ID })

    expect(!result.ok && result.error.kind).toBe('TREE_MANAGEMENT_FORBIDDEN')
  })
})
