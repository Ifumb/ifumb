import 'server-only'
import { Family } from '@/core/entities/family'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import {
  toDomainMember,
  toDomainUnion,
} from '@/infrastructure/persistence/prisma/mappers/family-mapper'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaFamilyReader implements FamilyReader {
  constructor(private readonly db: PrismaExecutor) {}

  async loadFamily(treeId: TreeId): Promise<Family> {
    const [members, unions] = await Promise.all([
      this.db.member.findMany({ where: { treeId: treeId.value } }),
      this.db.union.findMany({
        where: { treeId: treeId.value },
        include: { children: { select: { childId: true, filiationType: true } } },
      }),
    ])
    return Family.of(members.map(toDomainMember), unions.map(toDomainUnion))
  }
}
