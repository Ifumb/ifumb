import 'server-only'
import type { NotificationReader, NotificationView } from '@/core/use-cases/ports/notification-reader'

/** Test double of the notification reader. */
export class InMemoryNotificationReader implements NotificationReader {
  private readonly byUser = new Map<string, NotificationView[]>()

  /** Seeds one notification, newest first among those already seeded for the user. */
  seed(userId: string, notification: NotificationView): void {
    const existing = this.byUser.get(userId) ?? []
    this.byUser.set(userId, [notification, ...existing])
  }

  async listForUser(userId: string, limit: number): Promise<readonly NotificationView[]> {
    return (this.byUser.get(userId) ?? []).slice(0, limit)
  }

  async unreadCountFor(userId: string): Promise<number> {
    return (this.byUser.get(userId) ?? []).filter((notification) => !notification.read).length
  }
}
