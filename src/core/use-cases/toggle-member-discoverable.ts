import 'server-only'
import { canEditMember } from '@/core/entities/member-access'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { readableTree, type TreeReadError, type TreeReadInput } from '@/core/use-cases/tree-read-access'

export type ToggleMemberDiscoverableInput = TreeReadInput & {
  readonly memberId: string
  readonly discoverable: boolean
}

export type ToggleMemberDiscoverableError =
  | TreeReadError
  | { readonly kind: 'MEMBER_NOT_FOUND' }
  | { readonly kind: 'MEMBER_EDIT_FORBIDDEN' }

type ToggleMemberDiscoverableDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/**
 * Opts a member into (or out of) global search, module 3.1's `discoverable` flag. Deliberately kept
 * outside the propose/apply machinery of `UpdateMemberUseCase` — like `claim`, this is a consent
 * setting, not a genealogical fact, so only the owner or the account that claimed the member may
 * change it, and always immediately, never as a proposal an editor sends for approval.
 */
export class ToggleMemberDiscoverableUseCase {
  constructor(private readonly deps: ToggleMemberDiscoverableDeps) {}

  async execute(
    input: ToggleMemberDiscoverableInput,
  ): Promise<Result<{ changed: boolean }, ToggleMemberDiscoverableError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access
    const viewerId = input.viewerId
    if (!viewerId) return err({ kind: 'AUTHENTICATION_REQUIRED' })

    const family = await this.deps.families.loadFamily(access.value.listing.tree.id)
    const memberId = MemberId.fromString(input.memberId)
    const member = family.findMember(memberId)
    if (!member) return err({ kind: 'MEMBER_NOT_FOUND' })
    if (!canEditMember(access.value.role, member, viewerId)) {
      return err({ kind: 'MEMBER_EDIT_FORBIDDEN' })
    }

    const { changed } = member.setDiscoverable(input.discoverable)
    if (!changed) return ok({ changed: false })

    const now = this.deps.clock.now()
    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.members.updateDiscoverable(memberId, input.discoverable)
      await context.auditLog.record({
        id: this.deps.ids.next(),
        treeId: input.treeId,
        authorId: viewerId,
        action: 'MEMBER_UPDATED',
        targetType: 'MEMBER',
        targetId: member.id.value,
        diff: {
          before: { discoverable: !input.discoverable },
          after: { discoverable: input.discoverable },
        },
        createdAt: now,
      })
    })
    return ok({ changed: true })
  }
}
