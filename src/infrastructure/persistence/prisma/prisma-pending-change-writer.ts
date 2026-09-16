import 'server-only'
import type { AuditSnapshot } from '@/core/entities/audit-change'
import type { PendingChange } from '@/core/entities/pending-change'
import type { PendingChangeWriter } from '@/core/use-cases/ports/pending-change-writer'
import { Prisma, type PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaPendingChangeWriter implements PendingChangeWriter {
  constructor(private readonly db: PrismaExecutor) {}

  /**
   * reason: an author proposing again on the same target replaces their own pending row instead of
   * adding a second one; a different author's proposal on that target is untouched (decision
   * confirmed with the user, module 2.6 — the legacy app replaced any author's proposal here).
   */
  async propose(change: PendingChange): Promise<void> {
    const existing = await this.db.pendingChange.findFirst({
      where: {
        treeId: change.treeId,
        authorId: change.authorId,
        targetType: change.targetType,
        targetId: change.targetId,
        status: 'PENDING',
      },
      select: { id: true },
    })
    const fields = {
      action: change.action,
      snapshotBefore: toJson(change.snapshotBefore),
      snapshotAfter: toJson(change.snapshotAfter),
      createdAt: change.createdAt,
    }
    if (existing) {
      await this.db.pendingChange.update({ where: { id: existing.id }, data: fields })
      return
    }
    await this.db.pendingChange.create({
      data: {
        id: change.id,
        treeId: change.treeId,
        authorId: change.authorId,
        targetType: change.targetType,
        targetId: change.targetId,
        ...fields,
      },
    })
  }
}

function toJson(snapshot: AuditSnapshot | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return snapshot ? { ...snapshot } : Prisma.DbNull
}
