import { describe, expect, it } from 'vitest'
import { GetUnreadNotificationCountUseCase } from '@/core/use-cases/get-unread-notification-count'
import { InMemoryNotificationReader } from '@/infrastructure/persistence/in-memory/in-memory-notification-reader'

describe('GetUnreadNotificationCountUseCase', () => {
  it('counts only this user’s unread notifications', async () => {
    const reader = new InMemoryNotificationReader()
    reader.seed('usr_owner', {
      id: 'ntf_1',
      type: 'PENDING_CHANGE_CREATED',
      read: false,
      createdAt: new Date('2026-09-17T10:00:00Z'),
      treeId: 'tree_diallo',
      treeName: 'Famille Diallo',
      personName: 'Fatou Sow',
    })

    const count = await new GetUnreadNotificationCountUseCase({ notifications: reader }).execute(
      'usr_owner',
    )
    expect(count).toBe(1)
    expect(
      await new GetUnreadNotificationCountUseCase({ notifications: reader }).execute('usr_other'),
    ).toBe(0)
  })
})
