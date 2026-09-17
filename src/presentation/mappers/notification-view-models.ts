import type { NotificationsPage } from '@/core/use-cases/get-notifications'
import type { NotificationView } from '@/core/use-cases/ports/notification-reader'
import { NOTIFICATION_TYPE_LABELS } from '@/presentation/labels/notification-labels'

export type NotificationItemViewModel = {
  readonly id: string
  readonly message: string
  readonly read: boolean
  readonly createdAtIso: string
  readonly href: `/tree/${string}/pending` | '/contact-requests' | null
}

export type NotificationsViewModel = {
  readonly unreadCount: number
  readonly status: string
  readonly items: readonly NotificationItemViewModel[]
}

export function toNotificationsViewModel(page: NotificationsPage): NotificationsViewModel {
  return {
    unreadCount: page.unreadCount,
    status: statusOf(page.unreadCount),
    items: page.notifications.map(toItem),
  }
}

function statusOf(unreadCount: number): string {
  if (unreadCount === 0) return 'Aucune notification non lue.'
  const plural = unreadCount > 1 ? 's' : ''
  return `${unreadCount} notification${plural} non lue${plural}.`
}

function toItem(notification: NotificationView): NotificationItemViewModel {
  return {
    id: notification.id,
    message: messageFor(notification),
    read: notification.read,
    createdAtIso: notification.createdAt.toISOString(),
    href: hrefFor(notification),
  }
}

function hrefFor(notification: NotificationView): NotificationItemViewModel['href'] {
  if (notification.type === 'CONTACT_REQUEST_RECEIVED' || notification.type === 'CONTACT_REQUEST_RESPONDED') {
    return '/contact-requests'
  }
  return notification.treeId ? `/tree/${notification.treeId}/pending` : null
}

/** "Fatou Sow a proposé une modification sur Famille Diallo." — never the field-level detail. */
function messageFor(notification: NotificationView): string {
  const who = notification.personName ?? 'Quelqu’un'
  const label = NOTIFICATION_TYPE_LABELS[notification.type]
  const where = notification.treeName ? ` sur ${notification.treeName}` : ''
  return `${who} ${label}${where}.`
}
