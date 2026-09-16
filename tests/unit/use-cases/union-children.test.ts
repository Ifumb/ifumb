import { beforeEach, describe, expect, it } from 'vitest'
import { AddUnionChildUseCase } from '@/core/use-cases/add-union-child'
import { GetUnionUseCase } from '@/core/use-cases/get-union'
import { GetUnionFormUseCase } from '@/core/use-cases/get-union-form'
import { RemoveUnionChildUseCase } from '@/core/use-cases/remove-union-child'
import { EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'
import { unionWriteWorld } from '@tests/support/union-write-world'

describe('union children and union reads', () => {
  let world: ReturnType<typeof unionWriteWorld>
  let unitOfWork: ReturnType<typeof unionWriteWorld>['unitOfWork']

  beforeEach(() => {
    world = unionWriteWorld()
    ;({ unitOfWork } = world)
  })

  const target = (unionId: string, viewerId = OWNER_ID) => ({
    treeId: 'tree_diallo',
    unionId,
    viewerId,
  })

  describe('AddUnionChildUseCase', () => {
    const add = (childId: string, unionId = 'u_couple', viewerId = OWNER_ID) =>
      new AddUnionChildUseCase(world.deps()).execute({
        ...target(unionId, viewerId),
        childId,
        filiation: 'ADOPTIVE',
      })

    it('links the child with its filiation and records it on the union', async () => {
      expect(await add('mbr_binta')).toEqual({ ok: true, value: { childName: 'Binta Barry' } })
      expect(unitOfWork.addedUnionChildren).toEqual([
        { unionId: 'u_couple', linkId: 'usr_1', childId: 'mbr_binta', filiation: 'ADOPTIVE' },
      ])
      expect(
        unitOfWork.auditRecords.map(({ action, targetId, diff }) => [action, targetId, diff]),
      ).toEqual([
        [
          'UNION_UPDATED',
          'u_couple',
          { before: null, after: { addedChildName: 'Binta Barry', filiation: 'ADOPTIVE' } },
        ],
      ])
    })

    it.each([
      ['mbr_elsewhere', 'u_couple', OWNER_ID, 'CHILD_NOT_FOUND'],
      ['mbr_moussa', 'u_couple', OWNER_ID, 'CHILD_IS_PARENT'],
      ['mbr_fatou', 'u_couple', OWNER_ID, 'ALREADY_CHILD'],
      ['mbr_moussa', 'u_fatou', OWNER_ID, 'FAMILY_CYCLE'],
      ['mbr_fatou', 'u_again', OWNER_ID, 'SAME_PARENTS_UNION_EXISTS'],
      ['mbr_binta', 'u_elsewhere', OWNER_ID, 'UNION_NOT_FOUND'],
      ['mbr_binta', 'u_couple', EDITOR_ID, 'UNION_MANAGEMENT_FORBIDDEN'],
    ])('refuses %s in %s for %s with %s', async (childId, unionId, viewerId, kind) => {
      expect(await add(childId, unionId, viewerId)).toEqual({ ok: false, error: { kind } })
      expect(unitOfWork.transactions).toBe(0)
    })
  })

  describe('RemoveUnionChildUseCase', () => {
    const removeChild = (childId: string, viewerId = OWNER_ID) =>
      new RemoveUnionChildUseCase(world.deps()).execute({
        ...target('u_couple', viewerId),
        childId,
      })

    it('unlinks the child and records its name and filiation', async () => {
      expect(await removeChild('mbr_fatou')).toEqual({
        ok: true,
        value: { childName: 'Fatou Diallo' },
      })
      expect(unitOfWork.removedUnionChildren).toEqual([
        { unionId: 'u_couple', childId: 'mbr_fatou' },
      ])
      expect(unitOfWork.auditRecords.map(({ diff }) => diff)).toEqual([
        { before: { removedChildName: 'Fatou Diallo', filiation: 'BIOLOGICAL' }, after: null },
      ])
    })

    it.each([
      ['mbr_binta', OWNER_ID, 'NOT_A_CHILD'],
      ['mbr_fatou', EDITOR_ID, 'UNION_MANAGEMENT_FORBIDDEN'],
    ])('refuses %s for %s with %s', async (childId, viewerId, kind) => {
      expect(await removeChild(childId, viewerId)).toEqual({ ok: false, error: { kind } })
    })
  })

  describe('GetUnionUseCase', () => {
    const read = (unionId: string, viewerId = OWNER_ID) =>
      new GetUnionUseCase(world).execute(target(unionId, viewerId))

    it('shows a reader the union, its people, and no management options', async () => {
      const result = await read('u_couple', EDITOR_ID)

      expect(result.ok && result.value).toMatchObject({
        tree: { id: 'tree_diallo', name: 'Famille Diallo', isPublic: false },
        union: {
          id: 'u_couple',
          type: 'MARRIAGE',
          parents: [
            { id: 'mbr_moussa', firstName: 'Moussa', lastName: 'Diallo' },
            { id: 'mbr_awa', firstName: 'Awa', lastName: 'Diallo' },
          ],
          children: [{ person: { id: 'mbr_fatou' }, filiation: 'BIOLOGICAL' }],
        },
        canManage: false,
        memberOptions: [],
      })
    })

    it('gives the owner every member as a possible child', async () => {
      const result = await read('u_couple')

      expect(result.ok && [result.value.canManage, result.value.memberOptions.length]).toEqual([
        true,
        5,
      ])
    })

    it('refuses an unknown union with UNION_NOT_FOUND', async () => {
      expect(await read('u_elsewhere')).toEqual({ ok: false, error: { kind: 'UNION_NOT_FOUND' } })
    })
  })

  describe('GetUnionFormUseCase', () => {
    const form = (input: { unionId?: string; viewerId?: string }) =>
      new GetUnionFormUseCase(world).execute({
        treeId: 'tree_diallo',
        viewerId: input.viewerId ?? OWNER_ID,
        unionId: input.unionId,
      })

    it('gives the owner the members sorted by name, and no union for a new one', async () => {
      const result = await form({})

      expect(result.ok && result.value.members.map((member) => member.firstName)).toEqual([
        'Ali',
        'Awa',
        'Binta',
        'Fatou',
        'Moussa',
      ])
      expect(result.ok && [result.value.tree, result.value.union]).toEqual([
        { id: 'tree_diallo', name: 'Famille Diallo' },
        null,
      ])
    })

    it('gives the current details of an existing union', async () => {
      const result = await form({ unionId: 'u_fatou' })

      expect(result.ok && result.value.union).toEqual({
        id: 'u_fatou',
        type: 'BIOLOGICAL',
        parent1Id: 'mbr_fatou',
        parent2Id: null,
        startDate: null,
        endDate: null,
      })
    })

    it('gives an editor the form too, to propose a union (module 2.6)', async () => {
      const result = await form({ viewerId: EDITOR_ID })
      expect(result.ok).toBe(true)
    })

    it.each([[{ unionId: 'u_elsewhere' }, 'UNION_NOT_FOUND']])(
      'refuses %o with %s',
      async (input, kind) => {
        expect(await form(input)).toEqual({ ok: false, error: { kind } })
      },
    )
  })
})
