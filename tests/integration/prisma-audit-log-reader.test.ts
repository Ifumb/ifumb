import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import type { AuditAction } from '@/core/entities/audit-change'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import type { AuditLogFilter } from '@/core/use-cases/audit-log-views'
import { AuditCursor } from '@/core/shared/value-objects/audit-cursor'
import { PrismaClient, type Prisma } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaAuditLogReader } from '@/infrastructure/persistence/prisma/prisma-audit-log-reader'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const reader = new PrismaAuditLogReader(prisma)
const TREE = TreeId.fromString('tree_history')

type EntryInput = {
  readonly id: string
  readonly createdAt: string
  readonly treeId?: string
  readonly action?: AuditAction
  readonly diff?: Prisma.InputJsonValue
}

async function createEntry({ id, createdAt, treeId = 'tree_history', action, diff }: EntryInput) {
  await prisma.auditLog.create({
    data: {
      id,
      treeId,
      authorId: 'usr_owner',
      action: action ?? 'MEMBER_UPDATED',
      targetType: 'MEMBER',
      targetId: 'mbr_awa',
      diff: diff ?? { before: null, after: null },
      createdAt: new Date(createdAt),
    },
  })
}

const readIds = async (filter: AuditLogFilter = {}, cursor: AuditCursor | null = null, size = 20) =>
  (await reader.page(TREE, filter, cursor, size)).entries.map((entry) => entry.id)

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
  for (const id of ['tree_history', 'tree_other']) {
    await prisma.tree.create({ data: { id, name: id, ownerId: 'usr_owner' } })
  }
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaAuditLogReader', () => {
  it('reads the entries of the tree only, newest first, ties broken by id', async () => {
    await createEntry({ id: 'a', createdAt: '2026-03-01T10:00:00Z' })
    await createEntry({ id: 'c', createdAt: '2026-03-02T10:00:00Z' })
    await createEntry({ id: 'b', createdAt: '2026-03-02T10:00:00Z' })
    await createEntry({ id: 'elsewhere', createdAt: '2026-03-03T10:00:00Z', treeId: 'tree_other' })

    expect(await readIds()).toEqual(['c', 'b', 'a'])
  })

  it('pages through entries sharing a timestamp without skipping or repeating any', async () => {
    for (const id of ['e1', 'e2', 'e3', 'e4', 'e5']) {
      await createEntry({ id, createdAt: '2026-03-01T10:00:00Z' })
    }

    const first = await reader.page(TREE, {}, null, 2)
    const second = await reader.page(TREE, {}, first.next, 2)
    const third = await reader.page(TREE, {}, second.next, 2)

    expect(
      [first, second, third].flatMap((slice) => slice.entries.map((entry) => entry.id)),
    ).toEqual(['e5', 'e4', 'e3', 'e2', 'e1'])
    expect(third.next).toBeNull()
  })

  it('keeps the entries of one action', async () => {
    await createEntry({ id: 'updated', createdAt: '2026-03-01T10:00:00Z' })
    await createEntry({ id: 'created', createdAt: '2026-03-01T11:00:00Z', action: 'TREE_CREATED' })

    expect(await readIds({ action: 'TREE_CREATED' })).toEqual(['created'])
  })

  it('keeps every entry of the last chosen day', async () => {
    await createEntry({ id: 'before', createdAt: '2026-02-28T23:59:59Z' })
    await createEntry({ id: 'first_day', createdAt: '2026-03-01T00:00:00Z' })
    await createEntry({ id: 'last_day_evening', createdAt: '2026-03-02T23:30:00Z' })
    await createEntry({ id: 'after', createdAt: '2026-03-03T00:00:00Z' })

    expect(await readIds({ fromDay: '2026-03-01', toDay: '2026-03-02' })).toEqual([
      'last_day_evening',
      'first_day',
    ])
  })

  it('reads the author and the recorded values', async () => {
    await createEntry({
      id: 'entry',
      createdAt: '2026-03-01T10:00:00Z',
      diff: { before: { firstName: 'Awa' }, after: { firstName: 'Aïcha', birthDateApprox: true } },
    })

    const [entry] = (await reader.page(TREE, {}, null, 20)).entries

    expect([entry?.author, entry?.diff]).toEqual([
      { firstName: 'Awa', lastName: 'Diallo' },
      { before: { firstName: 'Awa' }, after: { firstName: 'Aïcha', birthDateApprox: true } },
    ])
  })

  it('reads an unexpected diff as nothing recorded, and nested values as text', async () => {
    await createEntry({
      id: 'odd',
      createdAt: '2026-03-01T10:00:00Z',
      diff: ['not', 'an', 'object'],
    })
    await createEntry({
      id: 'nested',
      createdAt: '2026-03-01T11:00:00Z',
      diff: { before: 'text', after: { children: ['Fatou'] } },
    })

    const entries = (await reader.page(TREE, {}, null, 20)).entries

    expect(entries.map((entry) => entry.diff)).toEqual([
      { before: null, after: { children: '["Fatou"]' } },
      { before: null, after: null },
    ])
  })
})
