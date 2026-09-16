import { beforeEach, describe, expect, it } from 'vitest'
import { REJECTION_COMMENT_MAX_LENGTH } from '@/core/entities/pending-change'
import { RejectPendingChangeUseCase } from '@/core/use-cases/reject-pending-change'
import { aPendingChange } from '@tests/support/pending-change-fixtures'
import { pendingChangeReviewWorld } from '@tests/support/pending-change-review-world'
import { EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

describe('RejectPendingChangeUseCase', () => {
  let world: ReturnType<typeof pendingChangeReviewWorld>
  let unitOfWork: ReturnType<typeof pendingChangeReviewWorld>['unitOfWork']
  let pendingChanges: ReturnType<typeof pendingChangeReviewWorld>['pendingChanges']

  beforeEach(() => {
    world = pendingChangeReviewWorld()
    ;({ unitOfWork, pendingChanges } = world)
  })

  const reject = (pendingChangeId: string, comment?: string | null, viewerId = OWNER_ID) =>
    new RejectPendingChangeUseCase(world.deps()).execute({
      treeId: 'tree_diallo',
      viewerId,
      pendingChangeId,
      comment,
    })

  it('rejects a pending proposal with a comment, journalled and notified to its author', async () => {
    pendingChanges.seedById('tree_diallo', aPendingChange({ id: 'pc_1' }))

    expect(await reject('pc_1', 'Vérifie la source de cette tribu.')).toEqual({
      ok: true,
      value: { rejected: true },
    })
    expect(unitOfWork.resolvedChanges).toMatchObject([
      { id: 'pc_1', status: 'REJECTED', rejectionComment: 'Vérifie la source de cette tribu.' },
    ])
    expect(unitOfWork.auditRecords).toEqual([
      expect.objectContaining({ action: 'PENDING_CHANGE_REJECTED', targetId: 'mbr_awa' }),
    ])
    expect(unitOfWork.notifications).toMatchObject([
      { userId: EDITOR_ID, type: 'CHANGE_REJECTED', pendingChangeId: 'pc_1' },
    ])
  })

  it('rejects without a comment', async () => {
    pendingChanges.seedById('tree_diallo', aPendingChange({ id: 'pc_2' }))
    expect(await reject('pc_2')).toEqual({ ok: true, value: { rejected: true } })
  })

  it('refuses a comment past the length limit, writing nothing', async () => {
    pendingChanges.seedById('tree_diallo', aPendingChange({ id: 'pc_3' }))
    await expect(reject('pc_3', 'x'.repeat(REJECTION_COMMENT_MAX_LENGTH + 1))).rejects.toThrow()
    expect(unitOfWork.transactions).toBe(0)
  })

  it('refuses a proposal already resolved', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({ id: 'pc_4', status: 'REJECTED', resolvedById: OWNER_ID }),
    )
    expect(await reject('pc_4')).toEqual({ ok: false, error: { kind: 'ALREADY_RESOLVED' } })
  })

  it.each([
    [EDITOR_ID, 'REVIEW_FORBIDDEN'],
    [STRANGER_ID, 'ACCESS_DENIED'],
  ])('refuses %s with %s', async (viewerId, kind) => {
    pendingChanges.seedById('tree_diallo', aPendingChange({ id: 'pc_5' }))
    expect(await reject('pc_5', null, viewerId)).toEqual({ ok: false, error: { kind } })
  })
})
