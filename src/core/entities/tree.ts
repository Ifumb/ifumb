import { DomainError } from '@/core/shared/errors/domain-error'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type { UserId } from '@/core/shared/value-objects/user-id'

export type TreeVisibility = 'PRIVATE' | 'SHARED' | 'PUBLIC'
export type InvitationRole = 'EDITOR' | 'VIEWER'
export type TreeRole = 'OWNER' | InvitationRole

/** Who is looking at a tree: absent `userId` means an anonymous visitor. */
export type TreeViewer = {
  readonly userId?: UserId
  /** Role from an invitation this user accepted on the tree, if any. */
  readonly invitationRole?: InvitationRole
}

export type TreeAccess =
  | { readonly kind: 'granted'; readonly role: TreeRole }
  | { readonly kind: 'authentication-required' }
  | { readonly kind: 'denied' }

export type TreeProps = {
  readonly id: TreeId
  readonly name: string
  readonly description: string | null
  readonly visibility: TreeVisibility
  readonly ownerId: UserId
  readonly archivedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

const AUTHENTICATION_REQUIRED: TreeAccess = { kind: 'authentication-required' }
const DENIED: TreeAccess = { kind: 'denied' }

export class Tree {
  private constructor(private readonly props: TreeProps) {
    Object.freeze(this)
  }

  static create(props: TreeProps): Tree {
    const name = props.name.trim()
    if (name === '') {
      throw new DomainError('Tree.name cannot be blank', { treeId: props.id.value })
    }
    return new Tree({ ...props, name })
  }

  get id(): TreeId {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | null {
    return this.props.description
  }

  get visibility(): TreeVisibility {
    return this.props.visibility
  }

  get ownerId(): UserId {
    return this.props.ownerId
  }

  get isArchived(): boolean {
    return this.props.archivedAt !== null
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  /**
   * Access rule carried over from the legacy API: the owner and invited users keep their own role
   * on any tree; anyone may view a PUBLIC tree; PRIVATE and SHARED trees need one of those links.
   */
  accessFor(viewer: TreeViewer): TreeAccess {
    if (viewer.userId?.value === this.props.ownerId.value) return granted('OWNER')
    if (viewer.userId && viewer.invitationRole) return granted(viewer.invitationRole)
    if (this.props.visibility === 'PUBLIC') return granted('VIEWER')
    return viewer.userId ? DENIED : AUTHENTICATION_REQUIRED
  }
}

function granted(role: TreeRole): TreeAccess {
  return { kind: 'granted', role }
}

/** Owners and editors contribute to a tree: they see its pending changes and its history. */
export function canContribute(role: TreeRole): boolean {
  return role === 'OWNER' || role === 'EDITOR'
}
