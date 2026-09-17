import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { CrossTreeLink } from '@/core/entities/cross-tree-link'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaCrossTreeLinkReader } from '@/infrastructure/persistence/prisma/prisma-cross-tree-link-reader'
import { PrismaCrossTreeLinkWriter } from '@/infrastructure/persistence/prisma/prisma-cross-tree-link-writer'
import { PrismaTreeMemberPool } from '@/infrastructure/persistence/prisma/prisma-tree-member-pool'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const linkWriter = new PrismaCrossTreeLinkWriter(prisma)
const linkReader = new PrismaCrossTreeLinkReader(prisma)
const pool = new PrismaTreeMemberPool(prisma)
const SOURCE_TREE = 'tree_diallo'
const TARGET_TREE = 'tree_toure'
const OWNER = 'usr_owner'
const OTHER_USER = 'usr_other'
const NOW = new Date('2026-09-17T10:00:00Z')

async function createUser(id: string, firstName: string): Promise<void> {
  await prisma.user.create({
    data: { id, email: `${id}@ifumb.test`, passwordHash: 'x', firstName, lastName: 'Test' },
  })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await createUser(OWNER, 'Awa')
  await createUser(OTHER_USER, 'Fatou')
  await prisma.tree.create({ data: { id: SOURCE_TREE, name: 'Famille Diallo', ownerId: OWNER } })
  await prisma.tree.create({
    data: { id: TARGET_TREE, name: 'Famille Touré', ownerId: OTHER_USER, visibility: 'PUBLIC' },
  })
  await prisma.member.create({ data: { id: 'mbr_awa', firstName: 'Awa', treeId: SOURCE_TREE } })
  await prisma.member.create({ data: { id: 'mbr_awa_target', firstName: 'Awa', treeId: TARGET_TREE } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('cross-tree links through Prisma', () => {
  it('establishes a link and lists it from either side, with resolved names', async () => {
    await linkWriter.create(
      CrossTreeLink.establish({
        id: 'ctl_1',
        tree1Id: SOURCE_TREE,
        member1Id: 'mbr_awa',
        tree2Id: TARGET_TREE,
        member2Id: 'mbr_awa_target',
        now: NOW,
      }),
    )

    const fromSource = await linkReader.listForTree(SOURCE_TREE)
    const fromTarget = await linkReader.listForTree(TARGET_TREE)

    expect(fromSource[0]).toMatchObject({
      linkedTreeName: 'Famille Touré',
      linkedMemberName: 'Awa',
      ownMemberName: 'Awa',
    })
    expect(fromTarget[0]).toMatchObject({ linkedTreeName: 'Famille Diallo' })
  })

  it('tolerates a dangling member reference left by a deletion, without failing the whole list', async () => {
    await linkWriter.create(
      CrossTreeLink.establish({
        id: 'ctl_1',
        tree1Id: SOURCE_TREE,
        member1Id: 'mbr_awa',
        tree2Id: TARGET_TREE,
        member2Id: 'mbr_awa_target',
        now: NOW,
      }),
    )
    await prisma.member.delete({ where: { id: 'mbr_awa_target' } })

    const views = await linkReader.listForTree(SOURCE_TREE)

    expect(views[0]?.linkedMemberName).toBeNull()
  })
})

describe('the cross-tree candidate pool through Prisma', () => {
  it('includes a PUBLIC tree and excludes the caller’s own source tree', async () => {
    const candidates = await pool.candidatesFor(SOURCE_TREE, OWNER)

    expect(candidates.map((c) => c.memberId)).toEqual(['mbr_awa_target'])
  })

  it('excludes an archived tree, even if it would otherwise be PUBLIC', async () => {
    await prisma.tree.update({ where: { id: TARGET_TREE }, data: { archivedAt: NOW } })

    const candidates = await pool.candidatesFor(SOURCE_TREE, OWNER)

    expect(candidates).toHaveLength(0)
  })

  it('excludes a PRIVATE tree the caller has no access to', async () => {
    await prisma.tree.update({ where: { id: TARGET_TREE }, data: { visibility: 'PRIVATE' } })

    const candidates = await pool.candidatesFor(SOURCE_TREE, OWNER)

    expect(candidates).toHaveLength(0)
  })

  it('includes a PRIVATE tree the caller personally owns or is invited to', async () => {
    await prisma.tree.update({ where: { id: TARGET_TREE }, data: { visibility: 'PRIVATE' } })

    const candidates = await pool.candidatesFor(SOURCE_TREE, OTHER_USER)

    expect(candidates.map((c) => c.memberId)).toEqual(['mbr_awa_target'])
  })
})
