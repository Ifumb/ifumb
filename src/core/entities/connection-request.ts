import { err, ok, type Result } from '@/core/shared/result'

export type ConnectionRequestStatus = 'PENDING' | 'APPROVED' | 'REFUSED' | 'EXPIRED'

export type CrossTreeConnectionRequestProps = {
  readonly id: string
  readonly requesterTreeId: string
  readonly requesterMemberId: string
  readonly targetTreeId: string
  readonly targetMemberId: string
  readonly initiatedByUserId: string
  readonly status: ConnectionRequestStatus
  readonly createdAt: Date
  readonly expiresAt: Date
  readonly resolvedAt: Date | null
  readonly resolvedByUserId: string | null
}

export type OpenConnectionRequestInput = {
  readonly id: string
  readonly requesterTreeId: string
  readonly requesterMemberId: string
  readonly targetTreeId: string
  readonly targetMemberId: string
  readonly initiatedByUserId: string
  readonly expiresAt: Date
  readonly now: Date
}

export type ResolveConnectionRequestInput = {
  readonly resolvedByUserId: string
  readonly now: Date
}

export type ConnectionRequestAlreadyResolved = { readonly kind: 'CONNECTION_REQUEST_ALREADY_RESOLVED' }
export type ConnectionRequestExpired = { readonly kind: 'CONNECTION_REQUEST_EXPIRED' }

/**
 * Opened when a source tree's owner or editor accepts a `CrossTreeSuggestion`, asking the target
 * tree's owner to confirm. Approving creates a `CrossTreeLink`. `approve`/`refuse` re-check
 * `expiresAt` themselves (module 3.2, decision 3) — the legacy app only purged stale rows when the
 * list was read, so a request could still be approved after its 30-day window with stale client
 * state or a direct call; this closes that at the domain level, without a scheduled sweep (ADR 0004).
 */
export class CrossTreeConnectionRequest {
  private constructor(private readonly props: CrossTreeConnectionRequestProps) {
    Object.freeze(this)
  }

  /** A request as stored, whatever its status. */
  static create(props: CrossTreeConnectionRequestProps): CrossTreeConnectionRequest {
    return new CrossTreeConnectionRequest(props)
  }

  /** A freshly opened request, always `PENDING`. */
  static open(input: OpenConnectionRequestInput): CrossTreeConnectionRequest {
    return new CrossTreeConnectionRequest({
      id: input.id,
      requesterTreeId: input.requesterTreeId,
      requesterMemberId: input.requesterMemberId,
      targetTreeId: input.targetTreeId,
      targetMemberId: input.targetMemberId,
      initiatedByUserId: input.initiatedByUserId,
      status: 'PENDING',
      createdAt: input.now,
      expiresAt: input.expiresAt,
      resolvedAt: null,
      resolvedByUserId: null,
    })
  }

  approve(
    by: ResolveConnectionRequestInput,
  ): Result<CrossTreeConnectionRequest, ConnectionRequestAlreadyResolved | ConnectionRequestExpired> {
    return this.resolve('APPROVED', by)
  }

  refuse(
    by: ResolveConnectionRequestInput,
  ): Result<CrossTreeConnectionRequest, ConnectionRequestAlreadyResolved | ConnectionRequestExpired> {
    return this.resolve('REFUSED', by)
  }

  private resolve(
    status: 'APPROVED' | 'REFUSED',
    by: ResolveConnectionRequestInput,
  ): Result<CrossTreeConnectionRequest, ConnectionRequestAlreadyResolved | ConnectionRequestExpired> {
    if (this.props.status !== 'PENDING') return err({ kind: 'CONNECTION_REQUEST_ALREADY_RESOLVED' })
    if (this.isExpired(by.now)) return err({ kind: 'CONNECTION_REQUEST_EXPIRED' })
    return ok(
      new CrossTreeConnectionRequest({
        ...this.props,
        status,
        resolvedAt: by.now,
        resolvedByUserId: by.resolvedByUserId,
      }),
    )
  }

  isExpired(now: Date): boolean {
    return this.props.expiresAt.getTime() < now.getTime()
  }

  get id(): string {
    return this.props.id
  }

  get requesterTreeId(): string {
    return this.props.requesterTreeId
  }

  get requesterMemberId(): string {
    return this.props.requesterMemberId
  }

  get targetTreeId(): string {
    return this.props.targetTreeId
  }

  get targetMemberId(): string {
    return this.props.targetMemberId
  }

  get initiatedByUserId(): string {
    return this.props.initiatedByUserId
  }

  get status(): ConnectionRequestStatus {
    return this.props.status
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get expiresAt(): Date {
    return this.props.expiresAt
  }

  get resolvedAt(): Date | null {
    return this.props.resolvedAt
  }

  get resolvedByUserId(): string | null {
    return this.props.resolvedByUserId
  }

  get isPending(): boolean {
    return this.props.status === 'PENDING'
  }
}
