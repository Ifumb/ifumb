import { beforeEach, describe, expect, it } from 'vitest'
import type { PendingChange } from '@/core/entities/pending-change'
import { ReviewAllPendingChangesUseCase } from '@/core/use-cases/review-all-pending-changes'
import type { PendingChangeSummary } from '@/core/use-cases/ports/pending-change-reader'
import { aPendingChange } from '@tests/support/pending-change-fixtures'
import { pendingChangeReviewWorld } from '@tests/support/pending-change-review-world'
import { EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'

describe('ReviewAllPendingChangesUseCase', () => {
  let world: ReturnType<typeof pendingChangeReviewWorld>
  let unitOfWork: ReturnType<typeof pendingChangeReviewWorld>['unitOfWork']
  let pendingChanges: ReturnType<typeof pendingChangeReviewWorld>['pendingChanges']

  beforeEach(() => {
    world = pendingChangeReviewWorld()
    ;({ unitOfWork, pendingChanges } = world)
  })

  /** Seeds one proposal both for the list (`pendingForTree`) and for a later `findById`. */
  function seed(change: PendingChange): void {
    pendingChanges.seedById('tree_diallo', change)
    const summary: PendingChangeSummary = {
      id: change.id,
      authorId: change.authorId,
      authorName: 'Fatou Sow',
      targetType: change.targetType,
      targetId: change.targetId,
      action: change.action,
      snapshotBefore: change.snapshotBefore,
      snapshotAfter: change.snapshotAfter,
      status: change.status,
      createdAt: change.createdAt,
    }
    pendingChanges.seedChange('tree_diallo', summary)
  }

  const reviewAll = (decision: 'APPROVED' | 'REJECTED') =>
    new ReviewAllPendingChangesUseCase(world.deps()).execute({
      treeId: 'tree_diallo',
      viewerId: OWNER_ID,
      decision,
    })

  it('approves every pending proposal, one transaction each', async () => {
    seed(aPendingChange({ id: 'pc_1', targetId: 'mbr_awa', snapshotAfter: { tribe: 'Soninke' } }))
    seed(
      aPendingChange({
        id: 'pc_2',
        targetType: 'UNION',
        targetId: 'u_couple',
        snapshotBefore: { startDate: null },
        snapshotAfter: { startDate: '1955' },
      }),
    )

    expect(await reviewAll('APPROVED')).toEqual({
      ok: true,
      value: { approved: 2, rejected: 0, skipped: 0 },
    })
    expect(unitOfWork.transactions).toBe(2)
  })

  it('skips an outdated proposal without undoing the others', async () => {
    seed(aPendingChange({ id: 'pc_1', targetId: 'mbr_awa', snapshotAfter: { tribe: 'Soninke' } }))
    seed(
      aPendingChange({
        id: 'pc_2',
        targetId: 'mbr_binta',
        action: 'DELETE',
        snapshotBefore: { firstName: 'Quelqu’un d’autre' },
      }),
    )

    expect(await reviewAll('APPROVED')).toEqual({
      ok: true,
      value: { approved: 1, rejected: 0, skipped: 1 },
    })
    expect(unitOfWork.updatedMembers.map((member) => member.details.tribe)).toEqual(['Soninke'])
    expect(unitOfWork.deletedMemberIds).toEqual([])
  })

  it('rejects every pending proposal on demand', async () => {
    seed(aPendingChange({ id: 'pc_1' }))
    seed(aPendingChange({ id: 'pc_2', targetId: 'mbr_binta', action: 'DELETE' }))

    expect(await reviewAll('REJECTED')).toEqual({
      ok: true,
      value: { approved: 0, rejected: 2, skipped: 0 },
    })
    expect(unitOfWork.resolvedChanges.map((change) => change.status)).toEqual([
      'REJECTED',
      'REJECTED',
    ])
  })

  it('refuses an editor with REVIEW_FORBIDDEN', async () => {
    const result = await new ReviewAllPendingChangesUseCase(world.deps()).execute({
      treeId: 'tree_diallo',
      viewerId: EDITOR_ID,
      decision: 'APPROVED',
    })
    expect(result).toEqual({ ok: false, error: { kind: 'REVIEW_FORBIDDEN' } })
  })
})
