import 'server-only'
import { culturalTokens } from '@/core/entities/cultural-tokens'
import type { MatchableMember } from '@/core/entities/member-matching'
import type { TreeMemberPool } from '@/core/use-cases/ports/tree-member-pool'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { optionalPartialDate } from '@/infrastructure/persistence/prisma/mappers/family-mapper'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

const POOL_MEMBER_SELECT = {
  id: true,
  treeId: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  tribe: true,
  ethnicity: true,
} as const satisfies Prisma.MemberSelect

type PoolMemberRow = Prisma.MemberGetPayload<{ select: typeof POOL_MEMBER_SELECT }>

export class PrismaTreeMemberPool implements TreeMemberPool {
  constructor(private readonly db: PrismaExecutor) {}

  async candidatesFor(sourceTreeId: string, computedByUserId: string): Promise<readonly MatchableMember[]> {
    const rows = await this.db.member.findMany({
      where: {
        treeId: { not: sourceTreeId },
        tree: {
          archivedAt: null,
          OR: [
            { visibility: { in: ['PUBLIC', 'SHARED'] } },
            { ownerId: computedByUserId },
            { invitations: { some: { userId: computedByUserId, status: 'ACCEPTED' } } },
          ],
        },
      },
      select: POOL_MEMBER_SELECT,
    })
    return rows.map(toMatchable)
  }
}

function toMatchable(row: PoolMemberRow): MatchableMember {
  return {
    treeId: row.treeId,
    memberId: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    birthYear: optionalPartialDate(row.birthDate)?.year ?? null,
    culturalTokens: [...culturalTokens(row.tribe), ...culturalTokens(row.ethnicity)],
  }
}
