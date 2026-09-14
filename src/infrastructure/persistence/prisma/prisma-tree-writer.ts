import 'server-only'
import type { Tree } from '@/core/entities/tree'
import type { TreeWriter } from '@/core/use-cases/ports/tree-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { toTreeRow } from '@/infrastructure/persistence/prisma/mappers/tree-mapper'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaTreeWriter implements TreeWriter {
  constructor(private readonly db: PrismaExecutor) {}

  async insert(tree: Tree): Promise<void> {
    await this.db.tree.create({ data: toTreeRow(tree) })
  }

  async update(tree: Tree): Promise<void> {
    const { name, description, visibility, updatedAt } = toTreeRow(tree)
    await this.db.tree.update({
      where: { id: tree.id.value },
      data: { name, description, visibility, updatedAt },
    })
  }
}
