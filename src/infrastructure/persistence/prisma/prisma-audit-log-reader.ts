import 'server-only'
import { AuditCursor } from '@/core/shared/value-objects/audit-cursor'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type { AuditLogFilter } from '@/core/use-cases/audit-log-views'
import type { AuditLogReader, AuditLogSlice } from '@/core/use-cases/ports/audit-log-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import {
  AUDIT_ENTRY_ROW_INCLUDE,
  toAuditEntry,
} from '@/infrastructure/persistence/prisma/mappers/audit-log-mapper'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

const DAY_MS = 24 * 60 * 60 * 1000

export class PrismaAuditLogReader implements AuditLogReader {
  constructor(private readonly db: PrismaExecutor) {}

  async page(
    treeId: TreeId,
    filter: AuditLogFilter,
    cursor: AuditCursor | null,
    size: number,
  ): Promise<AuditLogSlice> {
    const rows = await this.db.auditLog.findMany({
      where: { AND: [{ treeId: treeId.value }, ...filterClauses(filter), ...olderThan(cursor)] },
      // reason: the id breaks ties between entries of the same instant, which the legacy order by
      // timestamp alone left undefined — pages could then skip or repeat an entry.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: size + 1,
      include: AUDIT_ENTRY_ROW_INCLUDE,
    })
    const entries = rows.slice(0, size).map(toAuditEntry)
    const last = entries.at(-1)
    return {
      entries,
      next: rows.length > size && last ? AuditCursor.of(last.createdAt, last.id) : null,
    }
  }
}

function filterClauses({ action, fromDay, toDay }: AuditLogFilter): Prisma.AuditLogWhereInput[] {
  return [
    ...(action ? [{ action }] : []),
    ...(fromDay ? [{ createdAt: { gte: startOfDay(fromDay) } }] : []),
    // reason: `lt` the next day keeps every entry of the chosen day; the legacy `lte` at midnight
    // left that whole day out.
    ...(toDay ? [{ createdAt: { lt: new Date(startOfDay(toDay).getTime() + DAY_MS) } }] : []),
  ]
}

function olderThan(cursor: AuditCursor | null): Prisma.AuditLogWhereInput[] {
  if (!cursor) return []
  const { createdAt, id } = cursor
  return [{ OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }] }]
}

function startOfDay(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`)
}
