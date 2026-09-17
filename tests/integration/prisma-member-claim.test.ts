import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { MemberId } from '@/core/shared/value-objects/member-id'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaMemberClaimReader } from '@/infrastructure/persistence/prisma/prisma-member-claim-reader'
import { PrismaMemberWriter } from '@/infrastructure/persistence/prisma/prisma-member-writer'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const writer = new PrismaMemberWriter(prisma)
const reader = new PrismaMemberClaimReader(prisma)
const [TREE_A, TREE_B] = ['tree_a', 'tree_b']
const OWNER = 'usr_owner'
const CLAIMER = 'usr_claimer'

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await prisma.user.createMany({
    data: [
      { id: OWNER, email: 'owner@ifumb.test', passwordHash: 'x', firstName: 'Awa', lastName: 'Test' },
      { id: CLAIMER, email: 'claimer@ifumb.test', passwordHash: 'x', firstName: 'Moussa', lastName: 'Test' },
    ],
  })
  await prisma.tree.createMany({
    data: [
      { id: TREE_A, name: 'Arbre A', ownerId: OWNER },
      { id: TREE_B, name: 'Arbre B', ownerId: OWNER },
    ],
  })
  await prisma.member.createMany({
    data: [
      { id: 'mbr_a', firstName: 'Fatou', treeId: TREE_A },
      { id: 'mbr_b', firstName: 'Sekou', treeId: TREE_B },
    ],
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('member claims through Prisma', () => {
  it('finds nobody claimed before any claim is recorded', async () => {
    expect(await reader.findClaimedBy(CLAIMER)).toBeNull()
  })

  it('finds the tree and member an account claimed', async () => {
    await writer.claim(MemberId.fromString('mbr_a'), CLAIMER)

    expect(await reader.findClaimedBy(CLAIMER)).toEqual({ treeId: TREE_A, memberId: 'mbr_a' })
  })

  it('refuses a second claim by the same account, in a different tree — claimedByUserId is unique database-wide, not per tree (legacy bug 2)', async () => {
    await writer.claim(MemberId.fromString('mbr_a'), CLAIMER)

    await expect(writer.claim(MemberId.fromString('mbr_b'), CLAIMER)).rejects.toThrow()
  })
})
