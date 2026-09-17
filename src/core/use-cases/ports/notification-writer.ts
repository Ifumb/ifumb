import 'server-only'

/**
 * Mirrors the full Prisma enum, not just what this app produces today: `CONTACT_REQUEST_RECEIVED`/
 * `CONTACT_REQUEST_RESPONDED` are read-side possibilities (module 2.9, `contact-requests`, Phase 3)
 * before anything here ever writes one.
 */
export type NotificationType =
  | 'PENDING_CHANGE_CREATED'
  | 'CHANGE_APPROVED'
  | 'CHANGE_REJECTED'
  | 'CONTACT_REQUEST_RECEIVED'
  | 'CONTACT_REQUEST_RESPONDED'

export type NotificationRecord = {
  readonly id: string
  readonly userId: string
  readonly type: NotificationType
  readonly pendingChangeId: string
  readonly createdAt: Date
}

/** Write side of the in-app notifications shown to a tree's owner and its editors. */
export interface NotificationWriter {
  record(entry: NotificationRecord): Promise<void>
  /** Marks one notification read — silently does nothing when it is not this user's own. */
  markRead(id: string, userId: string): Promise<void>
  /** Marks every unread notification of this user read; returns how many changed. */
  markAllRead(userId: string): Promise<number>
}
