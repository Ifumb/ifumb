import { describe, expect, it } from 'vitest'
import { ToggleMemberDiscoverableUseCase } from '@/core/use-cases/toggle-member-discoverable'
import { CLAIMER_ID, memberWriteWorld } from '@tests/support/member-write-world'
import { EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'

describe('ToggleMemberDiscoverableUseCase', () => {
  const toggle = (viewerId: string, discoverable: boolean, memberId = 'mbr_awa') => {
    const world = memberWriteWorld()
    const useCase = new ToggleMemberDiscoverableUseCase(world.deps())
    return { world, result: useCase.execute({ treeId: 'tree_diallo', memberId, viewerId, discoverable }) }
  }

  it('lets the owner make a member discoverable', async () => {
    const { world, result } = toggle(OWNER_ID, true)
    expect(await result).toEqual({ ok: true, value: { changed: true } })
    expect(world.unitOfWork.updatedDiscoverable).toEqual([{ memberId: 'mbr_awa', discoverable: true }])
    expect(world.unitOfWork.auditRecords).toMatchObject([{ action: 'MEMBER_UPDATED' }])
  })

  it('lets the account that claimed the member toggle it too', async () => {
    const { result } = toggle(CLAIMER_ID, true)
    expect((await result).ok).toBe(true)
  })

  it('refuses an editor who did not claim the member', async () => {
    const { result } = toggle(EDITOR_ID, true)
    expect(await result).toEqual({ ok: false, error: { kind: 'MEMBER_EDIT_FORBIDDEN' } })
  })

  it('is a no-op when the value does not change', async () => {
    const { world, result } = toggle(OWNER_ID, false)
    expect(await result).toEqual({ ok: true, value: { changed: false } })
    expect(world.unitOfWork.updatedDiscoverable).toEqual([])
  })

  it('refuses an unknown member', async () => {
    const { result } = toggle(OWNER_ID, true, 'mbr_unknown')
    expect(await result).toEqual({ ok: false, error: { kind: 'MEMBER_NOT_FOUND' } })
  })
})
