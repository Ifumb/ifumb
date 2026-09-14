import 'server-only'
import { Tree } from '@/core/entities/tree'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { TreeListing } from '@/core/use-cases/ports/tree-reader'
import type { Prisma } from '@/infrastructure/persistence/prisma/generated/client'

/**
 * What a listing needs besides the tree row itself.
 * reason: Prisma reads `userId: undefined` as "no filter", which would return every accepted
 * invitation of the tree for an anonymous reader. `take: 0` guarantees none is loaded without one.
 */
export function treeListingInclude(readerId: string | undefined) {
  return {
    owner: { select: { firstName: true, lastName: true } },
    _count: { select: { members: true } },
    invitations: {
      where: { userId: readerId, status: 'ACCEPTED' },
      select: { role: true },
      take: readerId ? 1 : 0,
    },
  } satisfies Prisma.TreeInclude
}

export type TreeListingRow = Prisma.TreeGetPayload<{
  include: ReturnType<typeof treeListingInclude>
}>

export function toTreeListing(row: TreeListingRow): TreeListing {
  return {
    tree: Tree.create({
      id: TreeId.fromString(row.id),
      name: row.name,
      description: row.description,
      visibility: row.visibility,
      ownerId: UserId.fromString(row.ownerId),
      archivedAt: row.archivedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }),
    ownerName: row.owner,
    memberCount: row._count.members,
    invitationRole: row.invitations[0]?.role,
  }
}

/** The stored row of a tree entity. */
export function toTreeRow(tree: Tree): Prisma.TreeUncheckedCreateInput {
  return {
    id: tree.id.value,
    ...tree.details,
    ownerId: tree.ownerId.value,
    archivedAt: tree.archivedAt,
    createdAt: tree.createdAt,
    updatedAt: tree.updatedAt,
  }
}
