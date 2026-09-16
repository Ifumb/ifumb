import { beforeEach, describe, expect, it } from 'vitest'
import { CreateUnionUseCase, type CreateUnionInput } from '@/core/use-cases/create-union'
import { DeleteUnionUseCase } from '@/core/use-cases/delete-union'
import { UpdateUnionUseCase, type UpdateUnionInput } from '@/core/use-cases/update-union'
import { dateOf } from '@tests/support/family-fixtures'
import { EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'
import { UNION_WRITES_NOW, unionWriteWorld } from '@tests/support/union-write-world'

const details = {
  type: 'MARRIAGE',
  parent1Id: 'mbr_fatou',
  parent2Id: 'mbr_binta',
  startDate: dateOf('1990'),
  endDate: null,
} as const

describe('union creation, revision and deletion', () => {
  let world: ReturnType<typeof unionWriteWorld>
  let unitOfWork: ReturnType<typeof unionWriteWorld>['unitOfWork']

  beforeEach(() => {
    world = unionWriteWorld()
    ;({ unitOfWork } = world)
  })

  describe('CreateUnionUseCase', () => {
    const create = (input: Partial<CreateUnionInput> = {}) =>
      new CreateUnionUseCase(world.deps()).execute({
        treeId: 'tree_diallo',
        viewerId: OWNER_ID,
        ...details,
        ...input,
      })

    it('creates a union and its UNION_CREATED entry in one transaction', async () => {
      expect(await create()).toEqual({ ok: true, value: { outcome: 'applied', unionId: 'usr_1' } })
      const [inserted] = unitOfWork.insertedUnions
      expect([inserted?.treeId, inserted?.union.parentIds.map((id) => id.value)]).toEqual([
        'tree_diallo',
        ['mbr_fatou', 'mbr_binta'],
      ])
      expect(unitOfWork.auditRecords).toEqual([
        {
          id: 'usr_2',
          treeId: 'tree_diallo',
          authorId: OWNER_ID,
          action: 'UNION_CREATED',
          targetType: 'UNION',
          targetId: 'usr_1',
          diff: {
            before: null,
            after: {
              type: 'MARRIAGE',
              parent1Name: 'Fatou Diallo',
              parent2Name: 'Binta Barry',
              startDate: '1990',
            },
          },
          createdAt: UNION_WRITES_NOW,
        },
      ])
    })

    it('stores nothing when the history entry fails', async () => {
      unitOfWork.failNextAuditRecord()

      await expect(create()).rejects.toThrow()
      expect(unitOfWork.insertedUnions).toEqual([])
    })

    it.each([
      [{ treeId: 'tree_missing' }, 'TREE_NOT_FOUND'],
      [{ viewerId: STRANGER_ID }, 'ACCESS_DENIED'],
      [{ parent2Id: 'mbr_elsewhere' }, 'PARENT_NOT_FOUND'],
      [{ parent2Id: 'mbr_fatou' }, 'SAME_PARENT_TWICE'],
      [{ startDate: dateOf('2000'), endDate: dateOf('1999') }, 'END_BEFORE_START'],
    ])('refuses %o with %s', async (input, kind) => {
      expect(await create(input)).toEqual({ ok: false, error: { kind } })
      expect(unitOfWork.transactions).toBe(0)
    })

    it('proposes an editor union instead of refusing it (module 2.6)', async () => {
      const result = await create({ viewerId: EDITOR_ID })
      expect(result.ok && result.value).toMatchObject({ outcome: 'proposed' })
      expect(unitOfWork.insertedUnions).toEqual([])
    })
  })

  describe('UpdateUnionUseCase', () => {
    const update = (input: Partial<UpdateUnionInput> = {}, unionId = 'u_fatou') =>
      new UpdateUnionUseCase(world.deps()).execute({
        treeId: 'tree_diallo',
        unionId,
        viewerId: OWNER_ID,
        ...{ type: 'BIOLOGICAL', parent1Id: 'mbr_fatou', parent2Id: null },
        ...{ startDate: null, endDate: null },
        ...input,
      })

    it('completes an unknown parent and records only that change', async () => {
      expect(await update({ parent2Id: 'mbr_binta' })).toEqual({
        ok: true,
        value: { outcome: 'applied', changed: true },
      })
      expect(unitOfWork.updatedUnions.map((union) => union.parent2Id?.value)).toEqual(['mbr_binta'])
      expect(
        unitOfWork.auditRecords.map(({ action, targetId, diff }) => [action, targetId, diff]),
      ).toEqual([
        [
          'UNION_UPDATED',
          'u_fatou',
          { before: { parent2Name: null }, after: { parent2Name: 'Binta Barry' } },
        ],
      ])
    })

    it('writes nothing when nothing changed, whatever the order of the parents', async () => {
      const unchanged = { type: 'MARRIAGE', parent1Id: 'mbr_awa', parent2Id: 'mbr_moussa' } as const

      expect(await update(unchanged, 'u_couple')).toEqual({
        ok: true,
        value: { outcome: 'applied', changed: false },
      })
      expect(unitOfWork.transactions).toBe(0)
    })

    it.each([
      [{ parent2Id: 'mbr_ali' }, 'u_couple', 'FAMILY_CYCLE'],
      [{ parent1Id: 'mbr_moussa', parent2Id: 'mbr_fatou' }, 'u_couple', 'FAMILY_CYCLE'],
      [{ parent2Id: 'mbr_elsewhere' }, 'u_fatou', 'PARENT_NOT_FOUND'],
      [{ parent2Id: 'mbr_fatou' }, 'u_fatou', 'SAME_PARENT_TWICE'],
      [{ startDate: dateOf('2000'), endDate: dateOf('1999') }, 'u_fatou', 'END_BEFORE_START'],
      [{}, 'u_elsewhere', 'UNION_NOT_FOUND'],
    ])('refuses %o on %s with %s', async (input, unionId, kind) => {
      expect(await update(input, unionId)).toEqual({ ok: false, error: { kind } })
      expect(unitOfWork.transactions).toBe(0)
    })

    it('proposes an editor revision instead of refusing it (module 2.6)', async () => {
      const result = await update({ viewerId: EDITOR_ID, parent2Id: 'mbr_binta' })
      expect(result.ok && result.value).toMatchObject({ outcome: 'proposed' })
      expect(unitOfWork.updatedUnions).toEqual([])
    })
  })

  describe('DeleteUnionUseCase', () => {
    const remove = (unionId: string, viewerId = OWNER_ID) =>
      new DeleteUnionUseCase(world.deps()).execute({ treeId: 'tree_diallo', unionId, viewerId })

    it('deletes the union and records the children who lose that link', async () => {
      expect(await remove('u_couple')).toEqual({ ok: true, value: { outcome: 'applied' } })
      expect(unitOfWork.deletedUnionIds).toEqual(['u_couple'])
      expect(unitOfWork.auditRecords.map(({ action, diff }) => [action, diff])).toEqual([
        [
          'UNION_DELETED',
          {
            before: {
              type: 'MARRIAGE',
              parent1Name: 'Moussa Diallo',
              parent2Name: 'Awa Diallo',
              childrenNames: 'Fatou Diallo',
            },
            after: null,
          },
        ],
      ])
    })

    it.each([['u_elsewhere', OWNER_ID, 'UNION_NOT_FOUND']])(
      'refuses %s for %s with %s',
      async (unionId, viewerId, kind) => {
        expect(await remove(unionId, viewerId)).toEqual({ ok: false, error: { kind } })
      },
    )

    it('proposes an editor deletion instead of refusing it (module 2.6)', async () => {
      const result = await remove('u_couple', EDITOR_ID)
      expect(result.ok && result.value).toMatchObject({ outcome: 'proposed' })
      expect(unitOfWork.deletedUnionIds).toEqual([])
    })
  })
})
