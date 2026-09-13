import 'server-only'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type { UserId } from '@/core/shared/value-objects/user-id'
import type { TreeListing, TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import {
  toTreeListing,
  treeListingInclude,
} from '@/infrastructure/persistence/prisma/mappers/tree-mapper'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaTreeReader implements TreeReader {
  constructor(private readonly db: PrismaExecutor) {}

  /** One query with OR, so a tree its owner was also invited to comes back only once. */
  async listAccessibleBy(userId: UserId): Promise<TreeListing[]> {
    const rows = await this.db.tree.findMany({
      where: {
        OR: [
          { ownerId: userId.value },
          { invitations: { some: { userId: userId.value, status: 'ACCEPTED' } } },
        ],
      },
      include: treeListingInclude(userId.value),
    })
    return rows.map(toTreeListing)
  }

  async findById(treeId: TreeId, readerId?: UserId): Promise<TreeListing | null> {
    const row = await this.db.tree.findUnique({
      where: { id: treeId.value },
      include: treeListingInclude(readerId?.value),
    })
    return row ? toTreeListing(row) : null
  }
}
