import type { InvitationRole } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'
export type InvitationDecision = 'ACCEPTED' | 'REJECTED'

export type InvitationProps = {
  readonly id: string
  readonly treeId: string
  readonly email: string
  readonly role: InvitationRole
  readonly status: InvitationStatus
  readonly token: string | null
  readonly expiresAt: Date | null
  readonly userId: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type SendInvitationInput = {
  readonly id: string
  readonly treeId: string
  readonly email: string
  readonly role: InvitationRole
  readonly token: string
  readonly expiresAt: Date
  readonly now: Date
}

export type ResolveInvitationInput = {
  readonly userId: string
  readonly now: Date
}

export type InvitationAlreadyResolved = { readonly kind: 'INVITATION_ALREADY_RESOLVED' }
export type InvitationExpired = { readonly kind: 'INVITATION_EXPIRED' }
export type InvitationNotAccepted = { readonly kind: 'INVITATION_NOT_ACCEPTED' }

/**
 * An owner's invitation for someone to collaborate on a tree, by email. `token` is cleared once
 * resolved — accepted or rejected, it is no longer a usable link (legacy behaviour, kept: a stale
 * copy of the email cannot reopen a decision already made).
 */
export class Invitation {
  private constructor(private readonly props: InvitationProps) {
    Object.freeze(this)
  }

  /** An invitation as stored, whatever its status. */
  static create(props: InvitationProps): Invitation {
    return new Invitation(props)
  }

  /** A freshly sent invitation, always `PENDING`. */
  static send(input: SendInvitationInput): Invitation {
    return new Invitation({
      id: input.id,
      treeId: input.treeId,
      email: input.email,
      role: input.role,
      status: 'PENDING',
      token: input.token,
      expiresAt: input.expiresAt,
      userId: null,
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  /** The invitee's decision; refuses one already resolved or whose link has expired. */
  resolve(
    decision: InvitationDecision,
    by: ResolveInvitationInput,
  ): Result<Invitation, InvitationAlreadyResolved | InvitationExpired> {
    if (this.props.status !== 'PENDING') return err({ kind: 'INVITATION_ALREADY_RESOLVED' })
    if (this.isExpired(by.now)) return err({ kind: 'INVITATION_EXPIRED' })
    return ok(
      new Invitation({
        ...this.props,
        status: decision,
        userId: decision === 'ACCEPTED' ? by.userId : null,
        token: null,
        updatedAt: by.now,
      }),
    )
  }

  /** Only the owner changes a collaborator's role, and only once they have accepted. */
  changeRole(role: InvitationRole, now: Date): Result<Invitation, InvitationNotAccepted> {
    if (this.props.status !== 'ACCEPTED') return err({ kind: 'INVITATION_NOT_ACCEPTED' })
    if (role === this.props.role) return ok(this)
    return ok(new Invitation({ ...this.props, role, updatedAt: now }))
  }

  isExpired(now: Date): boolean {
    return this.props.expiresAt !== null && this.props.expiresAt.getTime() < now.getTime()
  }

  get id(): string {
    return this.props.id
  }

  get treeId(): string {
    return this.props.treeId
  }

  get email(): string {
    return this.props.email
  }

  get role(): InvitationRole {
    return this.props.role
  }

  get status(): InvitationStatus {
    return this.props.status
  }

  get token(): string | null {
    return this.props.token
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt
  }

  get userId(): string | null {
    return this.props.userId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get isPending(): boolean {
    return this.props.status === 'PENDING'
  }
}
