import type { Metadata } from 'next'
import { loadNotifications } from '@/app/(app)/notifications/load-notifications'
import { toNotificationsViewModel } from '@/presentation/mappers/notification-view-models'
import { NotificationsView } from '@/presentation/views/notifications-view'

export const metadata: Metadata = { title: 'Notifications', robots: { index: false } }

export default async function NotificationsPage() {
  const page = await loadNotifications()
  return <NotificationsView list={toNotificationsViewModel(page)} />
}
