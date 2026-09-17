import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaCrossTreeSuggestionReader } from '@/infrastructure/persistence/prisma/prisma-cross-tree-suggestion-reader'
import { PrismaCrossTreeSuggestionWriter } from '@/infrastructure/persistence/prisma/prisma-cross-tree-suggestion-writer'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const writer = new PrismaCrossTreeSuggestionWriter(prisma)
const reader = new PrismaCrossTreeSuggestionReader(prisma)
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

function aSuggestion(overrides: Partial<Parameters<typeof CrossTreeSuggestion.propose>[0]> = {}) {
  return CrossTreeSuggestion.propose({
    id: 'sug_1',
    treeId: SOURCE_TREE,
    memberId: 'mbr_awa',
    targetTreeId: TARGET_TREE,
    targetMemberId: 'mbr_awa_target',
    confidence: 'HIGH',
    now: NOW,
    ...overrides,
  })
}

describe('cross-tree suggestions through Prisma', () => {
  it('creates a fresh suggestion', async () => {
    await writer.upsertMany([aSuggestion()])

    const row = await prisma.crossTreeSuggestion.findUniqueOrThrow({ where: { id: 'sug_1' } })
    expect([row.status, row.confidence]).toEqual(['NEW', 'HIGH'])
  })

  it('upserts the same (memberId, targetMemberId) row instead of adding a second one', async () => {
    await writer.upsertMany([aSuggestion()])
    await writer.upsertMany([aSuggestion({ id: 'sug_2', confidence: 'MEDIUM' })])

    const rows = await prisma.crossTreeSuggestion.findMany({
      where: { memberId: 'mbr_awa', targetMemberId: 'mbr_awa_target' },
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.confidence).toBe('MEDIUM')
  })

  it('resolves a suggestion', async () => {
    await writer.upsertMany([aSuggestion()])
    const found = await reader.findById('sug_1')
    const accepted = found?.accept(new Date('2026-09-18T10:00:00Z'))
    if (!accepted?.ok) throw new Error('expected the acceptance to succeed')

    await writer.resolve(accepted.value)

    const row = await prisma.crossTreeSuggestion.findUniqueOrThrow({ where: { id: 'sug_1' } })
    expect(row.status).toBe('ACCEPTED')
  })

  it('lists only ACCEPTED pairs, keyed by memberId:targetMemberId', async () => {
    await writer.upsertMany([aSuggestion()])
    const found = await reader.findById('sug_1')
    const accepted = found?.accept(new Date('2026-09-18T10:00:00Z'))
    if (!accepted?.ok) throw new Error('expected the acceptance to succeed')
    await writer.resolve(accepted.value)

    const pairs = await reader.listAcceptedPairsForTree(SOURCE_TREE)

    expect(pairs.has('mbr_awa:mbr_awa_target')).toBe(true)
  })

  it('excludes NEW and REJECTED pairs from the accepted set', async () => {
    await writer.upsertMany([aSuggestion()])

    const pairs = await reader.listAcceptedPairsForTree(SOURCE_TREE)

    expect(pairs.size).toBe(0)
  })

  it('orders NEW suggestions HIGH, then MEDIUM, then LOW — Postgres enum declaration order', async () => {
    await prisma.member.create({ data: { id: 'mbr_b', firstName: 'B', treeId: TARGET_TREE } })
    await prisma.member.create({ data: { id: 'mbr_c', firstName: 'C', treeId: TARGET_TREE } })
    await writer.upsertMany([
      aSuggestion({ id: 'sug_low', targetMemberId: 'mbr_c', confidence: 'LOW' }),
      aSuggestion({ id: 'sug_high', confidence: 'HIGH' }),
      aSuggestion({ id: 'sug_medium', targetMemberId: 'mbr_b', confidence: 'MEDIUM' }),
    ])

    const views = await reader.listNewForTree(SOURCE_TREE)

    expect(views.map((view) => view.suggestion.id)).toEqual(['sug_high', 'sug_medium', 'sug_low'])
  })
})
