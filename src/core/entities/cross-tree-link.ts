export type CrossTreeLinkProps = {
  readonly id: string
  readonly tree1Id: string
  readonly member1Id: string
  readonly tree2Id: string
  readonly member2Id: string
  readonly createdAt: Date
}

export type EstablishCrossTreeLinkInput = {
  readonly id: string
  readonly tree1Id: string
  readonly member1Id: string
  readonly tree2Id: string
  readonly member2Id: string
  readonly now: Date
}

/** The bridge member on the far side of a link, seen from one of its two trees. */
export type LinkedMember = { readonly treeId: string; readonly memberId: string }

/**
 * A confirmed connection between a member of one tree and the same person's member in another —
 * created once a `CrossTreeConnectionRequest` is approved. Reading the foreign tree's graph through
 * a link is module 3.3; this entity only records that the link exists.
 */
export class CrossTreeLink {
  private constructor(private readonly props: CrossTreeLinkProps) {
    Object.freeze(this)
  }

  static create(props: CrossTreeLinkProps): CrossTreeLink {
    return new CrossTreeLink(props)
  }

  static establish(input: EstablishCrossTreeLinkInput): CrossTreeLink {
    return new CrossTreeLink({ ...input, createdAt: input.now })
  }

  /** The other side of the link, given one tree it connects; null if this link does not touch it. */
  otherSide(treeId: string): LinkedMember | null {
    if (this.props.tree1Id === treeId) {
      return { treeId: this.props.tree2Id, memberId: this.props.member2Id }
    }
    if (this.props.tree2Id === treeId) {
      return { treeId: this.props.tree1Id, memberId: this.props.member1Id }
    }
    return null
  }

  /** This link's own member on the tree side given, matching `otherSide`; null if it does not touch it. */
  ownSide(treeId: string): LinkedMember | null {
    if (this.props.tree1Id === treeId) {
      return { treeId: this.props.tree1Id, memberId: this.props.member1Id }
    }
    if (this.props.tree2Id === treeId) {
      return { treeId: this.props.tree2Id, memberId: this.props.member2Id }
    }
    return null
  }

  get id(): string {
    return this.props.id
  }

  get tree1Id(): string {
    return this.props.tree1Id
  }

  get member1Id(): string {
    return this.props.member1Id
  }

  get tree2Id(): string {
    return this.props.tree2Id
  }

  get member2Id(): string {
    return this.props.member2Id
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
