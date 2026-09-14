import 'server-only'
import type { AuditSnapshot } from '@/core/entities/audit-change'
import type { AuditLogWriter, AuditRecord } from '@/core/use-cases/ports/audit-log-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaAuditLogWriter implements AuditLogWriter {
  constructor(private readonly db: PrismaExecutor) {}

  async record({ diff, ...entry }: AuditRecord): Promise<void> {
    await this.db.auditLog.create({
      data: { ...entry, diff: { before: toJson(diff.before), after: toJson(diff.after) } },
    })
  }
}

function toJson(snapshot: AuditSnapshot | null): Prisma.InputJsonObject | null {
  return snapshot ? { ...snapshot } : null
}
