import 'server-only'
import type { Member, MemberDetailChange, MemberDetailsInput } from '@/core/entities/member'
import { canEditMember } from '@/core/entities/member-access'
import { memberRevisionDiff } from '@/core/entities/member-audit'
import { datesInOrder } from '@/core/entities/member-dates'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import {
  writableMember,
  type MemberReadDeps,
  type MemberTarget,
  type MemberWriteError,
} from '@/core/use-cases/member-write-access'

export type UpdateMemberInput = MemberTarget & MemberDetailsInput

export type UpdateMemberError = MemberWriteError | { readonly kind: 'DEATH_BEFORE_BIRTH' }

type UpdateMemberDeps = MemberReadDeps & {
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

const EDIT_RULE = { allows: canEditMember, refusal: { kind: 'MEMBER_EDIT_FORBIDDEN' } } as const

/** The owner, or the account that claimed the member, revises it; only real changes are stored. */
export class UpdateMemberUseCase {
  constructor(private readonly deps: UpdateMemberDeps) {}

  async execute(
    input: UpdateMemberInput,
  ): Promise<Result<{ changed: boolean }, UpdateMemberError>> {
    const { treeId, memberId, viewerId, ...details } = input
    const target = await writableMember(this.deps, { treeId, memberId, viewerId }, EDIT_RULE)
    if (!target.ok) return target
    if (!datesInOrder(details.birthDate, details.deathDate))
      return err({ kind: 'DEATH_BEFORE_BIRTH' })

    const { member, changes } = target.value.member.revise(details)
    if (changes.length === 0) return ok({ changed: false })
    await this.store({ treeId, authorId: viewerId }, member, changes)
    return ok({ changed: true })
  }

  private store(
    by: { treeId: string; authorId: string },
    member: Member,
    changes: MemberDetailChange[],
  ) {
    return this.deps.unitOfWork.runInTransaction(async ({ members, auditLog }) => {
      await members.update(member)
      await auditLog.record({
        id: this.deps.ids.next(),
        ...by,
        action: 'MEMBER_UPDATED',
        targetType: 'MEMBER',
        targetId: member.id.value,
        diff: memberRevisionDiff(changes),
        createdAt: this.deps.clock.now(),
      })
    })
  }
}
