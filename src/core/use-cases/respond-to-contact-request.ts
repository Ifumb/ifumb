import 'server-only'
import type { ContactRequestAlreadyResolved, ContactRequestDecision } from '@/core/entities/contact-request'
import { err, ok, type Result } from '@/core/shared/result'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { ContactRequestReader } from '@/core/use-cases/ports/contact-request-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'

export type RespondToContactRequestInput = {
  readonly contactRequestId: string
  readonly viewerId: string
  readonly decision: ContactRequestDecision
}

export type RespondToContactRequestError =
  | { readonly kind: 'CONTACT_REQUEST_NOT_FOUND' }
  | { readonly kind: 'NOT_TREE_OWNER' }
  | ContactRequestAlreadyResolved

type RespondToContactRequestDeps = {
  readonly contactRequests: ContactRequestReader
  readonly trees: TreeReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** Only the tree owner of the concerned member may accept or refuse a request sent to them. */
export class RespondToContactRequestUseCase {
  constructor(private readonly deps: RespondToContactRequestDeps) {}

  async execute(
    input: RespondToContactRequestInput,
  ): Promise<Result<void, RespondToContactRequestError>> {
    const contactRequest = await this.deps.contactRequests.findById(input.contactRequestId)
    if (!contactRequest) return err({ kind: 'CONTACT_REQUEST_NOT_FOUND' })

    const listing = await this.deps.trees.findById(TreeId.fromString(contactRequest.treeId))
    if (!listing || listing.tree.ownerId.value !== input.viewerId) {
      return err({ kind: 'NOT_TREE_OWNER' })
    }

    const now = this.deps.clock.now()
    const resolved = contactRequest.respond(input.decision, now)
    if (!resolved.ok) return resolved

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.contactRequests.resolve(resolved.value)
      await context.notifications.record({
        id: this.deps.ids.next(),
        userId: contactRequest.requesterId,
        type: 'CONTACT_REQUEST_RESPONDED',
        contactRequestId: contactRequest.id,
        createdAt: now,
      })
    })
    return ok(undefined)
  }
}
