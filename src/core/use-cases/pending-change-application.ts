import 'server-only'
import type { Family } from '@/core/entities/family'
import { Member, type MemberDetailsInput } from '@/core/entities/member'
import { datesInOrder } from '@/core/entities/member-dates'
import type { PendingChange } from '@/core/entities/pending-change'
import {
  BLANK_MEMBER_DETAILS,
  memberDetailsFromSnapshot,
  unionDetailsFromSnapshot,
  unionSnapshotValues,
  type ProposalUnreadable,
  type UnionSnapshotDetails,
} from '@/core/entities/proposal-snapshots'
import { isOutdated } from '@/core/entities/proposal-staleness'
import { Union, type UnionDetailsInput } from '@/core/entities/union'
import {
  parentChangeProblem,
  parentIdsIn,
  unionDetailsProblem,
  type UnionDetailsProblem,
} from '@/core/entities/union-rules'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { UnitOfWorkContext } from '@/core/use-cases/ports/unit-of-work'

export type ApplicationError =
  | { readonly kind: 'CHANGE_OUTDATED' }
  | ProposalUnreadable
  | { readonly kind: 'DEATH_BEFORE_BIRTH' }
  | { readonly kind: UnionDetailsProblem }
  | { readonly kind: 'FAMILY_CYCLE' }

/** What approving a proposal writes, and the photo file (if any) to discard once it has. */
export type ApplicationOutcome = {
  readonly write: (context: UnitOfWorkContext) => Promise<void>
  readonly photoToDiscard: string | null
}

const NOTHING_TO_DISCARD = null

/**
 * What approving a proposal on a member would write — revalidated with the same domain rules a
 * direct write already uses, never the raw JSON (closes the legacy's bug 1), and refused as
 * outdated when the family no longer matches what the proposal was based on (bug 2).
 */
export function applyMemberChange(
  change: PendingChange,
  family: Family,
  treeId: string,
): Result<ApplicationOutcome, ApplicationError> {
  const memberId = MemberId.fromString(change.targetId)
  const current = family.findMember(memberId)

  if (change.action === 'CREATE') {
    const details = parsedMemberDetails(BLANK_MEMBER_DETAILS, change)
    if (!details.ok) return details
    const member = Member.start({ id: memberId, ...details.value })
    return ok({
      write: (context) => context.members.insert(treeId, member),
      photoToDiscard: NOTHING_TO_DISCARD,
    })
  }

  if (!current) return err({ kind: 'CHANGE_OUTDATED' })
  if (isOutdated(change.snapshotBefore, current.recordedValues)) {
    return err({ kind: 'CHANGE_OUTDATED' })
  }

  if (change.action === 'DELETE') {
    return ok({
      write: (context) => context.members.delete(memberId),
      photoToDiscard: current.details.photoUrl,
    })
  }

  const details = parsedMemberDetails(current.details, change)
  if (!details.ok) return details
  const revised = current.revise(details.value).member
  return ok({ write: (context) => context.members.update(revised), photoToDiscard: NOTHING_TO_DISCARD })
}

function parsedMemberDetails(
  base: MemberDetailsInput,
  change: PendingChange,
): Result<MemberDetailsInput, ApplicationError> {
  const details = memberDetailsFromSnapshot(base, change.snapshotAfter ?? {})
  if (!details.ok) return details
  if (!datesInOrder(details.value.birthDate, details.value.deathDate)) {
    return err({ kind: 'DEATH_BEFORE_BIRTH' })
  }
  return details
}

const BLANK_UNION_DETAILS: UnionSnapshotDetails = {
  type: 'BIOLOGICAL',
  parent1Id: '',
  parent2Id: null,
  startDate: null,
  endDate: null,
}

/** Same revalidation as `applyMemberChange`, for a union. */
export function applyUnionChange(
  change: PendingChange,
  family: Family,
  treeId: string,
): Result<ApplicationOutcome, ApplicationError> {
  const current = family.findUnion(change.targetId)

  if (change.action === 'CREATE') {
    const details = parsedUnionDetails(BLANK_UNION_DETAILS, change, family, null)
    if (!details.ok) return details
    const union = Union.start({ id: change.targetId, ...details.value })
    return ok({
      write: (context) => context.unions.insert(treeId, union),
      photoToDiscard: NOTHING_TO_DISCARD,
    })
  }

  if (!current) return err({ kind: 'CHANGE_OUTDATED' })
  if (isOutdated(change.snapshotBefore, unionSnapshotValues(current))) {
    return err({ kind: 'CHANGE_OUTDATED' })
  }

  if (change.action === 'DELETE') {
    return ok({
      write: (context) => context.unions.delete(current.id),
      photoToDiscard: NOTHING_TO_DISCARD,
    })
  }

  const details = parsedUnionDetails(snapshotOfUnion(current), change, family, current)
  if (!details.ok) return details
  const revised = current.revise(details.value).union
  return ok({ write: (context) => context.unions.update(revised), photoToDiscard: NOTHING_TO_DISCARD })
}

function snapshotOfUnion(union: Union): UnionSnapshotDetails {
  return {
    type: union.type,
    parent1Id: union.parent1Id?.value ?? '',
    parent2Id: union.parent2Id?.value ?? null,
    startDate: union.startDate,
    endDate: union.endDate,
  }
}

function parsedUnionDetails(
  base: UnionSnapshotDetails,
  change: PendingChange,
  family: Family,
  current: Union | null,
): Result<UnionDetailsInput, ApplicationError> {
  const snapshot = unionDetailsFromSnapshot(base, change.snapshotAfter ?? {})
  if (!snapshot.ok) return snapshot
  const details: UnionDetailsInput = {
    type: snapshot.value.type,
    parent1Id: MemberId.fromString(snapshot.value.parent1Id),
    parent2Id: snapshot.value.parent2Id ? MemberId.fromString(snapshot.value.parent2Id) : null,
    startDate: snapshot.value.startDate,
    endDate: snapshot.value.endDate,
  }
  const problem =
    unionDetailsProblem(family, details) ??
    (current ? parentChangeProblem(family, current, parentIdsIn(details)) : null)
  return problem ? err({ kind: problem }) : ok(details)
}
