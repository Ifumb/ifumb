import type { Family } from '@/core/entities/family'
import type { Union } from '@/core/entities/union'
import { MemberId } from '@/core/shared/value-objects/member-id'

/** How one step moves through a union: to a parent, a child, a sibling or a partner. */
export type KinshipStepKind = 'UP' | 'DOWN' | 'SIBLING' | 'PARTNER'

export type KinshipStep = {
  readonly kind: KinshipStepKind
  readonly unionId: string
  /** The member this step reaches. */
  readonly memberId: string
}

export type KinshipPath = {
  readonly fromId: string
  readonly steps: readonly KinshipStep[]
}

type Arrival = { readonly previousId: string; readonly step: KinshipStep }

/**
 * The shortest chain of unions linking two members (breadth-first), or null when none does.
 * Every member is visited once, so cyclic legacy data cannot keep the search running.
 */
export function shortestKinshipPath(
  family: Family,
  fromId: MemberId,
  toId: MemberId,
): KinshipPath | null {
  const arrivals = new Map<string, Arrival | null>([[fromId.value, null]])
  const queue = [fromId.value]
  for (let current = queue.shift(); current !== undefined; current = queue.shift()) {
    if (current === toId.value) return { fromId: fromId.value, steps: stepsTo(current, arrivals) }
    for (const step of stepsFrom(family, current)) {
      if (arrivals.has(step.memberId)) continue
      arrivals.set(step.memberId, { previousId: current, step })
      queue.push(step.memberId)
    }
  }
  return null
}

function stepsTo(targetId: string, arrivals: ReadonlyMap<string, Arrival | null>): KinshipStep[] {
  const steps: KinshipStep[] = []
  for (let arrival = arrivals.get(targetId); arrival; arrival = arrivals.get(arrival.previousId)) {
    steps.unshift(arrival.step)
  }
  return steps
}

function stepsFrom(family: Family, memberId: string): KinshipStep[] {
  return family
    .unions()
    .flatMap((union) => unionStepsFrom(union, memberId))
    .filter((step) => family.findMember(MemberId.fromString(step.memberId)) !== null)
}

function unionStepsFrom(union: Union, memberId: string): KinshipStep[] {
  const parentIds = union.parentIds.map((id) => id.value)
  const childIds = union.children.map((child) => child.childId.value)
  const others = (ids: readonly string[]) => ids.filter((id) => id !== memberId)
  const steps = (kind: KinshipStepKind, ids: readonly string[]) =>
    ids.map((id) => ({ kind, unionId: union.id, memberId: id }))

  if (childIds.includes(memberId)) {
    return [...steps('UP', parentIds), ...steps('SIBLING', others(childIds))]
  }
  if (parentIds.includes(memberId)) {
    return [...steps('DOWN', childIds), ...steps('PARTNER', others(parentIds))]
  }
  return []
}
