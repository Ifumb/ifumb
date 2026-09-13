import 'server-only'
import type { InvitationRole, Tree } from '@/core/entities/tree'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type { UserId } from '@/core/shared/value-objects/user-id'
import type { PersonName, TreeListing, TreeReader } from '@/core/use-cases/ports/tree-reader'

export type StoredTree = {
  readonly tree: Tree
  readonly ownerName: PersonName
  readonly memberCount: number
  readonly acceptedInvitations: readonly {
    readonly userId: string
    readonly role: InvitationRole
  }[]
}

/** Test double of the tree reader, substitutable for the Prisma implementation. */
export class InMemoryTreeReader implements TreeReader {
  private readonly stored: StoredTree[] = []

  seed(...trees: StoredTree[]): void {
    this.stored.push(...trees)
  }

  async listAccessibleBy(userId: UserId): Promise<TreeListing[]> {
    return this.stored
      .filter((entry) => isOwner(entry, userId) || invitationRoleOf(entry, userId) !== undefined)
      .map((entry) => toListing(entry, userId))
  }

  async findById(treeId: TreeId, readerId?: UserId): Promise<TreeListing | null> {
    const entry = this.stored.find(({ tree }) => tree.id.value === treeId.value)
    return entry ? toListing(entry, readerId) : null
  }
}

function isOwner(entry: StoredTree, userId: UserId): boolean {
  return entry.tree.ownerId.value === userId.value
}

function invitationRoleOf(entry: StoredTree, userId?: UserId): InvitationRole | undefined {
  return entry.acceptedInvitations.find((invitation) => invitation.userId === userId?.value)?.role
}

function toListing(entry: StoredTree, readerId?: UserId): TreeListing {
  return {
    tree: entry.tree,
    ownerName: entry.ownerName,
    memberCount: entry.memberCount,
    invitationRole: invitationRoleOf(entry, readerId),
  }
}
