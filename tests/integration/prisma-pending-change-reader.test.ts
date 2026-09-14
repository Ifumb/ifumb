import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaPendingChangeReader } from '@/infrastructure/persistence/prisma/prisma-pending-change-reader'
import { TEST_DATABASE_URL } from '@tests/support/test-database'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const reader = new PrismaPendingChangeReader(prisma)
const TREE = TreeId.fromString('tree_pending')

type PendingInput = {
  readonly treeId?: string
  readonly targetId: string
  readonly action: 'CREATE' | 'UPDATE' | 'DELETE'
  readonly status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  readonly createdAt?: Date
}

async function createPendingChange(input: PendingInput): Promise<void> {
  await prisma.pendingChange.create({
    data: {
      treeId: input.treeId ?? 'tree_pending',
      authorId: 'usr_owner',
      targetType: 'MEMBER',
      targetId: input.targetId,
      action: input.action,
      status: input.status ?? 'PENDING',
      createdAt: input.createdAt,
    },
  })
}

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
  for (const id of ['tree_pending', 'tree_other']) {
    await prisma.tree.create({ data: { id, name: id, ownerId: 'usr_owner' } })
  }
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaPendingChangeReader', () => {
  it('returns the action of each pending target', async () => {
    await createPendingChange({ targetId: 'mbr_awa', action: 'UPDATE' })
    await createPendingChange({ targetId: 'uni_1', action: 'DELETE' })

    expect(Object.fromEntries(await reader.pendingTargets(TREE))).toEqual({
      mbr_awa: 'UPDATE',
      uni_1: 'DELETE',
    })
  })

  it('ignores changes already approved or rejected', async () => {
    await createPendingChange({ targetId: 'mbr_awa', action: 'UPDATE', status: 'APPROVED' })
    await createPendingChange({ targetId: 'mbr_moussa', action: 'DELETE', status: 'REJECTED' })

    expect((await reader.pendingTargets(TREE)).size).toBe(0)
  })

  it('ignores the changes of another tree', async () => {
    await createPendingChange({ treeId: 'tree_other', targetId: 'mbr_awa', action: 'UPDATE' })

    expect((await reader.pendingTargets(TREE)).size).toBe(0)
  })

  it('keeps the latest change when a target has several', async () => {
    await createPendingChange({
      targetId: 'mbr_awa',
      action: 'DELETE',
      createdAt: new Date('2026-03-02T00:00:00Z'),
    })
    await createPendingChange({
      targetId: 'mbr_awa',
      action: 'UPDATE',
      createdAt: new Date('2026-03-01T00:00:00Z'),
    })

    expect((await reader.pendingTargets(TREE)).get('mbr_awa')).toBe('DELETE')
  })
})
