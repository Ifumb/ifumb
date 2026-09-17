import 'server-only'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { MemberClaimReader } from '@/core/use-cases/ports/member-claim-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { readableTree, type TreeReadError, type TreeReadInput } from '@/core/use-cases/tree-read-access'

export type ClaimMemberInput = TreeReadInput & { readonly memberId: string }

export type ClaimMemberError =
  | TreeReadError
  | { readonly kind: 'MEMBER_NOT_FOUND' }
  | { readonly kind: 'ALREADY_CLAIMED' }
  | { readonly kind: 'ALREADY_CLAIMED_ELSEWHERE' }

type ClaimMemberDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
  readonly memberClaims: MemberClaimReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/**
 * "This is me": any signed-in reader of the tree may claim a member left unclaimed — not just an
 * invited collaborator (carried over from the legacy `TreeAccessGuard`). `claimedByUserId` is
 * unique across the whole database, not per tree, so the check reaches beyond this one family.
 */
export class ClaimMemberUseCase {
  constructor(private readonly deps: ClaimMemberDeps) {}

  async execute(input: ClaimMemberInput): Promise<Result<void, ClaimMemberError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access
    const viewerId = input.viewerId
    if (!viewerId) return err({ kind: 'AUTHENTICATION_REQUIRED' })

    const family = await this.deps.families.loadFamily(access.value.listing.tree.id)
    const memberId = MemberId.fromString(input.memberId)
    const member = family.findMember(memberId)
    if (!member) return err({ kind: 'MEMBER_NOT_FOUND' })
    if (member.claimedById === viewerId) return ok(undefined)
    if (member.claimedById !== null) return err({ kind: 'ALREADY_CLAIMED' })

    const claimedElsewhere = await this.deps.memberClaims.findClaimedBy(viewerId)
    if (claimedElsewhere) return err({ kind: 'ALREADY_CLAIMED_ELSEWHERE' })

    const now = this.deps.clock.now()
    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.members.claim(memberId, viewerId)
      await context.auditLog.record({
        id: this.deps.ids.next(),
        treeId: input.treeId,
        authorId: viewerId,
        action: 'MEMBER_CLAIMED',
        targetType: 'MEMBER',
        targetId: member.id.value,
        diff: { before: null, after: { claimedByUserId: viewerId } },
        createdAt: now,
      })
    })
    return ok(undefined)
  }
}
