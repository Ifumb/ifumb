import 'server-only'
import type { Union } from '@/core/entities/union'
import type { MemberId } from '@/core/shared/value-objects/member-id'
import type { UnionChildLink, UnionWriter } from '@/core/use-cases/ports/union-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaUnionWriter implements UnionWriter {
  constructor(private readonly db: PrismaExecutor) {}

  async insert(treeId: string, union: Union): Promise<void> {
    await this.db.union.create({ data: { id: union.id, treeId, ...detailColumns(union) } })
  }

  async update(union: Union): Promise<void> {
    await this.db.union.update({ where: { id: union.id }, data: detailColumns(union) })
  }

  /** The children's links go with the union (`UnionChild.unionId` is ON DELETE CASCADE). */
  async delete(unionId: string): Promise<void> {
    await this.db.union.delete({ where: { id: unionId } })
  }

  async addChild(unionId: string, link: UnionChildLink): Promise<void> {
    await this.db.unionChild.create({
      data: { id: link.id, unionId, childId: link.childId.value, filiationType: link.filiation },
    })
  }

  async removeChild(unionId: string, childId: MemberId): Promise<void> {
    await this.db.unionChild.deleteMany({ where: { unionId, childId: childId.value } })
  }
}

function detailColumns(union: Union) {
  return {
    type: union.type,
    parent1Id: union.parent1Id?.value ?? null,
    parent2Id: union.parent2Id?.value ?? null,
    startDate: union.startDate?.toString() ?? null,
    endDate: union.endDate?.toString() ?? null,
  } satisfies Prisma.UnionUncheckedUpdateInput
}
