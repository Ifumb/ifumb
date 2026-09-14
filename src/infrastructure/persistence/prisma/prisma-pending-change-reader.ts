import 'server-only'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type {
  PendingAction,
  PendingChangeReader,
} from '@/core/use-cases/ports/pending-change-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaPendingChangeReader implements PendingChangeReader {
  constructor(private readonly db: PrismaExecutor) {}

  async pendingTargets(treeId: TreeId): Promise<ReadonlyMap<string, PendingAction>> {
    const rows = await this.db.pendingChange.findMany({
      where: { treeId: treeId.value, status: 'PENDING' },
      select: { targetId: true, action: true },
      // Oldest first: a later change for the same target overwrites the earlier one in the map.
      orderBy: { createdAt: 'asc' },
    })
    return new Map(rows.map((row) => [row.targetId, row.action]))
  }
}
