import 'server-only'
import type { AuditLogWriter } from '@/core/use-cases/ports/audit-log-writer'
import type { ConnectionRequestWriter } from '@/core/use-cases/ports/connection-request-writer'
import type { ContactRequestWriter } from '@/core/use-cases/ports/contact-request-writer'
import type { CrossTreeLinkWriter } from '@/core/use-cases/ports/cross-tree-link-writer'
import type { CrossTreeSuggestionWriter } from '@/core/use-cases/ports/cross-tree-suggestion-writer'
import type { InvitationWriter } from '@/core/use-cases/ports/invitation-writer'
import type { MemberWriter } from '@/core/use-cases/ports/member-writer'
import type { NotificationWriter } from '@/core/use-cases/ports/notification-writer'
import type { PendingChangeWriter } from '@/core/use-cases/ports/pending-change-writer'
import type { TreeWriter } from '@/core/use-cases/ports/tree-writer'
import type { UnionWriter } from '@/core/use-cases/ports/union-writer'

/** The writers available inside one transaction. */
export type UnitOfWorkContext = {
  readonly trees: TreeWriter
  readonly members: MemberWriter
  readonly unions: UnionWriter
  readonly auditLog: AuditLogWriter
  readonly pendingChanges: PendingChangeWriter
  readonly invitations: InvitationWriter
  readonly contactRequests: ContactRequestWriter
  readonly crossTreeSuggestions: CrossTreeSuggestionWriter
  readonly connectionRequests: ConnectionRequestWriter
  readonly crossTreeLinks: CrossTreeLinkWriter
  /** Only ever records one here — marking a notification read never belongs in a business
   * transaction, so that capability is not part of this narrower slice of `NotificationWriter`. */
  readonly notifications: Pick<NotificationWriter, 'record'>
}

/** Runs writes atomically: a change and its history entry are stored together, or not at all. */
export interface UnitOfWork {
  /** Runs `work` in one transaction; when it throws, every write made through it is undone. */
  runInTransaction<T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T>
}
