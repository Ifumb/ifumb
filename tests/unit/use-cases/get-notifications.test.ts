import { describe, expect, it } from 'vitest'
import { GetNotificationsUseCase } from '@/core/use-cases/get-notifications'
import type { NotificationView } from '@/core/use-cases/ports/notification-reader'
import { InMemoryNotificationReader } from '@/infrastructure/persistence/in-memory/in-memory-notification-reader'

const aNotification = (overrides: Partial<NotificationView> = {}): NotificationView => ({
  id: 'ntf_1',
  type: 'PENDING_CHANGE_CREATED',
  read: false,
  createdAt: new Date('2026-09-17T10:00:00Z'),
  treeId: 'tree_diallo',
  treeName: 'Famille Diallo',
  personName: 'Fatou Sow',
  ...overrides,
})

describe('GetNotificationsUseCase', () => {
  it('gives an empty page to a user with nothing', async () => {
    const result = await new GetNotificationsUseCase({
      notifications: new InMemoryNotificationReader(),
    }).execute({ viewerId: 'usr_owner' })

    expect(result).toEqual({ notifications: [], unreadCount: 0 })
  })

  it('gives the list and the unread count together, newest first', async () => {
    const reader = new InMemoryNotificationReader()
    reader.seed('usr_owner', aNotification({ id: 'ntf_1', read: true }))
    reader.seed('usr_owner', aNotification({ id: 'ntf_2', read: false }))
    reader.seed('usr_other', aNotification({ id: 'ntf_3', read: false }))

    const result = await new GetNotificationsUseCase({ notifications: reader }).execute({
      viewerId: 'usr_owner',
    })

    expect(result.notifications.map((n) => n.id)).toEqual(['ntf_2', 'ntf_1'])
    expect(result.unreadCount).toBe(1)
  })
})
