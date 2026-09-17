import { describe, expect, it } from 'vitest'
import { ClaimMemberUseCase } from '@/core/use-cases/claim-member'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { InMemoryFamilyReader } from '@/infrastructure/persistence/in-memory/in-memory-family-reader'
import { InMemoryMemberClaimReader } from '@/infrastructure/persistence/in-memory/in-memory-member-claim-reader'
import { InMemoryTreeReader } from '@/infrastructure/persistence/in-memory/in-memory-tree-reader'
import { InMemoryUnitOfWork } from '@/infrastructure/persistence/in-memory/in-memory-unit-of-work'
import { FixedClock, SequentialIdGenerator } from '@tests/support/fakes'
import { aMember, memberId } from '@tests/support/family-fixtures'
import { CLAIMER_ID, memberWriteWorld } from '@tests/support/member-write-world'
import { aStoredTree, aTree, EDITOR_ID, OWNER_ID } from '@tests/support/tree-fixtures'

const NOW = new Date('2026-09-17T10:00:00Z')

describe('ClaimMemberUseCase', () => {
  it('claims a free member, with a MEMBER_CLAIMED entry', async () => {
    const world = memberWriteWorld()
    const claim = new ClaimMemberUseCase(world.deps())

    const result = await claim.execute({
      treeId: 'tree_diallo',
      memberId: 'mbr_moussa',
      viewerId: EDITOR_ID,
    })

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.claimedMembers).toEqual([{ memberId: 'mbr_moussa', userId: EDITOR_ID }])
    expect(world.unitOfWork.auditRecords).toMatchObject([{ action: 'MEMBER_CLAIMED' }])
  })

  it('is a no-op for the account that already claimed this same member', async () => {
    const world = memberWriteWorld()
    const claim = new ClaimMemberUseCase(world.deps())

    const result = await claim.execute({
      treeId: 'tree_diallo',
      memberId: 'mbr_awa',
      viewerId: CLAIMER_ID,
    })

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.claimedMembers).toEqual([])
  })

  it('refuses a member already claimed by someone else', async () => {
    const world = memberWriteWorld()
    const claim = new ClaimMemberUseCase(world.deps())

    const result = await claim.execute({
      treeId: 'tree_diallo',
      memberId: 'mbr_awa',
      viewerId: OWNER_ID,
    })

    expect(!result.ok && result.error).toEqual({ kind: 'ALREADY_CLAIMED' })
  })

  it('refuses an account that already claimed a member in a different tree (legacy bug 2)', async () => {
    const trees = new InMemoryTreeReader()
    trees.seed(
      aStoredTree({ acceptedInvitations: [{ userId: CLAIMER_ID, role: 'VIEWER' }] }),
      aStoredTree({
        tree: aTree({ id: TreeId.fromString('tree_other') }),
        acceptedInvitations: [{ userId: CLAIMER_ID, role: 'VIEWER' }],
      }),
    )
    const families = new InMemoryFamilyReader()
    families.seed('tree_diallo', { members: [aMember({ id: memberId('mbr_awa'), claimedById: CLAIMER_ID })], unions: [] })
    families.seed('tree_other', { members: [aMember({ id: memberId('mbr_free') })], unions: [] })
    const memberClaims = new InMemoryMemberClaimReader()
    memberClaims.seed(CLAIMER_ID, { treeId: 'tree_diallo', memberId: 'mbr_awa' })
    const unitOfWork = new InMemoryUnitOfWork()

    const claim = new ClaimMemberUseCase({
      trees,
      families,
      memberClaims,
      unitOfWork,
      ids: new SequentialIdGenerator(),
      clock: new FixedClock(NOW),
    })
    const result = await claim.execute({
      treeId: 'tree_other',
      memberId: 'mbr_free',
      viewerId: CLAIMER_ID,
    })

    expect(!result.ok && result.error).toEqual({ kind: 'ALREADY_CLAIMED_ELSEWHERE' })
    expect(unitOfWork.claimedMembers).toEqual([])
  })

  it('is open to a plain viewer, not only editors or the owner', async () => {
    const trees = new InMemoryTreeReader()
    trees.seed(aStoredTree({ acceptedInvitations: [{ userId: 'usr_reader', role: 'VIEWER' }] }))
    const families = new InMemoryFamilyReader()
    families.seed('tree_diallo', { members: [aMember({ id: memberId('mbr_moussa') })], unions: [] })
    const unitOfWork = new InMemoryUnitOfWork()

    const claim = new ClaimMemberUseCase({
      trees,
      families,
      memberClaims: new InMemoryMemberClaimReader(),
      unitOfWork,
      ids: new SequentialIdGenerator(),
      clock: new FixedClock(NOW),
    })
    const result = await claim.execute({
      treeId: 'tree_diallo',
      memberId: 'mbr_moussa',
      viewerId: 'usr_reader',
    })

    expect(result.ok).toBe(true)
    expect(unitOfWork.claimedMembers).toEqual([{ memberId: 'mbr_moussa', userId: 'usr_reader' }])
  })

  it('refuses an anonymous visitor', async () => {
    const world = memberWriteWorld()
    const claim = new ClaimMemberUseCase(world.deps())

    const result = await claim.execute({ treeId: 'tree_diallo', memberId: 'mbr_moussa' })

    expect(!result.ok && result.error.kind).toBe('AUTHENTICATION_REQUIRED')
  })
})
