import 'server-only'
import type { NotificationType } from '@/core/use-cases/ports/notification-writer'

/**
 * A notification as a reader sees it: named after the tree and the one other person it concerns
 * (who proposed, for an owner; who resolved, for an editor) — never the field-level detail, which
 * stays on the pending-changes page a click away, the one place it needs to be kept in sync.
 */
export type NotificationView = {
  readonly id: string
  readonly type: NotificationType
  readonly read: boolean
  readonly createdAt: Date
  readonly treeId: string | null
  readonly treeName: string | null
  readonly personName: string | null
}

/** Read side of the notifications shown to one signed-in user, across every tree they touch. */
export interface NotificationReader {
  /** Newest first, every status, capped at `limit`. */
  listForUser(userId: string, limit: number): Promise<readonly NotificationView[]>
  unreadCountFor(userId: string): Promise<number>
}
