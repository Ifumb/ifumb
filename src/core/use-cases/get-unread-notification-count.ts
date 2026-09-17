import 'server-only'
import type { NotificationReader } from '@/core/use-cases/ports/notification-reader'

type GetUnreadNotificationCountDeps = { readonly notifications: NotificationReader }

/**
 * Just the count — split from `GetNotificationsUseCase`, which also loads the list, so that the
 * ~15s client poll (module 2.7) never pulls rows it throws away.
 */
export class GetUnreadNotificationCountUseCase {
  constructor(private readonly deps: GetUnreadNotificationCountDeps) {}

  execute(viewerId: string): Promise<number> {
    return this.deps.notifications.unreadCountFor(viewerId)
  }
}
