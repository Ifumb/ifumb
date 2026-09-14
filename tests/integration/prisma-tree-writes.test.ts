import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { Tree } from '@/core/entities/tree'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import { CreateTreeUseCase } from '@/core/use-cases/create-tree'
import { UpdateTreeUseCase } from '@/core/use-cases/update-tree'
import { BusinessWritesDisabledError } from '@/infrastructure/config/business-writes'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaAuditLogReader } from '@/infrastructure/persistence/prisma/prisma-audit-log-reader'
import { PrismaTreeReader } from '@/infrastructure/persistence/prisma/prisma-tree-reader'
import { PrismaUnitOfWork } from '@/infrastructure/persistence/prisma/prisma-unit-of-work'
import { SystemClock } from '@/infrastructure/system/system-clock'
import { UuidIdGenerator } from '@/infrastructure/system/uuid-id-generator'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const unitOfWork = new PrismaUnitOfWork(prisma, { writesEnabled: true })
const trees = new PrismaTreeReader(prisma)
const deps = { unitOfWork, ids: new UuidIdGenerator(), clock: new SystemClock() }
const createTree = new CreateTreeUseCase(deps)
const updateTree = new UpdateTreeUseCase({ ...deps, trees })

const details = { name: 'Famille Diallo', description: 'Du Fouta', visibility: 'PRIVATE' } as const

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await prisma.user.create({
    data: {
      id: 'usr_owner',
      email: 'owner@ifumb.test',
      passwordHash: 'x',
      firstName: 'Awa',
      lastName: 'Diallo',
    },
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

const historyOf = async (treeId: string) =>
  (await new PrismaAuditLogReader(prisma).page(TreeId.fromString(treeId), {}, null, 20)).entries

describe('tree writes through Prisma', () => {
  it('stores a new tree and its history entry together', async () => {
    const { treeId } = await createTree.execute({ ownerId: 'usr_owner', ...details })

    const listing = await trees.findById(TreeId.fromString(treeId))
    const [entry] = await historyOf(treeId)

    expect(listing?.tree.details).toEqual(details)
    expect([entry?.action, entry?.author, entry?.diff]).toEqual([
      'TREE_CREATED',
      { firstName: 'Awa', lastName: 'Diallo' },
      { before: null, after: details },
    ])
  })

  it('rolls the tree back when its history entry cannot be stored', async () => {
    const tree = Tree.start({
      id: TreeId.fromString('tree_rollback'),
      ownerId: UserId.fromString('usr_owner'),
      now: new Date(),
      ...details,
    })

    const attempt = unitOfWork.runInTransaction(async (context) => {
      await context.trees.insert(tree)
      await context.auditLog.record({
        id: 'entry',
        treeId: 'tree_rollback',
        authorId: 'usr_missing',
        action: 'TREE_CREATED',
        targetType: 'TREE',
        targetId: 'tree_rollback',
        diff: { before: null, after: null },
        createdAt: new Date(),
      })
    })

    await expect(attempt).rejects.toThrow()
    expect(await prisma.tree.count({ where: { id: 'tree_rollback' } })).toBe(0)
  })

  it('updates the details and records only what changed', async () => {
    const { treeId } = await createTree.execute({ ownerId: 'usr_owner', ...details })

    const result = await updateTree.execute({
      treeId,
      viewerId: 'usr_owner',
      ...details,
      description: '',
      visibility: 'PUBLIC',
    })

    const listing = await trees.findById(TreeId.fromString(treeId))
    const [latest] = await historyOf(treeId)
    expect(result).toEqual({ ok: true, value: { changed: true } })
    expect(listing?.tree.details).toEqual({ ...details, description: null, visibility: 'PUBLIC' })
    expect(latest?.diff).toEqual({
      before: { description: 'Du Fouta', visibility: 'PRIVATE' },
      after: { description: null, visibility: 'PUBLIC' },
    })
  })

  it('refuses every write while business writes are disabled', async () => {
    const guarded = new PrismaUnitOfWork(prisma, { writesEnabled: false })
    const create = new CreateTreeUseCase({ ...deps, unitOfWork: guarded })

    await expect(create.execute({ ownerId: 'usr_owner', ...details })).rejects.toThrow(
      BusinessWritesDisabledError,
    )
    expect(await prisma.tree.count()).toBe(0)
  })
})
