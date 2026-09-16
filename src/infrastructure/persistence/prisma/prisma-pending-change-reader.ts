import 'server-only'
import type { AuditSnapshot } from '@/core/entities/audit-change'
import { PendingChange } from '@/core/entities/pending-change'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type {
  PendingAction,
  PendingChangeReader,
  PendingChangeSummary,
} from '@/core/use-cases/ports/pending-change-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

type PendingChangeRow = {
  readonly id: string
  readonly authorId: string
  readonly author: { readonly firstName: string; readonly lastName: string | null }
  readonly targetType: 'MEMBER' | 'UNION'
  readonly targetId: string
  readonly action: 'CREATE' | 'UPDATE' | 'DELETE'
  readonly snapshotBefore: unknown
  readonly snapshotAfter: unknown
  readonly status: 'PENDING' | 'APPROVED' | 'REJECTED'
  readonly createdAt: Date
}

const AUTHOR_SELECT = { select: { firstName: true, lastName: true } } as const

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

  async pendingForTree(treeId: TreeId): Promise<readonly PendingChangeSummary[]> {
    const rows = await this.db.pendingChange.findMany({
      where: { treeId: treeId.value, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: { author: AUTHOR_SELECT },
    })
    return rows.map(toSummary)
  }

  async byAuthor(treeId: TreeId, authorId: string): Promise<readonly PendingChangeSummary[]> {
    const rows = await this.db.pendingChange.findMany({
      where: { treeId: treeId.value, authorId },
      orderBy: { createdAt: 'desc' },
      include: { author: AUTHOR_SELECT },
    })
    return rows.map(toSummary)
  }

  async findById(treeId: TreeId, id: string): Promise<PendingChange | null> {
    const row = await this.db.pendingChange.findFirst({ where: { id, treeId: treeId.value } })
    if (!row) return null
    return PendingChange.create({
      ...row,
      snapshotBefore: row.snapshotBefore as AuditSnapshot | null,
      snapshotAfter: row.snapshotAfter as AuditSnapshot | null,
    })
  }
}

function toSummary(row: PendingChangeRow): PendingChangeSummary {
  return {
    id: row.id,
    authorId: row.authorId,
    authorName: [row.author.firstName, row.author.lastName].filter(Boolean).join(' '),
    targetType: row.targetType,
    targetId: row.targetId,
    action: row.action,
    snapshotBefore: row.snapshotBefore as AuditSnapshot | null,
    snapshotAfter: row.snapshotAfter as AuditSnapshot | null,
    status: row.status,
    createdAt: row.createdAt,
  }
}
