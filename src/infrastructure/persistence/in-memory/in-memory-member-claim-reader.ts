import 'server-only'
import type { ClaimedMember, MemberClaimReader } from '@/core/use-cases/ports/member-claim-reader'

/** Test double of the global member-claim lookup. */
export class InMemoryMemberClaimReader implements MemberClaimReader {
  private readonly byUser = new Map<string, ClaimedMember>()

  seed(userId: string, claimed: ClaimedMember): void {
    this.byUser.set(userId, claimed)
  }

  async findClaimedBy(userId: string): Promise<ClaimedMember | null> {
    return this.byUser.get(userId) ?? null
  }
}
