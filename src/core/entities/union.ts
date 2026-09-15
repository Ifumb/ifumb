import type { MemberId } from '@/core/shared/value-objects/member-id'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'

export type UnionType = 'MARRIAGE' | 'PARTNERSHIP' | 'BIOLOGICAL'
export type Filiation = 'BIOLOGICAL' | 'ADOPTIVE' | 'RECOGNIZED'

export type UnionChild = {
  readonly childId: MemberId
  readonly filiation: Filiation
}

/** What a form may set on a union; its children are linked one by one. */
export type UnionDetailsInput = {
  readonly type: UnionType
  readonly parent1Id: MemberId
  readonly parent2Id: MemberId | null
  readonly startDate: PartialDate | null
  readonly endDate: PartialDate | null
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
 * so stored unions may lack parents or repeat one; reading them must not fail. The rules of a
 * written union depend on the whole family, so they live in `union-rules.ts`.
 */
export class Union {
  private constructor(private readonly props: UnionProps) {
    Object.freeze(this)
  }

  static create(props: UnionProps): Union {
    return new Union({ ...props, children: [...props.children] })
  }

  /** A new union, without children yet. */
  static start({ id, ...details }: UnionDetailsInput & { readonly id: string }): Union {
    return new Union({ ...details, id, children: [] })
  }

  /** The union with new details, and whether any of them changed; itself when none did. */
  revise(details: UnionDetailsInput): { union: Union; changed: boolean } {
    const parents = sameParents(this, details)
      ? { parent1Id: this.props.parent1Id, parent2Id: this.props.parent2Id }
      : { parent1Id: details.parent1Id, parent2Id: details.parent2Id }
    const next = new Union({ ...this.props, ...details, ...parents })
    const changed = next.comparable.join('|') !== this.comparable.join('|')
    return { union: changed ? next : this, changed }
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

  get parent1Id(): MemberId | null {
    return this.props.parent1Id
  }

  get parent2Id(): MemberId | null {
    return this.props.parent2Id
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

  private get comparable(): readonly string[] {
    const { type, parent1Id, parent2Id, startDate, endDate } = this.props
    return [
      type,
      parent1Id?.value,
      parent2Id?.value,
      startDate?.toString(),
      endDate?.toString(),
    ].map((value) => value ?? '')
  }
}

/** Whether the details name the union's parents, in either order. */
function sameParents(union: Union, details: UnionDetailsInput): boolean {
  const key = (ids: readonly (MemberId | null)[]) =>
    ids
      .map((id) => id?.value ?? '')
      .sort()
      .join('|')
  return key([details.parent1Id, details.parent2Id]) === key([union.parent1Id, union.parent2Id])
}
