import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { CrossTreeLink } from '@/core/entities/cross-tree-link'
import { GetCrossTreeBranchUseCase } from '@/core/use-cases/get-cross-tree-branch'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaCrossTreeLinkReader } from '@/infrastructure/persistence/prisma/prisma-cross-tree-link-reader'
import { PrismaCrossTreeLinkWriter } from '@/infrastructure/persistence/prisma/prisma-cross-tree-link-writer'
import { PrismaFamilyReader } from '@/infrastructure/persistence/prisma/prisma-family-reader'
import { PrismaTreeReader } from '@/infrastructure/persistence/prisma/prisma-tree-reader'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const useCase = new GetCrossTreeBranchUseCase({
  trees: new PrismaTreeReader(prisma),
  families: new PrismaFamilyReader(prisma),
  links: new PrismaCrossTreeLinkReader(prisma),
})
const linkWriter = new PrismaCrossTreeLinkWriter(prisma)
const SOURCE_TREE = 'tree_diallo'
const FOREIGN_TREE = 'tree_toure'
const OWNER = 'usr_owner'
const FOREIGN_OWNER = 'usr_foreign_owner'
const NOW = new Date('2026-09-17T10:00:00Z')

async function createUser(id: string, firstName: string): Promise<void> {
  await prisma.user.create({
    data: { id, email: `${id}@ifumb.test`, passwordHash: 'x', firstName, lastName: 'Test' },
  })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await createUser(OWNER, 'Awa')
  await createUser(FOREIGN_OWNER, 'Moussa')
  await prisma.tree.create({ data: { id: SOURCE_TREE, name: 'Famille Diallo', ownerId: OWNER } })
  await prisma.tree.create({
    data: { id: FOREIGN_TREE, name: 'Famille Touré', ownerId: FOREIGN_OWNER, visibility: 'PRIVATE' },
  })
  await prisma.member.create({ data: { id: 'mbr_awa', firstName: 'Awa', treeId: SOURCE_TREE } })
  await prisma.member.create({ data: { id: 'mbr_fatou', firstName: 'Fatou', treeId: FOREIGN_TREE } })
  await linkWriter.create(
    CrossTreeLink.establish({
      id: 'ctl_1',
      tree1Id: SOURCE_TREE,
      member1Id: 'mbr_awa',
      tree2Id: FOREIGN_TREE,
      member2Id: 'mbr_fatou',
      now: NOW,
    }),
  )
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('GetCrossTreeBranchUseCase through Prisma', () => {
  it('reads a real PRIVATE foreign tree end to end, through the link alone', async () => {
    const result = await useCase.execute({
      treeId: SOURCE_TREE,
      viewerId: OWNER,
      linkId: 'ctl_1',
    })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.foreignGraph.tree.name).toBe('Famille Touré')
    expect(result.ok && result.value.foreignGraph.members.map((m) => m.id)).toEqual(['mbr_fatou'])
  })

  it('refuses a viewer with no access to the local tree', async () => {
    await createUser('usr_stranger', 'Stranger')

    const result = await useCase.execute({
      treeId: SOURCE_TREE,
      viewerId: 'usr_stranger',
      linkId: 'ctl_1',
    })

    expect(!result.ok && result.error.kind).toBe('ACCESS_DENIED')
  })
})
