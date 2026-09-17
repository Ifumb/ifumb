import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { PendingChange } from '@/core/entities/pending-change'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaPendingChangeReader } from '@/infrastructure/persistence/prisma/prisma-pending-change-reader'
import { PrismaPendingChangeWriter } from '@/infrastructure/persistence/prisma/prisma-pending-change-writer'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const writer = new PrismaPendingChangeWriter(prisma)
const reader = new PrismaPendingChangeReader(prisma)
const TREE = 'tree_pending'
const OWNER = 'usr_owner'
const [EDITOR_A, EDITOR_B] = ['usr_editor_a', 'usr_editor_b']

async function createUser(id: string): Promise<void> {
  await prisma.user.create({
    data: { id, email: `${id}@ifumb.test`, passwordHash: 'x', firstName: id, lastName: 'Test' },
  })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await createUser(OWNER)
  await createUser(EDITOR_A)
  await createUser(EDITOR_B)
  await prisma.tree.create({ data: { id: TREE, name: 'Famille Diallo', ownerId: OWNER } })
  await prisma.member.create({ data: { id: 'mbr_awa', firstName: 'Awa', treeId: TREE } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

function aChange(overrides: Partial<Parameters<typeof PendingChange.propose>[0]> = {}) {
  return PendingChange.propose({
    id: 'pc_1',
    treeId: TREE,
    authorId: EDITOR_A,
    targetType: 'MEMBER',
    targetId: 'mbr_awa',
    action: 'UPDATE',
    snapshotBefore: { tribe: null },
    snapshotAfter: { tribe: 'Peul' },
    createdAt: new Date('2026-09-17T10:00:00Z'),
    ...overrides,
  })
}

describe('pending changes through Prisma', () => {
  it('stores a new proposal, readable back by id', async () => {
    await writer.propose(aChange())

    const found = await reader.findById(TreeId.fromString(TREE), 'pc_1')
    expect(found?.status).toBe('PENDING')
    expect(found?.snapshotAfter).toEqual({ tribe: 'Peul' })
  })

  it('replaces the same author’s pending proposal on the same target, keeping one row', async () => {
    await writer.propose(aChange({ id: 'pc_1', snapshotAfter: { tribe: 'Peul' } }))
    await writer.propose(aChange({ id: 'pc_2', snapshotAfter: { tribe: 'Soninke' } }))

    const rows = await prisma.pendingChange.findMany({ where: { treeId: TREE } })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.snapshotAfter).toEqual({ tribe: 'Soninke' })
  })

  it('keeps a different author’s proposal on the same target as its own row', async () => {
    await writer.propose(aChange({ id: 'pc_1', authorId: EDITOR_A }))
    await writer.propose(aChange({ id: 'pc_2', authorId: EDITOR_B, snapshotAfter: { tribe: 'Wolof' } }))

    const rows = await prisma.pendingChange.findMany({
      where: { treeId: TREE },
      orderBy: { authorId: 'asc' },
    })
    expect(rows.map((row) => [row.authorId, row.id])).toEqual([
      [EDITOR_A, 'pc_1'],
      [EDITOR_B, 'pc_2'],
    ])
  })

  it('resolves a proposal: status, comment, resolver and instant all stored', async () => {
    await writer.propose(aChange())
    const proposed = await reader.findById(TreeId.fromString(TREE), 'pc_1')
    const resolved = proposed?.resolve('REJECTED', {
      resolvedById: OWNER,
      now: new Date('2026-09-17T11:00:00Z'),
      comment: 'Pas la bonne tribu.',
    })
    if (!resolved?.ok) throw new Error('expected the resolution to succeed')

    await writer.resolve(resolved.value)

    const row = await prisma.pendingChange.findUniqueOrThrow({ where: { id: 'pc_1' } })
    expect([row.status, row.rejectionComment, row.resolvedById]).toEqual([
      'REJECTED',
      'Pas la bonne tribu.',
      OWNER,
    ])
  })

  it('finds nothing on another tree, or for an unknown id', async () => {
    await writer.propose(aChange())
    expect(await reader.findById(TreeId.fromString('tree_other'), 'pc_1')).toBeNull()
    expect(await reader.findById(TreeId.fromString(TREE), 'pc_missing')).toBeNull()
  })

  it('rejects every pending proposal of a revoked author on this tree, leaving others untouched', async () => {
    await writer.propose(aChange({ id: 'pc_1', authorId: EDITOR_A }))
    await writer.propose(
      aChange({ id: 'pc_2', authorId: EDITOR_A, targetId: 'mbr_other', snapshotAfter: { tribe: 'Peul' } }),
    )
    await writer.propose(aChange({ id: 'pc_3', authorId: EDITOR_B }))

    await writer.rejectAllByAuthor(TREE, EDITOR_A, new Date('2026-09-17T12:00:00Z'))

    const rows = await prisma.pendingChange.findMany({ orderBy: { id: 'asc' } })
    expect(rows.map((row) => [row.id, row.status, row.rejectionComment])).toEqual([
      ['pc_1', 'REJECTED', 'Accès révoqué'],
      ['pc_2', 'REJECTED', 'Accès révoqué'],
      ['pc_3', 'PENDING', null],
    ])
  })
})
