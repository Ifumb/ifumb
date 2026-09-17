import { beforeEach, describe, expect, it } from 'vitest'
import { DeleteMemberUseCase } from '@/core/use-cases/delete-member'
import { GetMemberFormUseCase } from '@/core/use-cases/get-member-form'
import { GetMemberProfileUseCase } from '@/core/use-cases/get-member-profile'
import { CLAIMER_ID, memberWriteWorld } from '@tests/support/member-write-world'
import { EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'

describe('member deletion and permissions', () => {
  let world: ReturnType<typeof memberWriteWorld>
  let unitOfWork: ReturnType<typeof memberWriteWorld>['unitOfWork']
  let trees: ReturnType<typeof memberWriteWorld>['trees']
  let families: ReturnType<typeof memberWriteWorld>['families']

  beforeEach(() => {
    world = memberWriteWorld()
    ;({ unitOfWork, trees, families } = world)
  })

  const deps = () => world.deps()

  describe('DeleteMemberUseCase', () => {
    const remove = (viewerId: string, target = 'mbr_awa') =>
      new DeleteMemberUseCase(deps()).execute({ treeId: 'tree_diallo', memberId: target, viewerId })

    it('deletes the member with its MEMBER_DELETED entry', async () => {
      expect(await remove(OWNER_ID)).toEqual({ ok: true, value: { outcome: 'applied' } })
      expect(unitOfWork.deletedMemberIds).toEqual(['mbr_awa'])
      expect(unitOfWork.auditRecords.map(({ action, diff }) => ({ action, diff }))).toEqual([
        {
          action: 'MEMBER_DELETED',
          diff: {
            before: {
              firstName: 'Awa',
              lastName: 'Diallo',
              gender: 'FEMALE',
              birthDate: '1932-05',
              tribe: 'Peul',
              certainty: 'CONFIRMED',
            },
            after: null,
          },
        },
      ])
    })

    it('proposes an editor deletion instead of refusing it (module 2.6)', async () => {
      const result = await remove(EDITOR_ID)
      expect(result.ok && result.value).toMatchObject({ outcome: 'proposed' })
      expect(unitOfWork.deletedMemberIds).toEqual([])
    })

    it.each([
      [CLAIMER_ID, 'mbr_awa', 'MEMBER_MANAGEMENT_FORBIDDEN'],
      [OWNER_ID, 'mbr_elsewhere', 'MEMBER_NOT_FOUND'],
    ])('refuses %s on %s with %s', async (viewerId, target, kind) => {
      expect(await remove(viewerId, target)).toEqual({ ok: false, error: { kind } })
    })
  })

  describe('GetMemberFormUseCase', () => {
    it('gives the claimer the current values, without the right to delete', async () => {
      const result = await new GetMemberFormUseCase({ trees, families }).execute({
        treeId: 'tree_diallo',
        memberId: 'mbr_awa',
        viewerId: CLAIMER_ID,
      })

      expect(
        result.ok && [result.value.tree, result.value.member.tribe, result.value.canDelete],
      ).toEqual([{ id: 'tree_diallo', name: 'Famille Diallo' }, 'Peul', false])
    })

    it('gives an editor the form too, to propose a change (module 2.6)', async () => {
      const result = await new GetMemberFormUseCase({ trees, families }).execute({
        treeId: 'tree_diallo',
        memberId: 'mbr_awa',
        viewerId: EDITOR_ID,
      })
      expect(result.ok).toBe(true)
    })
  })

  describe('member profile permissions', () => {
    it.each([
      [
        OWNER_ID,
        { canEdit: true, canDelete: true, canManageUnions: true, canClaim: false, claimedByViewer: false },
      ],
      [
        CLAIMER_ID,
        { canEdit: true, canDelete: false, canManageUnions: false, canClaim: false, claimedByViewer: true },
      ],
      [
        EDITOR_ID,
        { canEdit: false, canDelete: false, canManageUnions: false, canClaim: false, claimedByViewer: false },
      ],
    ])('gives %s the actions they may take', async (viewerId, permissions) => {
      const result = await new GetMemberProfileUseCase({ trees, families }).execute({
        treeId: 'tree_diallo',
        memberId: 'mbr_awa',
        viewerId,
      })

      expect(result.ok && result.value.permissions).toEqual(permissions)
    })
  })
})
