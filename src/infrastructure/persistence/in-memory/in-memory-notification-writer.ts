import 'server-only'
import type { NotificationRecord, NotificationWriter } from '@/core/use-cases/ports/notification-writer'

type StoredNotification = NotificationRecord & { read: boolean }

/**
 * Test double of the standalone notification writer — the one used outside a transaction, for
 * marking notifications read. `record` exists here too so a test can seed through the same port
 * its use case depends on, without reaching into a second, unrelated double.
 */
export class InMemoryNotificationWriter implements NotificationWriter {
  private readonly notifications: StoredNotification[] = []

  async record(entry: NotificationRecord): Promise<void> {
    this.notifications.push({ ...entry, read: false })
  }

  async markRead(id: string, userId: string): Promise<void> {
    const notification = this.notifications.find((n) => n.id === id && n.userId === userId)
    if (notification) notification.read = true
  }

  async markAllRead(userId: string): Promise<number> {
    const unread = this.notifications.filter((n) => n.userId === userId && !n.read)
    for (const notification of unread) notification.read = true
    return unread.length
  }
}
