import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaNotificationReader } from '@/infrastructure/persistence/prisma/prisma-notification-reader'
import { PrismaNotificationWriter } from '@/infrastructure/persistence/prisma/prisma-notification-writer'
import { PrismaPendingChangeWriter } from '@/infrastructure/persistence/prisma/prisma-pending-change-writer'
import { TEST_DATABASE_URL } from '@tests/support/test-database'
import { PendingChange } from '@/core/entities/pending-change'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const reader = new PrismaNotificationReader(prisma)
const writer = new PrismaNotificationWriter(prisma)
const TREE = 'tree_notifications'
const OWNER = 'usr_owner'
const EDITOR = 'usr_editor'

async function createUser(id: string, firstName: string): Promise<void> {
  await prisma.user.create({
    data: { id, email: `${id}@ifumb.test`, passwordHash: 'x', firstName, lastName: 'Test' },
  })
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  await createUser(OWNER, 'Awa')
  await createUser(EDITOR, 'Fatou')
  await prisma.tree.create({ data: { id: TREE, name: 'Famille Diallo', ownerId: OWNER } })
  await prisma.member.create({
    data: { id: 'mbr_awa', firstName: 'Awa', treeId: TREE, discoverable: true },
  })
  await new PrismaPendingChangeWriter(prisma).propose(
    PendingChange.propose({
      id: 'pc_1',
      treeId: TREE,
      authorId: EDITOR,
      targetType: 'MEMBER',
      targetId: 'mbr_awa',
      action: 'UPDATE',
      snapshotBefore: { tribe: null },
      snapshotAfter: { tribe: 'Peul' },
      createdAt: new Date('2026-09-17T10:00:00Z'),
    }),
  )
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('notifications through Prisma', () => {
  it('names the tree and the proposal author for the owner', async () => {
    await writer.record({
      id: 'ntf_1',
      userId: OWNER,
      type: 'PENDING_CHANGE_CREATED',
      pendingChangeId: 'pc_1',
      createdAt: new Date('2026-09-17T10:01:00Z'),
    })

    const [notification] = await reader.listForUser(OWNER, 20)
    expect(notification).toMatchObject({
      type: 'PENDING_CHANGE_CREATED',
      read: false,
      treeName: 'Famille Diallo',
      personName: 'Fatou Test',
    })
  })

  it('names whoever resolved it, for the notification sent back to its author', async () => {
    await prisma.pendingChange.update({
      where: { id: 'pc_1' },
      data: { status: 'APPROVED', resolvedById: OWNER, resolvedAt: new Date() },
    })
    await writer.record({
      id: 'ntf_2',
      userId: EDITOR,
      type: 'CHANGE_APPROVED',
      pendingChangeId: 'pc_1',
      createdAt: new Date('2026-09-17T10:02:00Z'),
    })

    const [notification] = await reader.listForUser(EDITOR, 20)
    expect(notification?.personName).toBe('Awa Test')
  })

  it('counts only the unread ones, and only this user’s own', async () => {
    await writer.record({
      id: 'ntf_3',
      userId: OWNER,
      type: 'PENDING_CHANGE_CREATED',
      pendingChangeId: 'pc_1',
      createdAt: new Date(),
    })
    await writer.record({
      id: 'ntf_4',
      userId: OWNER,
      type: 'PENDING_CHANGE_CREATED',
      pendingChangeId: 'pc_1',
      createdAt: new Date(),
    })
    await writer.markRead('ntf_3', OWNER)

    expect(await reader.unreadCountFor(OWNER)).toBe(1)
    expect(await reader.unreadCountFor(EDITOR)).toBe(0)
  })

  it('marks read only the target user’s own notification', async () => {
    await writer.record({
      id: 'ntf_5',
      userId: OWNER,
      type: 'PENDING_CHANGE_CREATED',
      pendingChangeId: 'pc_1',
      createdAt: new Date(),
    })

    await writer.markRead('ntf_5', EDITOR)
    expect(await reader.unreadCountFor(OWNER)).toBe(1)

    await writer.markRead('ntf_5', OWNER)
    expect(await reader.unreadCountFor(OWNER)).toBe(0)
  })

  it('marks every unread notification of one user read, and counts them', async () => {
    for (const id of ['ntf_6', 'ntf_7']) {
      await writer.record({
        id,
        userId: OWNER,
        type: 'PENDING_CHANGE_CREATED',
        pendingChangeId: 'pc_1',
        createdAt: new Date(),
      })
    }

    expect(await writer.markAllRead(OWNER)).toBe(2)
    expect(await reader.unreadCountFor(OWNER)).toBe(0)
  })

  it('names the requester and the tree for a contact request received (module 3.1)', async () => {
    const contactRequest = await prisma.contactRequest.create({
      data: { id: 'cr_1', treeId: TREE, memberId: 'mbr_awa', requesterId: EDITOR },
    })
    await writer.record({
      id: 'ntf_8',
      userId: OWNER,
      type: 'CONTACT_REQUEST_RECEIVED',
      contactRequestId: contactRequest.id,
      createdAt: new Date(),
    })

    const [notification] = await reader.listForUser(OWNER, 20)
    expect(notification).toMatchObject({
      type: 'CONTACT_REQUEST_RECEIVED',
      treeName: 'Famille Diallo',
      personName: 'Fatou Test',
    })
  })

  it('names the tree owner for a contact request responded to (module 3.1)', async () => {
    const contactRequest = await prisma.contactRequest.create({
      data: { id: 'cr_2', treeId: TREE, memberId: 'mbr_awa', requesterId: EDITOR, status: 'ACCEPTED' },
    })
    await writer.record({
      id: 'ntf_9',
      userId: EDITOR,
      type: 'CONTACT_REQUEST_RESPONDED',
      contactRequestId: contactRequest.id,
      createdAt: new Date(),
    })

    const [notification] = await reader.listForUser(EDITOR, 20)
    expect(notification?.personName).toBe('Awa Test')
  })
})
