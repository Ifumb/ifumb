import { beforeEach, describe, expect, it } from 'vitest'
import { MarkAllNotificationsReadUseCase } from '@/core/use-cases/mark-all-notifications-read'
import { MarkNotificationReadUseCase } from '@/core/use-cases/mark-notification-read'
import { InMemoryNotificationWriter } from '@/infrastructure/persistence/in-memory/in-memory-notification-writer'

describe('MarkNotificationReadUseCase', () => {
  let notifications: InMemoryNotificationWriter

  beforeEach(async () => {
    notifications = new InMemoryNotificationWriter()
    await notifications.record({
      id: 'ntf_1',
      userId: 'usr_owner',
      type: 'PENDING_CHANGE_CREATED',
      pendingChangeId: 'pc_1',
      createdAt: new Date('2026-09-17T10:00:00Z'),
    })
  })

  it("marks the viewer's own notification read", async () => {
    await new MarkNotificationReadUseCase({ notifications }).execute({
      notificationId: 'ntf_1',
      viewerId: 'usr_owner',
    })

    expect(await notifications.markAllRead('usr_owner')).toBe(0)
  })

  it('does nothing, silently, for a notification that is not the viewer’s own', async () => {
    await new MarkNotificationReadUseCase({ notifications }).execute({
      notificationId: 'ntf_1',
      viewerId: 'usr_stranger',
    })

    expect(await notifications.markAllRead('usr_owner')).toBe(1)
  })
})

describe('MarkAllNotificationsReadUseCase', () => {
  it('marks every one of the viewer’s unread notifications, and counts them', async () => {
    const notifications = new InMemoryNotificationWriter()
    for (const id of ['ntf_1', 'ntf_2']) {
      await notifications.record({
        id,
        userId: 'usr_owner',
        type: 'CHANGE_APPROVED',
        pendingChangeId: 'pc_1',
        createdAt: new Date('2026-09-17T10:00:00Z'),
      })
    }
    await notifications.record({
      id: 'ntf_3',
      userId: 'usr_other',
      type: 'CHANGE_APPROVED',
      pendingChangeId: 'pc_2',
      createdAt: new Date('2026-09-17T10:00:00Z'),
    })

    const result = await new MarkAllNotificationsReadUseCase({ notifications }).execute('usr_owner')

    expect(result).toEqual({ marked: 2 })
    expect(await notifications.markAllRead('usr_owner')).toBe(0)
    expect(await notifications.markAllRead('usr_other')).toBe(1)
  })
})
