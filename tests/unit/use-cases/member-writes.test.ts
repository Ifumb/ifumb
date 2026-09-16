import { beforeEach, describe, expect, it } from 'vitest'
import { CreateMemberUseCase } from '@/core/use-cases/create-member'
import { UpdateMemberUseCase } from '@/core/use-cases/update-member'
import { dateOf } from '@tests/support/family-fixtures'
import { memberInput } from '@tests/support/member-inputs'
import { CLAIMER_ID, MEMBER_WRITES_NOW, memberWriteWorld } from '@tests/support/member-write-world'
import { EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

describe('member creation and update', () => {
  let world: ReturnType<typeof memberWriteWorld>
  let unitOfWork: ReturnType<typeof memberWriteWorld>['unitOfWork']

  beforeEach(() => {
    world = memberWriteWorld()
    ;({ unitOfWork } = world)
  })

  const deps = () => world.deps()

  describe('CreateMemberUseCase', () => {
    it('creates a member and its MEMBER_CREATED entry in one transaction', async () => {
      const result = await new CreateMemberUseCase(deps()).execute({
        treeId: 'tree_diallo',
        viewerId: OWNER_ID,
        ...memberInput({ firstName: 'Fatou', tribe: null, birthDate: null, gender: null }),
      })

      expect(result).toEqual({ ok: true, value: { outcome: 'applied', memberId: 'usr_1' } })
      expect(unitOfWork.transactions).toBe(1)
      expect(
        unitOfWork.insertedMembers.map(({ treeId, member }) => [treeId, member.firstName]),
      ).toEqual([['tree_diallo', 'Fatou']])
      expect(unitOfWork.auditRecords).toEqual([
        {
          id: 'usr_2',
          treeId: 'tree_diallo',
          authorId: OWNER_ID,
          action: 'MEMBER_CREATED',
          targetType: 'MEMBER',
          targetId: 'usr_1',
          diff: {
            before: null,
            after: { firstName: 'Fatou', lastName: 'Diallo', certainty: 'CONFIRMED' },
          },
          createdAt: MEMBER_WRITES_NOW,
        },
      ])
    })

    it('refuses a death before the birth and writes nothing', async () => {
      const result = await new CreateMemberUseCase(deps()).execute({
        treeId: 'tree_diallo',
        viewerId: OWNER_ID,
        ...memberInput({ birthDate: dateOf('1950'), deathDate: dateOf('1949') }),
      })

      expect([result, unitOfWork.transactions]).toEqual([
        { ok: false, error: { kind: 'DEATH_BEFORE_BIRTH' } },
        0,
      ])
    })

    it('writes nothing when the transaction fails', async () => {
      unitOfWork.failNextAuditRecord()

      await expect(
        new CreateMemberUseCase(deps()).execute({
          treeId: 'tree_diallo',
          viewerId: OWNER_ID,
          ...memberInput(),
        }),
      ).rejects.toThrow()

      expect([unitOfWork.insertedMembers, unitOfWork.auditRecords]).toEqual([[], []])
    })

    it.each([
      [{ treeId: 'tree_unknown', viewerId: OWNER_ID }, 'TREE_NOT_FOUND'],
      [{ treeId: 'tree_diallo', viewerId: STRANGER_ID }, 'ACCESS_DENIED'],
      [{ treeId: 'tree_diallo', viewerId: CLAIMER_ID }, 'MEMBER_MANAGEMENT_FORBIDDEN'],
    ])('refuses %o with %s', async (input, kind) => {
      expect(await new CreateMemberUseCase(deps()).execute({ ...input, ...memberInput() })).toEqual(
        {
          ok: false,
          error: { kind },
        },
      )
    })

    it('proposes an editor addition instead of refusing it (module 2.6)', async () => {
      const result = await new CreateMemberUseCase(deps()).execute({
        treeId: 'tree_diallo',
        viewerId: EDITOR_ID,
        ...memberInput({ firstName: 'Fatou' }),
      })

      expect(result.ok && result.value).toMatchObject({ outcome: 'proposed' })
      expect(unitOfWork.insertedMembers).toEqual([])
      expect(unitOfWork.proposedChanges).toMatchObject([
        { authorId: EDITOR_ID, targetType: 'MEMBER', action: 'CREATE', status: 'PENDING' },
      ])
      expect(unitOfWork.notifications).toMatchObject([
        { userId: OWNER_ID, type: 'PENDING_CHANGE_CREATED' },
      ])
      // reason: pendingCount reads through the (separate) InMemoryPendingChangeReader fake, which
      // this test does not seed — 0 here, unlike production, where the same table backs both the
      // writer and the reader. The exact count is an integration-test concern (prisma-pending-changes).
      expect(world.mailer.sent).toMatchObject([{ editorName: 'Fatou Sow', pendingCount: 0 }])
    })
  })

  describe('UpdateMemberUseCase', () => {
    const update = (viewerId: string, overrides = {}, target = 'mbr_awa') =>
      new UpdateMemberUseCase(deps()).execute({
        treeId: 'tree_diallo',
        memberId: target,
        viewerId,
        ...memberInput(overrides),
      })

    it('updates the member and records only the changed fields', async () => {
      expect(await update(OWNER_ID, { tribe: '', nickname: 'Mama' })).toEqual({
        ok: true,
        value: { outcome: 'applied', changed: true },
      })
      expect(
        unitOfWork.updatedMembers.map((member) => [member.details.tribe, member.details.nickname]),
      ).toEqual([[null, 'Mama']])
      expect(
        unitOfWork.auditRecords.map(({ action, targetId, diff }) => ({ action, targetId, diff })),
      ).toEqual([
        {
          action: 'MEMBER_UPDATED',
          targetId: 'mbr_awa',
          diff: {
            before: { nickname: null, tribe: 'Peul' },
            after: { nickname: 'Mama', tribe: null },
          },
        },
      ])
    })

    it('lets the claimer edit their own member', async () => {
      expect(await update(CLAIMER_ID, { nickname: 'Mama' })).toEqual({
        ok: true,
        value: { outcome: 'applied', changed: true },
      })
    })

    it('proposes an editor revision instead of refusing it (module 2.6)', async () => {
      const result = await update(EDITOR_ID, { nickname: 'Mama' })
      expect(result.ok && result.value).toMatchObject({ outcome: 'proposed' })
      expect(unitOfWork.updatedMembers).toEqual([])
    })

    it('writes nothing when nothing changed', async () => {
      expect(await update(OWNER_ID)).toEqual({
        ok: true,
        value: { outcome: 'applied', changed: false },
      })
      expect(unitOfWork.transactions).toBe(0)
    })

    it('refuses a death before the birth', async () => {
      expect(await update(OWNER_ID, { deathDate: dateOf('1932-04') })).toEqual({
        ok: false,
        error: { kind: 'DEATH_BEFORE_BIRTH' },
      })
    })

    it.each([
      [CLAIMER_ID, 'mbr_moussa', 'MEMBER_EDIT_FORBIDDEN'],
      [OWNER_ID, 'mbr_elsewhere', 'MEMBER_NOT_FOUND'],
      [STRANGER_ID, 'mbr_awa', 'ACCESS_DENIED'],
    ])('refuses %s on %s with %s', async (viewerId, target, kind) => {
      expect(await update(viewerId, {}, target)).toEqual({ ok: false, error: { kind } })
      expect(unitOfWork.transactions).toBe(0)
    })
  })
})
