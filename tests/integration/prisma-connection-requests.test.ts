import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { CrossTreeConnectionRequest } from '@/core/entities/connection-request'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaConnectionRequestReader } from '@/infrastructure/persistence/prisma/prisma-connection-request-reader'
import { PrismaConnectionRequestWriter } from '@/infrastructure/persistence/prisma/prisma-connection-request-writer'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const writer = new PrismaConnectionRequestWriter(prisma)
const reader = new PrismaConnectionRequestReader(prisma)
const SOURCE_TREE = 'tree_diallo'
const TARGET_TREE = 'tree_toure'
const OWNER = 'usr_owner'
const NOW = new Date('2026-09-17T10:00:00Z')

async function createUser(id: string, firstName: string): Promise<void> {
  await prisma.user.create({
    data: { id, email: `${id}@ifumb.test`, passwordHash: 'x', firstName, lastName: 'Test' },
  })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await createUser(OWNER, 'Awa')
  await prisma.tree.create({ data: { id: SOURCE_TREE, name: 'Famille Diallo', ownerId: OWNER } })
  await prisma.tree.create({ data: { id: TARGET_TREE, name: 'Famille Touré', ownerId: OWNER } })
  await prisma.member.create({ data: { id: 'mbr_awa', firstName: 'Awa', treeId: SOURCE_TREE } })
  await prisma.member.create({ data: { id: 'mbr_awa_target', firstName: 'Awa', treeId: TARGET_TREE } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

function aRequest(
  overrides: Partial<Parameters<typeof CrossTreeConnectionRequest.open>[0]> = {},
) {
  return CrossTreeConnectionRequest.open({
    id: 'cxr_1',
    requesterTreeId: SOURCE_TREE,
    requesterMemberId: 'mbr_awa',
    targetTreeId: TARGET_TREE,
    targetMemberId: 'mbr_awa_target',
    initiatedByUserId: OWNER,
    expiresAt: new Date('2026-10-17T10:00:00Z'),
    now: NOW,
    ...overrides,
  })
}

describe('connection requests through Prisma', () => {
  it('creates a fresh, PENDING request', async () => {
    await writer.create(aRequest())

    const row = await prisma.crossTreeConnectionRequest.findUniqueOrThrow({ where: { id: 'cxr_1' } })
    expect([row.status, row.requesterTreeId, row.targetTreeId]).toEqual([
      'PENDING',
      SOURCE_TREE,
      TARGET_TREE,
    ])
  })

  it('resolves a request', async () => {
    await writer.create(aRequest())
    const found = await reader.findById('cxr_1')
    const approved = found?.approve({ resolvedByUserId: OWNER, now: new Date('2026-09-18T10:00:00Z') })
    if (!approved?.ok) throw new Error('expected the approval to succeed')

    await writer.resolve(approved.value)

    const row = await prisma.crossTreeConnectionRequest.findUniqueOrThrow({ where: { id: 'cxr_1' } })
    expect(row.status).toBe('APPROVED')
  })

  it('lists only PENDING requests, for the target tree', async () => {
    await writer.create(aRequest())

    const views = await reader.listPendingForTree(TARGET_TREE)

    expect(views).toHaveLength(1)
    expect(views[0]?.request.id).toBe('cxr_1')
  })

  it('sweeps a stale PENDING request to EXPIRED, without touching one still valid', async () => {
    await writer.create(aRequest({ expiresAt: new Date('2026-09-01T00:00:00Z') }))
    await prisma.member.create({ data: { id: 'mbr_other', firstName: 'Other', treeId: SOURCE_TREE } })
    await writer.create(
      aRequest({
        id: 'cxr_2',
        requesterMemberId: 'mbr_other',
        expiresAt: new Date('2027-01-01T00:00:00Z'),
      }),
    )

    await writer.expireStale(TARGET_TREE, new Date('2026-09-17T10:00:00Z'))

    const rows = await prisma.crossTreeConnectionRequest.findMany({ orderBy: { id: 'asc' } })
    expect(rows.map((row) => row.status)).toEqual(['EXPIRED', 'PENDING'])
  })
})
