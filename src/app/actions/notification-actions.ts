'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { succeeded, type FormState } from '@/presentation/forms/form-state'

/** Bound to its own notification by the list; marking someone else's does nothing, silently. */
export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const currentUser = await requireCurrentUser()
  await container.markNotificationRead().execute({ notificationId, viewerId: currentUser.id })
  revalidatePath('/notifications')
}

export async function markAllNotificationsReadAction(): Promise<FormState> {
  const currentUser = await requireCurrentUser()
  const { marked } = await container.markAllNotificationsRead().execute(currentUser.id)
  revalidatePath('/notifications')
  return succeeded(marked > 0 ? `${marked} notification(s) marquée(s) comme lue(s).` : 'Rien à marquer.')
}
