import 'server-only'

export type NotificationType = 'PENDING_CHANGE_CREATED' | 'CHANGE_APPROVED' | 'CHANGE_REJECTED'

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
}
