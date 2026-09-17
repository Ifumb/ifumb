import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { PageRequest } from '@/core/shared/value-objects/page-request'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaDiscoverableMemberDirectory } from '@/infrastructure/persistence/prisma/prisma-discoverable-member-directory'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const directory = new PrismaDiscoverableMemberDirectory(prisma)
const OWNER = 'usr_owner'
const PAGE = PageRequest.of(1, 20)

async function seedTree(
  id: string,
  visibility: 'PRIVATE' | 'SHARED' | 'PUBLIC',
  options: { readonly archived?: boolean } = {},
): Promise<void> {
  await prisma.tree.create({
    data: {
      id,
      name: id,
      ownerId: OWNER,
      visibility,
      archivedAt: options.archived ? new Date() : null,
    },
  })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await prisma.user.create({
    data: { id: OWNER, email: 'owner@ifumb.test', passwordHash: 'x', firstName: 'Awa', lastName: 'Test' },
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('discoverable members through Prisma', () => {
  it('finds a discoverable member of a private tree', async () => {
    await seedTree('tree_private', 'PRIVATE')
    await prisma.member.create({
      data: { id: 'mbr_1', firstName: 'Fatou', treeId: 'tree_private', discoverable: true },
    })

    const page = await directory.search('Fatou', PAGE)
    expect(page.items).toMatchObject([{ memberId: 'mbr_1', firstName: 'Fatou' }])
    expect(page.total).toBe(1)
  })

  it('includes shared trees (legacy bug: they were excluded)', async () => {
    await seedTree('tree_shared', 'SHARED')
    await prisma.member.create({
      data: { id: 'mbr_1', firstName: 'Fatou', treeId: 'tree_shared', discoverable: true },
    })

    const page = await directory.search('Fatou', PAGE)
    expect(page.items).toHaveLength(1)
  })

  it('never finds a member of a public tree (that is PublicMemberDirectory’s)', async () => {
    await seedTree('tree_public', 'PUBLIC')
    await prisma.member.create({
      data: { id: 'mbr_1', firstName: 'Fatou', treeId: 'tree_public', discoverable: true },
    })

    expect((await directory.search('Fatou', PAGE)).items).toEqual([])
  })

  it('never finds a member who is not discoverable', async () => {
    await seedTree('tree_private', 'PRIVATE')
    await prisma.member.create({
      data: { id: 'mbr_1', firstName: 'Fatou', treeId: 'tree_private', discoverable: false },
    })

    expect((await directory.search('Fatou', PAGE)).items).toEqual([])
  })

  it('never finds a member of an archived tree (legacy bug: archived trees were not excluded)', async () => {
    await seedTree('tree_private', 'PRIVATE', { archived: true })
    await prisma.member.create({
      data: { id: 'mbr_1', firstName: 'Fatou', treeId: 'tree_private', discoverable: true },
    })

    expect((await directory.search('Fatou', PAGE)).items).toEqual([])
  })

  it('reports a real total, not the page size', async () => {
    await seedTree('tree_private', 'PRIVATE')
    for (const id of ['mbr_1', 'mbr_2', 'mbr_3']) {
      await prisma.member.create({
        data: { id, firstName: 'Fatou', treeId: 'tree_private', discoverable: true },
      })
    }

    const page = await directory.search('Fatou', PageRequest.of(1, 2))
    expect([page.items.length, page.total]).toEqual([2, 3])
  })

  it('finds whether a member is discoverable and who owns its tree', async () => {
    await seedTree('tree_private', 'PRIVATE')
    await prisma.member.create({
      data: { id: 'mbr_1', firstName: 'Fatou', treeId: 'tree_private', discoverable: true },
    })

    expect(await directory.findDiscoverable('mbr_1')).toEqual({
      treeId: 'tree_private',
      ownerId: OWNER,
      discoverable: true,
    })
    expect(await directory.findDiscoverable('mbr_unknown')).toBeNull()
  })
})
