import { describe, expect, it } from 'vitest'
import type { VisibilityMask } from '@/core/entities/member'
import { SetMemberVisibilityMaskUseCase } from '@/core/use-cases/set-member-visibility-mask'
import { aMember, dateOf, memberId } from '@tests/support/family-fixtures'
import { CLAIMER_ID, memberWriteWorld } from '@tests/support/member-write-world'
import { EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'

describe('SetMemberVisibilityMaskUseCase', () => {
  const setMask = (viewerId: string, mask: VisibilityMask, memberId = 'mbr_awa') => {
    const world = memberWriteWorld()
    const useCase = new SetMemberVisibilityMaskUseCase(world.deps())
    return { world, result: useCase.execute({ treeId: 'tree_diallo', memberId, viewerId, mask }) }
  }

  it('lets the owner mask a member', async () => {
    const { world, result } = setMask(OWNER_ID, 'MASKED')
    expect(await result).toEqual({ ok: true, value: { changed: true } })
    expect(world.unitOfWork.updatedVisibilityMasks).toEqual([{ memberId: 'mbr_awa', mask: 'MASKED' }])
    expect(world.unitOfWork.auditRecords).toMatchObject([{ action: 'MEMBER_UPDATED' }])
  })

  it('lets the account that claimed the member change it too', async () => {
    const { result } = setMask(CLAIMER_ID, 'MASKED')
    expect((await result).ok).toBe(true)
  })

  it('refuses an editor who did not claim the member', async () => {
    const { result } = setMask(EDITOR_ID, 'MASKED')
    expect(await result).toEqual({ ok: false, error: { kind: 'MEMBER_EDIT_FORBIDDEN' } })
  })

  it('is a no-op when the value does not change', async () => {
    const { world, result } = setMask(OWNER_ID, 'STANDARD')
    expect(await result).toEqual({ ok: true, value: { changed: false } })
    expect(world.unitOfWork.updatedVisibilityMasks).toEqual([])
  })

  it('refuses an unknown member', async () => {
    const { result } = setMask(OWNER_ID, 'MASKED', 'mbr_unknown')
    expect(await result).toEqual({ ok: false, error: { kind: 'MEMBER_NOT_FOUND' } })
  })

  it('refuses to mask a deceased member', async () => {
    const world = memberWriteWorld()
    world.families.seed('tree_diallo', {
      members: [aMember({ id: memberId('mbr_deceased'), deathDate: dateOf('2020') })],
      unions: [],
    })
    const useCase = new SetMemberVisibilityMaskUseCase(world.deps())

    const result = await useCase.execute({
      treeId: 'tree_diallo',
      memberId: 'mbr_deceased',
      viewerId: OWNER_ID,
      mask: 'MASKED',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'MEMBER_IS_DECEASED' } })
  })
})
