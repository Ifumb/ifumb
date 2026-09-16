import type { AuditSnapshot } from '@/core/entities/audit-change'
import { DomainError } from '@/core/shared/errors/domain-error'
import { err, ok, type Result } from '@/core/shared/result'

export type PendingTargetType = 'MEMBER' | 'UNION'
export type PendingActionKind = 'CREATE' | 'UPDATE' | 'DELETE'
export type PendingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PendingDecision = 'APPROVED' | 'REJECTED'

export type PendingChangeProps = {
  readonly id: string
  readonly treeId: string
  readonly authorId: string
  readonly targetType: PendingTargetType
  readonly targetId: string
  readonly action: PendingActionKind
  readonly snapshotBefore: AuditSnapshot | null
  readonly snapshotAfter: AuditSnapshot | null
  readonly status: PendingStatus
  readonly rejectionComment: string | null
  readonly resolvedAt: Date | null
  readonly resolvedById: string | null
  readonly createdAt: Date
}

export type ProposeChangeInput = {
  readonly id: string
  readonly treeId: string
  readonly authorId: string
  readonly targetType: PendingTargetType
  readonly targetId: string
  readonly action: PendingActionKind
  readonly snapshotBefore: AuditSnapshot | null
  readonly snapshotAfter: AuditSnapshot | null
  readonly createdAt: Date
}

export type ResolveChangeInput = {
  readonly resolvedById: string
  readonly now: Date
  readonly comment?: string | null
}

export type ChangeAlreadyResolved = { readonly kind: 'ALREADY_RESOLVED' }

/** Longest rejection comment accepted, carried over from the legacy API. */
export const REJECTION_COMMENT_MAX_LENGTH = 1000

/**
 * A create, update or delete an editor proposed instead of writing directly, waiting for the tree
 * owner to apply it or refuse it. `snapshotBefore`/`snapshotAfter` hold the same field shapes the
 * audit log records, so a proposal reads the same way once it is applied — see
 * `proposal-snapshots.ts` for how a `Member` or `Union` becomes one.
 */
export class PendingChange {
  private constructor(private readonly props: PendingChangeProps) {
    Object.freeze(this)
  }

  /** A proposal as stored, possibly already resolved. */
  static create(props: PendingChangeProps): PendingChange {
    return new PendingChange(props)
  }

  /** A new proposal, always `PENDING`. */
  static propose(input: ProposeChangeInput): PendingChange {
    return new PendingChange({
      ...input,
      status: 'PENDING',
      rejectionComment: null,
      resolvedAt: null,
      resolvedById: null,
    })
  }

  /** The proposal approved or rejected by the owner; refuses one already resolved. */
  resolve(
    decision: PendingDecision,
    by: ResolveChangeInput,
  ): Result<PendingChange, ChangeAlreadyResolved> {
    if (this.props.status !== 'PENDING') return err({ kind: 'ALREADY_RESOLVED' })
    return ok(
      new PendingChange({
        ...this.props,
        status: decision,
        rejectionComment: trimmedComment(by.comment ?? null, this.props.id),
        resolvedAt: by.now,
        resolvedById: by.resolvedById,
      }),
    )
  }

  get id(): string {
    return this.props.id
  }

  get treeId(): string {
    return this.props.treeId
  }

  get authorId(): string {
    return this.props.authorId
  }

  get targetType(): PendingTargetType {
    return this.props.targetType
  }

  get targetId(): string {
    return this.props.targetId
  }

  get action(): PendingActionKind {
    return this.props.action
  }

  get snapshotBefore(): AuditSnapshot | null {
    return this.props.snapshotBefore
  }

  get snapshotAfter(): AuditSnapshot | null {
    return this.props.snapshotAfter
  }

  get status(): PendingStatus {
    return this.props.status
  }

  get rejectionComment(): string | null {
    return this.props.rejectionComment
  }

  get resolvedAt(): Date | null {
    return this.props.resolvedAt
  }

  get resolvedById(): string | null {
    return this.props.resolvedById
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get isPending(): boolean {
    return this.props.status === 'PENDING'
  }
}

function trimmedComment(comment: string | null, id: string): string | null {
  if (comment === null) return null
  const trimmed = comment.trim()
  if (trimmed === '') return null
  if (trimmed.length > REJECTION_COMMENT_MAX_LENGTH) {
    throw new DomainError('PendingChange.rejectionComment is too long', { pendingChangeId: id })
  }
  return trimmed
}
