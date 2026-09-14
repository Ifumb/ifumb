'use client'

import { useSyncExternalStore } from 'react'
import { formatDateTime } from '@/presentation/formatting/audit-value-format'

const noSubscription = () => () => {}

/**
 * A moment in the reader's own time zone. The server has no idea of it, so it renders the moment
 * in UTC, labelled as such, and the browser replaces it once hydrated — without a mismatch.
 */
export function LocalDateTime({ iso }: Readonly<{ iso: string }>) {
  const label = useSyncExternalStore(
    noSubscription,
    () => formatDateTime(iso),
    () => `${formatDateTime(iso, 'UTC')} (UTC)`,
  )
  return <time dateTime={iso}>{label}</time>
}
