import 'server-only'
import type { CrossTreeLink } from '@/core/entities/cross-tree-link'
import type { CrossTreeLinkWriter } from '@/core/use-cases/ports/cross-tree-link-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaCrossTreeLinkWriter implements CrossTreeLinkWriter {
  constructor(private readonly db: PrismaExecutor) {}

  async create(link: CrossTreeLink): Promise<void> {
    await this.db.crossTreeLink.create({
      data: {
        id: link.id,
        tree1Id: link.tree1Id,
        member1Id: link.member1Id,
        tree2Id: link.tree2Id,
        member2Id: link.member2Id,
      },
    })
  }
}
