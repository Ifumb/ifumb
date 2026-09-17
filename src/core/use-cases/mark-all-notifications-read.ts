import 'server-only'
import type { NotificationWriter } from '@/core/use-cases/ports/notification-writer'

type MarkAllNotificationsReadDeps = { readonly notifications: NotificationWriter }

/** Marks every one of this user's unread notifications read; returns how many changed. */
export class MarkAllNotificationsReadUseCase {
  constructor(private readonly deps: MarkAllNotificationsReadDeps) {}

  async execute(viewerId: string): Promise<{ readonly marked: number }> {
    const marked = await this.deps.notifications.markAllRead(viewerId)
    return { marked }
  }
}
