import 'server-only'
import type { NotificationReader, NotificationView } from '@/core/use-cases/ports/notification-reader'

export type GetNotificationsInput = { readonly viewerId: string }

export type NotificationsPage = {
  readonly notifications: readonly NotificationView[]
  readonly unreadCount: number
}

const LIST_LIMIT = 20

type GetNotificationsDeps = { readonly notifications: NotificationReader }

/** Every signed-in user has their own notifications; there is nothing to refuse here. */
export class GetNotificationsUseCase {
  constructor(private readonly deps: GetNotificationsDeps) {}

  async execute(input: GetNotificationsInput): Promise<NotificationsPage> {
    const [notifications, unreadCount] = await Promise.all([
      this.deps.notifications.listForUser(input.viewerId, LIST_LIMIT),
      this.deps.notifications.unreadCountFor(input.viewerId),
    ])
    return { notifications, unreadCount }
  }
}
