import { DomainError } from '@/core/shared/errors/domain-error'
import { err, ok, type Result } from '@/core/shared/result'

export type ContactRequestStatus = 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'WITHDRAWN'
export type ContactRequestDecision = 'ACCEPTED' | 'REFUSED'

export type ContactRequestProps = {
  readonly id: string
  readonly treeId: string
  readonly memberId: string
  readonly requesterId: string
  readonly message: string | null
  readonly status: ContactRequestStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type SendContactRequestInput = {
  readonly id: string
  readonly treeId: string
  readonly memberId: string
  readonly requesterId: string
  readonly message: string | null
  readonly now: Date
}

export type ContactRequestAlreadyResolved = { readonly kind: 'CONTACT_REQUEST_ALREADY_RESOLVED' }

/** Longest message accepted, carried over from the legacy API (`CreateContactRequestDto`). */
export const CONTACT_REQUEST_MESSAGE_MAX_LENGTH = 500

/**
 * A visitor's request to be put in touch with a discoverable member's tree owner. `(requesterId,
 * memberId)` is unique in the database (one row ever, of any status) — `send` upserts that one row
 * rather than blindly inserting, so a request refused or withdrawn once can be tried again (module
 * 2.8's lesson: never let a stale terminal row block a fresh attempt forever).
 */
export class ContactRequest {
  private constructor(private readonly props: ContactRequestProps) {
    Object.freeze(this)
  }

  /** A request as stored, whatever its status. */
  static create(props: ContactRequestProps): ContactRequest {
    return new ContactRequest(props)
  }

  /** A freshly sent (or reset) request, always `PENDING`. */
  static send(input: SendContactRequestInput): ContactRequest {
    return new ContactRequest({
      id: input.id,
      treeId: input.treeId,
      memberId: input.memberId,
      requesterId: input.requesterId,
      message: trimmedMessage(input.message, input.id),
      status: 'PENDING',
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  /** The tree owner's decision; refuses one already resolved. */
  respond(
    decision: ContactRequestDecision,
    now: Date,
  ): Result<ContactRequest, ContactRequestAlreadyResolved> {
    if (this.props.status !== 'PENDING') return err({ kind: 'CONTACT_REQUEST_ALREADY_RESOLVED' })
    return ok(new ContactRequest({ ...this.props, status: decision, updatedAt: now }))
  }

  /** The requester pulling back their own request; refuses one already resolved. */
  withdraw(now: Date): Result<ContactRequest, ContactRequestAlreadyResolved> {
    if (this.props.status !== 'PENDING') return err({ kind: 'CONTACT_REQUEST_ALREADY_RESOLVED' })
    return ok(new ContactRequest({ ...this.props, status: 'WITHDRAWN', updatedAt: now }))
  }

  /** `PENDING` or `ACCEPTED`: an engagement already in progress, never silently reset by `send`. */
  get isActive(): boolean {
    return this.props.status === 'PENDING' || this.props.status === 'ACCEPTED'
  }

  get id(): string {
    return this.props.id
  }

  get treeId(): string {
    return this.props.treeId
  }

  get memberId(): string {
    return this.props.memberId
  }

  get requesterId(): string {
    return this.props.requesterId
  }

  get message(): string | null {
    return this.props.message
  }

  get status(): ContactRequestStatus {
    return this.props.status
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}

function trimmedMessage(message: string | null, id: string): string | null {
  if (message === null) return null
  const trimmed = message.trim()
  if (trimmed === '') return null
  if (trimmed.length > CONTACT_REQUEST_MESSAGE_MAX_LENGTH) {
    throw new DomainError('ContactRequest.message is too long', { contactRequestId: id })
  }
  return trimmed
}
