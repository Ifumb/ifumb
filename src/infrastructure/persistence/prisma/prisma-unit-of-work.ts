import 'server-only'
import type { UnitOfWork, UnitOfWorkContext } from '@/core/use-cases/ports/unit-of-work'
import { BusinessWritesDisabledError } from '@/infrastructure/config/business-writes'
import type { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaAuditLogWriter } from '@/infrastructure/persistence/prisma/prisma-audit-log-writer'
import { PrismaMemberWriter } from '@/infrastructure/persistence/prisma/prisma-member-writer'
import { PrismaTreeWriter } from '@/infrastructure/persistence/prisma/prisma-tree-writer'

type PrismaUnitOfWorkOptions = { readonly writesEnabled: boolean }

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: PrismaUnitOfWorkOptions,
  ) {}

  /**
   * Every writer shares the transaction client, so a failure anywhere rolls back all of it.
   * reason: refusing here, before any transaction opens, is the single place every business
   * write goes through — no use case can bypass the BUSINESS_WRITES_ENABLED guard.
   */
  async runInTransaction<T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T> {
    if (!this.options.writesEnabled) throw new BusinessWritesDisabledError()
    return this.prisma.$transaction((transaction) =>
      work({
        trees: new PrismaTreeWriter(transaction),
        members: new PrismaMemberWriter(transaction),
        auditLog: new PrismaAuditLogWriter(transaction),
      }),
    )
  }
}
