import 'server-only'
import type { ClaimedMember, MemberClaimReader } from '@/core/use-cases/ports/member-claim-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaMemberClaimReader implements MemberClaimReader {
  constructor(private readonly db: PrismaExecutor) {}

  async findClaimedBy(userId: string): Promise<ClaimedMember | null> {
    const member = await this.db.member.findUnique({
      where: { claimedByUserId: userId },
      select: { id: true, treeId: true },
    })
    return member ? { treeId: member.treeId, memberId: member.id } : null
  }
}
