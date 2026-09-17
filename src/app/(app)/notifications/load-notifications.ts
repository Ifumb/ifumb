import 'server-only'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/** Every signed-in user's own notifications, across every tree they touch. */
export async function loadNotifications() {
  const currentUser = await requireCurrentUser()
  return container.getNotifications().execute({ viewerId: currentUser.id })
}
