import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaTreeReader } from '@/infrastructure/persistence/prisma/prisma-tree-reader'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const reader = new PrismaTreeReader(prisma)

const OWNER = 'usr_owner'
const GUEST = 'usr_guest'

async function createUser(id: string, email: string): Promise<void> {
  await prisma.user.create({
    data: { id, email, passwordHash: 'hashed:x', firstName: 'Awa', lastName: 'Diallo' },
  })
}

async function createTree(id: string, memberCount = 0): Promise<void> {
  await prisma.tree.create({
    data: {
      id,
      name: `Arbre ${id}`,
      ownerId: OWNER,
      members: { create: Array.from({ length: memberCount }, (_, i) => ({ firstName: `M${i}` })) },
    },
  })
}

async function invite(treeId: string, status: 'ACCEPTED' | 'PENDING', userId = GUEST) {
  await prisma.invitation.create({
    data: { treeId, userId, email: `${userId}@ifumb.test`, role: 'EDITOR', status },
  })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await createUser(OWNER, 'owner@ifumb.test')
  await createUser(GUEST, 'guest@ifumb.test')
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaTreeReader', () => {
  it('lists owned trees with the owner name and the member count', async () => {
    await createTree('tree_a', 3)

    const [listing] = await reader.listAccessibleBy(UserId.fromString(OWNER))

    expect([listing?.tree.name, listing?.ownerName, listing?.memberCount]).toEqual([
      'Arbre tree_a',
      { firstName: 'Awa', lastName: 'Diallo' },
      3,
    ])
  })

  it('lists a tree shared through an accepted invitation, with its role', async () => {
    await createTree('tree_a')
    await invite('tree_a', 'ACCEPTED')

    const listings = await reader.listAccessibleBy(UserId.fromString(GUEST))

    expect(listings.map((l) => [l.tree.id.value, l.invitationRole])).toEqual([['tree_a', 'EDITOR']])
  })

  it('ignores a pending invitation', async () => {
    await createTree('tree_a')
    await invite('tree_a', 'PENDING')

    expect(await reader.listAccessibleBy(UserId.fromString(GUEST))).toEqual([])
  })

  it('returns a tree only once when its owner also accepted an invitation to it', async () => {
    await createTree('tree_a')
    await invite('tree_a', 'ACCEPTED', OWNER)

    const listings = await reader.listAccessibleBy(UserId.fromString(OWNER))

    expect(listings).toHaveLength(1)
  })

  it('finds a tree with the invitation role of the given reader', async () => {
    await createTree('tree_a')
    await invite('tree_a', 'ACCEPTED')

    const listing = await reader.findById(TreeId.fromString('tree_a'), UserId.fromString(GUEST))

    expect(listing?.invitationRole).toBe('EDITOR')
  })

  it('never lends an invitation role to an anonymous reader', async () => {
    await createTree('tree_a')
    await invite('tree_a', 'ACCEPTED')

    const listing = await reader.findById(TreeId.fromString('tree_a'))

    expect(listing?.invitationRole).toBeUndefined()
  })

  it('returns null for an unknown tree', async () => {
    expect(await reader.findById(TreeId.fromString('tree_unknown'))).toBeNull()
  })
})
