import 'server-only'
import { ContactRequest } from '@/core/entities/contact-request'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { ContactRequestReader } from '@/core/use-cases/ports/contact-request-reader'
import type { DiscoverableMemberDirectory } from '@/core/use-cases/ports/discoverable-member-directory'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'

export type SendContactRequestInput = {
  readonly requesterId: string
  readonly memberId: string
  readonly message: string | null
}

export type SendContactRequestError =
  | { readonly kind: 'MEMBER_NOT_FOUND' }
  | { readonly kind: 'MEMBER_NOT_DISCOVERABLE' }
  | { readonly kind: 'CANNOT_CONTACT_OWN_MEMBER' }
  | { readonly kind: 'CONTACT_REQUEST_ALREADY_ACTIVE' }

type SendContactRequestDeps = {
  readonly directory: DiscoverableMemberDirectory
  readonly contactRequests: ContactRequestReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/**
 * A stranger asks a discoverable member's tree owner to be put in touch. `directory.
 * findDiscoverable` looks the member up without any tree-access check — the requester found them
 * through global search, not by being a collaborator of their tree.
 */
export class SendContactRequestUseCase {
  constructor(private readonly deps: SendContactRequestDeps) {}

  async execute(input: SendContactRequestInput): Promise<Result<void, SendContactRequestError>> {
    const found = await this.deps.directory.findDiscoverable(input.memberId)
    if (!found) return err({ kind: 'MEMBER_NOT_FOUND' })
    if (!found.discoverable) return err({ kind: 'MEMBER_NOT_DISCOVERABLE' })
    if (found.ownerId === input.requesterId) return err({ kind: 'CANNOT_CONTACT_OWN_MEMBER' })

    const existing = await this.deps.contactRequests.findByRequesterAndMember(
      input.requesterId,
      input.memberId,
    )
    if (existing?.isActive) return err({ kind: 'CONTACT_REQUEST_ALREADY_ACTIVE' })

    const now = this.deps.clock.now()
    const contactRequest = ContactRequest.send({
      id: existing?.id ?? this.deps.ids.next(),
      treeId: found.treeId,
      memberId: input.memberId,
      requesterId: input.requesterId,
      message: input.message,
      now,
    })
    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.contactRequests.send(contactRequest)
      await context.notifications.record({
        id: this.deps.ids.next(),
        userId: found.ownerId,
        type: 'CONTACT_REQUEST_RECEIVED',
        contactRequestId: contactRequest.id,
        createdAt: now,
      })
    })
    return ok(undefined)
  }
}
