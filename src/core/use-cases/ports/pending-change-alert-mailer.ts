import 'server-only'
import type { Email } from '@/core/shared/value-objects/email'

export type PendingChangeAlertMessage = {
  readonly to: Email
  readonly ownerName: string
  readonly editorName: string
  readonly treeName: string
  readonly pendingCount: number
  readonly treeId: string
}

/** Tells the tree owner that an editor's proposal is waiting for review. */
export interface PendingChangeAlertMailer {
  sendAlert(message: PendingChangeAlertMessage): Promise<void>
}
