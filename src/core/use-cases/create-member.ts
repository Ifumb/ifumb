import 'server-only'
import { Member, type MemberDetailsInput } from '@/core/entities/member'
import { canAddMember } from '@/core/entities/member-access'
import { memberCreationDiff } from '@/core/entities/member-audit'
import { datesInOrder } from '@/core/entities/member-dates'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { readableTree, type TreeReadError } from '@/core/use-cases/tree-read-access'

export type CreateMemberInput = MemberDetailsInput & {
  readonly treeId: string
  readonly viewerId: string
}

export type CreateMemberError =
  | TreeReadError
  | { readonly kind: 'MEMBER_MANAGEMENT_FORBIDDEN' }
  | { readonly kind: 'DEATH_BEFORE_BIRTH' }

type CreateMemberDeps = {
  readonly trees: TreeReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** The owner adds a member to a tree, recorded in its history in the same transaction. */
export class CreateMemberUseCase {
  constructor(private readonly deps: CreateMemberDeps) {}

  async execute(
    input: CreateMemberInput,
  ): Promise<Result<{ memberId: string }, CreateMemberError>> {
    const { treeId, viewerId, ...details } = input
    const access = await readableTree(this.deps.trees, { treeId, viewerId })
    if (!access.ok) return access
    if (!canAddMember(access.value.role)) return err({ kind: 'MEMBER_MANAGEMENT_FORBIDDEN' })
    if (!datesInOrder(details.birthDate, details.deathDate))
      return err({ kind: 'DEATH_BEFORE_BIRTH' })

    const member = Member.start({ id: MemberId.fromString(this.deps.ids.next()), ...details })
    await this.store(member, { treeId, authorId: viewerId })
    return ok({ memberId: member.id.value })
  }

  private store(member: Member, by: { treeId: string; authorId: string }) {
    return this.deps.unitOfWork.runInTransaction(async ({ members, auditLog }) => {
      await members.insert(by.treeId, member)
      await auditLog.record({
        id: this.deps.ids.next(),
        ...by,
        action: 'MEMBER_CREATED',
        targetType: 'MEMBER',
        targetId: member.id.value,
        diff: memberCreationDiff(member),
        createdAt: this.deps.clock.now(),
      })
    })
  }
}
