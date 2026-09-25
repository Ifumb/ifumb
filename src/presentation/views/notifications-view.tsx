import Link from 'next/link'
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/actions/notification-actions'
import { MarkAllReadForm } from '@/presentation/components/forms/mark-all-read-form'
import { Button } from '@/presentation/components/ui/button'
import { LocalDateTime } from '@/presentation/components/ui/local-date-time'
import type {
  NotificationItemViewModel,
  NotificationsViewModel,
} from '@/presentation/mappers/notification-view-models'

type NotificationsProps = Readonly<{ list: NotificationsViewModel }>

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function NotificationsView({ list }: NotificationsProps) {
  return (
    <section aria-labelledby="notifications-title" className="space-y-6">
      <h1 id="notifications-title" className="text-3xl font-bold">
        Notifications
      </h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p role="status">{list.status}</p>
        {/* reason: always mounted, like NotificationBadge — unmounting this the instant
            unreadCount hits 0 (which the action's own revalidatePath causes) would tear the
            confirmation message down before it can be read. */}
        <MarkAllReadForm action={markAllNotificationsReadAction} hasUnread={list.unreadCount > 0} />
      </div>
      {list.items.length > 0 ? (
        <ol className="space-y-3">
          {list.items.map((item) => (
            <NotificationItem key={item.id} item={item} />
          ))}
        </ol>
      ) : (
        <p>Vous n’avez encore reçu aucune notification.</p>
      )}
    </section>
  )
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
function NotificationItem({ item }: Readonly<{ item: NotificationItemViewModel }>) {
  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${
        item.read ? 'border-earth-sand bg-white' : 'border-brand/30 bg-brand/5'
      }`}
    >
      <div>
        <p>{item.href ? <Link href={item.href}>{item.message}</Link> : item.message}</p>
        <p className="text-sm text-gray-600">
          <LocalDateTime iso={item.createdAtIso} />
        </p>
      </div>
      {!item.read && (
        <form action={markNotificationReadAction.bind(null, item.id)}>
          <Button type="submit" variant="secondary" size="md">
            Marquer comme lue
          </Button>
        </form>
      )}
    </li>
  )
}
