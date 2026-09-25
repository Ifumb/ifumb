'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from '@/presentation/components/ui/icon'

const POLL_INTERVAL_MS = 15_000

type NotificationBadgeProps = Readonly<{ initialUnreadCount: number; onNavigate?: () => void }>

/**
 * The unread count from the server render, kept fresh by a light client poll (module 2.7 — real
 * time was chosen over the RSC-only default; see the plan and ADR 0004). Failing polls are
 * ignored: the badge just keeps its last known count and tries again next time.
 */
// reason: le badge conserve son compteur et son cycle de polling lors des navigations.
export function NotificationBadge({ initialUnreadCount, onNavigate }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
        if (!response.ok) return
        const body: { unreadCount: number } = await response.json()
        if (!cancelled) setUnreadCount(body.unreadCount)
      } catch {
        // The next poll retries; a transient network hiccup should not surface to the reader.
      }
    }
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <Link
      href="/notifications"
      prefetch={false}
      className="icon-button relative"
      onClick={onNavigate}
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications'}
      title="Notifications"
      aria-current={pathname === '/notifications' ? 'page' : undefined}
    >
      <Icon name="bell" />
      {/* reason: always mounted, like StatusMessage — a region only inserted once there is
          something to say is not reliably announced when that first change happens. */}
      <span aria-live="polite" className={unreadCount > 0 ? 'notification-count' : 'sr-only'}>
        {unreadCount > 0 ? unreadCount : ''}
      </span>
    </Link>
  )
}
