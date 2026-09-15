import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { Union } from '@/core/entities/union'
import { AddUnionChildUseCase } from '@/core/use-cases/add-union-child'
import { CreateUnionUseCase } from '@/core/use-cases/create-union'
import { DeleteUnionUseCase } from '@/core/use-cases/delete-union'
import { RemoveUnionChildUseCase } from '@/core/use-cases/remove-union-child'
import { UpdateUnionUseCase } from '@/core/use-cases/update-union'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaFamilyReader } from '@/infrastructure/persistence/prisma/prisma-family-reader'
import { PrismaTreeReader } from '@/infrastructure/persistence/prisma/prisma-tree-reader'
import { PrismaUnitOfWork } from '@/infrastructure/persistence/prisma/prisma-unit-of-work'
import { SystemClock } from '@/infrastructure/system/system-clock'
import { UuidIdGenerator } from '@/infrastructure/system/uuid-id-generator'
import { dateOf, memberId } from '@tests/support/family-fixtures'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const unitOfWork = new PrismaUnitOfWork(prisma, { writesEnabled: true })
const deps = {
  trees: new PrismaTreeReader(prisma),
  families: new PrismaFamilyReader(prisma),
  unitOfWork,
  ids: new UuidIdGenerator(),
  clock: new SystemClock(),
}
const TREE = 'tree_unions'
const owner = { treeId: TREE, viewerId: 'usr_owner' }
const couple = { type: 'MARRIAGE', parent1Id: 'mbr_moussa', parent2Id: 'mbr_awa' } as const

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await prisma.user.create({
    data: {
      id: 'usr_owner',
      email: 'owner@ifumb.test',
      passwordHash: 'x',
      firstName: 'A',
      lastName: 'B',
    },
  })
  await prisma.tree.create({ data: { id: TREE, name: 'Famille Diallo', ownerId: 'usr_owner' } })
  await prisma.member.createMany({
    data: ['Moussa', 'Awa', 'Fatou'].map((firstName) => ({
      id: `mbr_${firstName.toLowerCase()}`,
      firstName,
      treeId: TREE,
    })),
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

async function createCouple(): Promise<string> {
  const created = await new CreateUnionUseCase(deps).execute({
    ...owner,
    ...couple,
    startDate: dateOf('1955-06'),
    endDate: null,
  })
  if (!created.ok) throw new Error(`Could not create the union: ${created.error.kind}`)
  return created.value.unionId
}

describe('union writes through Prisma', () => {
  it('stores a union with its dates as text and its history entry', async () => {
    const unionId = await createCouple()

    const row = await prisma.union.findUniqueOrThrow({ where: { id: unionId } })
    const entries = await prisma.auditLog.findMany({ where: { targetId: unionId } })
    expect([row.treeId, row.parent1Id, row.parent2Id, row.startDate, row.endDate]).toEqual([
      TREE,
      'mbr_moussa',
      'mbr_awa',
      '1955-06',
      null,
    ])
    expect(entries.map((entry) => entry.action)).toEqual(['UNION_CREATED'])
  })

  it('updates the parents and dates, clearing what was emptied', async () => {
    const unionId = await createCouple()

    const result = await new UpdateUnionUseCase(deps).execute({
      ...owner,
      unionId,
      ...{ type: 'PARTNERSHIP', parent1Id: 'mbr_awa', parent2Id: null },
      ...{ startDate: null, endDate: dateOf('1970') },
    })

    const row = await prisma.union.findUniqueOrThrow({ where: { id: unionId } })
    expect(result).toEqual({ ok: true, value: { changed: true } })
    expect([row.type, row.parent1Id, row.parent2Id, row.startDate, row.endDate]).toEqual([
      'PARTNERSHIP',
      'mbr_awa',
      null,
      null,
      '1970',
    ])
  })

  it('links and unlinks a child, with its filiation', async () => {
    const unionId = await createCouple()
    const target = { ...owner, unionId, childId: 'mbr_fatou' }

    await new AddUnionChildUseCase(deps).execute({ ...target, filiation: 'ADOPTIVE' })
    const linked = await prisma.unionChild.findMany({
      select: { childId: true, filiationType: true },
    })
    await new RemoveUnionChildUseCase(deps).execute(target)

    expect(linked).toEqual([{ childId: 'mbr_fatou', filiationType: 'ADOPTIVE' }])
    expect(await prisma.unionChild.count()).toBe(0)
    expect(await prisma.member.count({ where: { id: 'mbr_fatou' } })).toBe(1)
  })

  it('deletes a union with its child links, and keeps the members', async () => {
    const unionId = await createCouple()
    await new AddUnionChildUseCase(deps).execute({
      ...owner,
      unionId,
      childId: 'mbr_fatou',
      filiation: 'BIOLOGICAL',
    })

    expect(await new DeleteUnionUseCase(deps).execute({ ...owner, unionId })).toEqual({
      ok: true,
      value: undefined,
    })
    expect([await prisma.union.count(), await prisma.unionChild.count()]).toEqual([0, 0])
    expect(await prisma.member.count()).toBe(3)
  })

  it('rolls the union back when its history entry cannot be stored', async () => {
    const union = Union.start({
      id: 'uni_rollback',
      ...{ type: 'MARRIAGE', parent1Id: memberId('mbr_moussa'), parent2Id: null },
      ...{ startDate: null, endDate: null },
    })

    const attempt = unitOfWork.runInTransaction(async ({ unions, auditLog }) => {
      await unions.insert(TREE, union)
      await auditLog.record({
        id: 'entry',
        treeId: TREE,
        authorId: 'usr_missing',
        action: 'UNION_CREATED',
        targetType: 'UNION',
        targetId: union.id,
        diff: { before: null, after: null },
        createdAt: new Date(),
      })
    })

    await expect(attempt).rejects.toThrow()
    expect(await prisma.union.count({ where: { id: 'uni_rollback' } })).toBe(0)
  })
})
