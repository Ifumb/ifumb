import type { MemberId } from '@/core/shared/value-objects/member-id'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'

export type UnionType = 'MARRIAGE' | 'PARTNERSHIP' | 'BIOLOGICAL'
export type Filiation = 'BIOLOGICAL' | 'ADOPTIVE' | 'RECOGNIZED'

export type UnionChild = {
  readonly childId: MemberId
  readonly filiation: Filiation
}

export type UnionProps = {
  readonly id: string
  readonly type: UnionType
  readonly startDate: PartialDate | null
  readonly endDate: PartialDate | null
  readonly parent1Id: MemberId | null
  readonly parent2Id: MemberId | null
  readonly children: readonly UnionChild[]
}

/**
 * The link through which children descend from one or two parents (union-centric model).
 * reason: no invariant is enforced here. The legacy app applied pending changes without validation,
 * so stored unions may lack parents or repeat one; reading them must not fail. The creation rules
 * (at least one parent, two distinct parents) belong to the write use cases of Phase 2.
 */
export class Union {
  private constructor(private readonly props: UnionProps) {
    Object.freeze(this)
  }

  static create(props: UnionProps): Union {
    return new Union({ ...props, children: [...props.children] })
  }

  get id(): string {
    return this.props.id
  }

  get type(): UnionType {
    return this.props.type
  }

  get startDate(): PartialDate | null {
    return this.props.startDate
  }

  get endDate(): PartialDate | null {
    return this.props.endDate
  }

  get children(): readonly UnionChild[] {
    return this.props.children
  }

  /** Recorded parents, each listed once. */
  get parentIds(): readonly MemberId[] {
    const { parent1Id, parent2Id } = this.props
    const parents = [parent1Id, parent2Id].filter((id): id is MemberId => id !== null)
    return parents.filter((id, index) => parents.findIndex((p) => p.value === id.value) === index)
  }

  hasParent(memberId: MemberId): boolean {
    return this.parentIds.some((id) => id.value === memberId.value)
  }

  hasChild(memberId: MemberId): boolean {
    return this.props.children.some((child) => child.childId.value === memberId.value)
  }

  /** The parent other than `memberId`, or null when the union records a single parent. */
  otherParentOf(memberId: MemberId): MemberId | null {
    return this.parentIds.find((id) => id.value !== memberId.value) ?? null
  }
}
