import { beforeEach, describe, expect, it } from 'vitest'
import { GetPendingChangesUseCase } from '@/core/use-cases/get-pending-changes'
import type { PendingChangeSummary } from '@/core/use-cases/ports/pending-change-reader'
import { EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'
import { memberWriteWorld } from '@tests/support/member-write-world'

const aSummary = (overrides: Partial<PendingChangeSummary> = {}): PendingChangeSummary => ({
  id: 'pc_1',
  authorId: EDITOR_ID,
  authorName: 'Fatou Sow',
  targetType: 'MEMBER',
  targetId: 'mbr_awa',
  action: 'UPDATE',
  snapshotBefore: { tribe: 'Peul' },
  snapshotAfter: { tribe: 'Soninke' },
  status: 'PENDING',
  createdAt: new Date('2026-09-16T10:00:00Z'),
  ...overrides,
})

describe('GetPendingChangesUseCase', () => {
  let world: ReturnType<typeof memberWriteWorld>

  beforeEach(() => {
    world = memberWriteWorld()
  })

  const read = (viewerId: string) =>
    new GetPendingChangesUseCase(world).execute({ treeId: 'tree_diallo', viewerId })

  it('gives the owner every pending proposal, and the right to review', async () => {
    world.pendingChanges.seedChange('tree_diallo', aSummary({ id: 'pc_1' }))
    world.pendingChanges.seedChange('tree_diallo', aSummary({ id: 'pc_2', authorId: 'usr_other' }))

    const result = await read(OWNER_ID)

    expect(result.ok && result.value.canReview).toBe(true)
    expect(result.ok && result.value.changes.map((change) => change.id)).toEqual(['pc_2', 'pc_1'])
  })

  it('gives an editor only their own proposals, without the right to review', async () => {
    world.pendingChanges.seedChange('tree_diallo', aSummary({ id: 'pc_own', authorId: EDITOR_ID }))
    world.pendingChanges.seedChange(
      'tree_diallo',
      aSummary({ id: 'pc_other', authorId: 'usr_other' }),
    )

    const result = await read(EDITOR_ID)

    expect(result.ok && result.value.canReview).toBe(false)
    expect(result.ok && result.value.changes.map((change) => change.id)).toEqual(['pc_own'])
  })

  it('refuses a stranger with ACCESS_DENIED', async () => {
    expect(await read(STRANGER_ID)).toEqual({ ok: false, error: { kind: 'ACCESS_DENIED' } })
  })
})
