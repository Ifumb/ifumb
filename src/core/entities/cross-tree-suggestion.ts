import type { SuggestionConfidence } from '@/core/entities/member-matching'
import { err, ok, type Result } from '@/core/shared/result'

export type SuggestionStatus = 'NEW' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export type CrossTreeSuggestionProps = {
  readonly id: string
  readonly treeId: string
  readonly memberId: string
  readonly targetTreeId: string
  readonly targetMemberId: string
  readonly confidence: SuggestionConfidence
  readonly status: SuggestionStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type ProposeSuggestionInput = {
  readonly id: string
  readonly treeId: string
  readonly memberId: string
  readonly targetTreeId: string
  readonly targetMemberId: string
  readonly confidence: SuggestionConfidence
  readonly now: Date
}

export type SuggestionAlreadyResolved = { readonly kind: 'SUGGESTION_ALREADY_RESOLVED' }

/**
 * "This member in your tree might be the same person as that one, in another tree." Accepting asks
 * the other tree's owner to confirm (opens a `CrossTreeConnectionRequest`); rejecting is terminal
 * for that computation, but a later recompute may bring the same pair back as a fresh `NEW` row —
 * that reset lives in `ComputeSuggestionsUseCase`, not here (module 3.2, decision 2).
 */
export class CrossTreeSuggestion {
  private constructor(private readonly props: CrossTreeSuggestionProps) {
    Object.freeze(this)
  }

  /** A suggestion as stored, whatever its status. */
  static create(props: CrossTreeSuggestionProps): CrossTreeSuggestion {
    return new CrossTreeSuggestion(props)
  }

  /** A freshly computed suggestion, always `NEW`. */
  static propose(input: ProposeSuggestionInput): CrossTreeSuggestion {
    return new CrossTreeSuggestion({
      id: input.id,
      treeId: input.treeId,
      memberId: input.memberId,
      targetTreeId: input.targetTreeId,
      targetMemberId: input.targetMemberId,
      confidence: input.confidence,
      status: 'NEW',
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  accept(now: Date): Result<CrossTreeSuggestion, SuggestionAlreadyResolved> {
    if (this.props.status !== 'NEW') return err({ kind: 'SUGGESTION_ALREADY_RESOLVED' })
    return ok(new CrossTreeSuggestion({ ...this.props, status: 'ACCEPTED', updatedAt: now }))
  }

  reject(now: Date): Result<CrossTreeSuggestion, SuggestionAlreadyResolved> {
    if (this.props.status !== 'NEW') return err({ kind: 'SUGGESTION_ALREADY_RESOLVED' })
    return ok(new CrossTreeSuggestion({ ...this.props, status: 'REJECTED', updatedAt: now }))
  }

  get id(): string {
    return this.props.id
  }

  get treeId(): string {
    return this.props.treeId
  }

  get memberId(): string {
    return this.props.memberId
  }

  get targetTreeId(): string {
    return this.props.targetTreeId
  }

  get targetMemberId(): string {
    return this.props.targetMemberId
  }

  get confidence(): SuggestionConfidence {
    return this.props.confidence
  }

  get status(): SuggestionStatus {
    return this.props.status
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get isNew(): boolean {
    return this.props.status === 'NEW'
  }
}
