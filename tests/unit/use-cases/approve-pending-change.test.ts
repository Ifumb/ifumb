import { beforeEach, describe, expect, it } from 'vitest'
import { ApprovePendingChangeUseCase } from '@/core/use-cases/approve-pending-change'
import { aPendingChange } from '@tests/support/pending-change-fixtures'
import { pendingChangeReviewWorld, REVIEW_NOW } from '@tests/support/pending-change-review-world'
import { EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

describe('ApprovePendingChangeUseCase', () => {
  let world: ReturnType<typeof pendingChangeReviewWorld>
  let unitOfWork: ReturnType<typeof pendingChangeReviewWorld>['unitOfWork']
  let pendingChanges: ReturnType<typeof pendingChangeReviewWorld>['pendingChanges']

  beforeEach(() => {
    world = pendingChangeReviewWorld()
    ;({ unitOfWork, pendingChanges } = world)
  })

  const approve = (pendingChangeId: string, viewerId = OWNER_ID) =>
    new ApprovePendingChangeUseCase(world.deps()).execute({
      treeId: 'tree_diallo',
      viewerId,
      pendingChangeId,
    })

  it('creates the proposed member under its already-generated id', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({
        id: 'pc_1',
        targetId: 'mbr_rose',
        action: 'CREATE',
        snapshotBefore: null,
        snapshotAfter: { firstName: 'Rose', tribe: 'Soninke' },
      }),
    )

    expect(await approve('pc_1')).toEqual({ ok: true, value: { applied: true } })
    expect(
      unitOfWork.insertedMembers.map(({ member }) => [member.id.value, member.firstName]),
    ).toEqual([['mbr_rose', 'Rose']])
    expect(unitOfWork.auditRecords).toEqual([
      expect.objectContaining({
        action: 'PENDING_CHANGE_APPROVED',
        targetType: 'MEMBER',
        targetId: 'mbr_rose',
        diff: { before: null, after: { firstName: 'Rose', tribe: 'Soninke' } },
      }),
    ])
    expect(unitOfWork.resolvedChanges).toMatchObject([{ id: 'pc_1', status: 'APPROVED' }])
    expect(unitOfWork.notifications).toMatchObject([
      { userId: EDITOR_ID, type: 'CHANGE_APPROVED', pendingChangeId: 'pc_1' },
    ])
  })

  it('updates only the fields a revision proposed, keeping the target id in the journal', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({
        id: 'pc_2',
        targetId: 'mbr_awa',
        action: 'UPDATE',
        snapshotBefore: { tribe: 'Peul' },
        snapshotAfter: { tribe: 'Soninke' },
      }),
    )

    expect(await approve('pc_2')).toEqual({ ok: true, value: { applied: true } })
    expect(unitOfWork.updatedMembers.map((member) => member.details.tribe)).toEqual(['Soninke'])
    expect(unitOfWork.auditRecords[0]?.targetId).toBe('mbr_awa')
  })

  it('deletes the proposed member and discards no photo when it had none', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({ id: 'pc_3', targetId: 'mbr_binta', action: 'DELETE', snapshotBefore: { firstName: 'Binta' } }),
    )

    expect(await approve('pc_3')).toEqual({ ok: true, value: { applied: true } })
    expect(unitOfWork.deletedMemberIds).toEqual(['mbr_binta'])
  })

  it('creates the proposed union', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({
        id: 'pc_4',
        targetId: 'u_new',
        targetType: 'UNION',
        action: 'CREATE',
        snapshotBefore: null,
        snapshotAfter: { parent1Id: 'mbr_binta', type: 'PARTNERSHIP' },
      }),
    )

    expect(await approve('pc_4')).toEqual({ ok: true, value: { applied: true } })
    expect(unitOfWork.insertedUnions.map(({ union }) => union.id)).toEqual(['u_new'])
  })

  it('updates the proposed union', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({
        id: 'pc_5',
        targetId: 'u_couple',
        targetType: 'UNION',
        action: 'UPDATE',
        snapshotBefore: { startDate: null },
        snapshotAfter: { startDate: '1955-06' },
      }),
    )

    expect(await approve('pc_5')).toEqual({ ok: true, value: { applied: true } })
    expect(unitOfWork.updatedUnions.map((union) => union.startDate?.toString())).toEqual([
      '1955-06',
    ])
  })

  it('deletes the proposed union', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({
        id: 'pc_6',
        targetId: 'u_couple',
        targetType: 'UNION',
        action: 'DELETE',
        snapshotBefore: { type: 'MARRIAGE' },
      }),
    )

    expect(await approve('pc_6')).toEqual({ ok: true, value: { applied: true } })
    expect(unitOfWork.deletedUnionIds).toEqual(['u_couple'])
  })

  it('refuses an outdated proposal, whose recorded "before" no longer matches', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({
        id: 'pc_7',
        targetId: 'mbr_awa',
        action: 'UPDATE',
        snapshotBefore: { tribe: 'Autre chose' },
        snapshotAfter: { tribe: 'Soninke' },
      }),
    )

    expect(await approve('pc_7')).toEqual({ ok: false, error: { kind: 'CHANGE_OUTDATED' } })
    expect(unitOfWork.transactions).toBe(0)
  })

  it('refuses an unreadable proposal instead of writing whatever it names', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({
        id: 'pc_8',
        targetId: 'mbr_awa',
        action: 'UPDATE',
        snapshotBefore: { firstName: 'Awa' },
        snapshotAfter: { firstName: '' },
      }),
    )

    expect(await approve('pc_8')).toEqual({ ok: false, error: { kind: 'PROPOSAL_UNREADABLE' } })
  })

  it('refuses a union revision that would create a cycle', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({
        id: 'pc_9',
        targetId: 'u_couple',
        targetType: 'UNION',
        action: 'UPDATE',
        snapshotBefore: { parent2Id: 'mbr_awa' },
        snapshotAfter: { parent2Id: 'mbr_fatou' },
      }),
    )

    expect(await approve('pc_9')).toEqual({ ok: false, error: { kind: 'FAMILY_CYCLE' } })
  })

  it('refuses a proposal already resolved', async () => {
    pendingChanges.seedById(
      'tree_diallo',
      aPendingChange({ id: 'pc_10', status: 'APPROVED', resolvedAt: REVIEW_NOW, resolvedById: OWNER_ID }),
    )

    expect(await approve('pc_10')).toEqual({ ok: false, error: { kind: 'ALREADY_RESOLVED' } })
  })

  it('refuses an unknown proposal with PENDING_CHANGE_NOT_FOUND', async () => {
    expect(await approve('pc_missing')).toEqual({
      ok: false,
      error: { kind: 'PENDING_CHANGE_NOT_FOUND' },
    })
  })

  it.each([
    [EDITOR_ID, 'REVIEW_FORBIDDEN'],
    [STRANGER_ID, 'ACCESS_DENIED'],
  ])('refuses %s with %s', async (viewerId, kind) => {
    pendingChanges.seedById('tree_diallo', aPendingChange({ id: 'pc_11' }))
    expect(await approve('pc_11', viewerId)).toEqual({ ok: false, error: { kind } })
  })
})
