import 'server-only'
import { NextResponse } from 'next/server'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'

/**
 * Polled client-side every ~15s (module 2.7, real-time chosen over ADR 0004's default): the
 * unread badge, not the full list — cheap, and safe under whichever hosting target the cutover
 * picks, since it holds no connection open.
 */
export async function GET() {
  const currentUser = await currentUserOrNull()
  if (!currentUser) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const allowed = await container.allowsAttempt([
    { policy: 'notificationPollByUser', subject: currentUser.id },
  ])
  if (!allowed) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })

  const unreadCount = await container.getUnreadNotificationCount().execute(currentUser.id)
  return NextResponse.json({ unreadCount }, { headers: { 'Cache-Control': 'no-store' } })
}
