import 'server-only'
import type { ContactRequestAlreadyResolved } from '@/core/entities/contact-request'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { ContactRequestReader } from '@/core/use-cases/ports/contact-request-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'

export type WithdrawContactRequestInput = {
  readonly contactRequestId: string
  readonly viewerId: string
}

export type WithdrawContactRequestError =
  | { readonly kind: 'CONTACT_REQUEST_NOT_FOUND' }
  | { readonly kind: 'NOT_REQUESTER' }
  | ContactRequestAlreadyResolved

type WithdrawContactRequestDeps = {
  readonly contactRequests: ContactRequestReader
  readonly unitOfWork: UnitOfWork
  readonly clock: Clock
}

/** The requester pulls back their own request; silent, like the legacy app (no notification). */
export class WithdrawContactRequestUseCase {
  constructor(private readonly deps: WithdrawContactRequestDeps) {}

  async execute(
    input: WithdrawContactRequestInput,
  ): Promise<Result<void, WithdrawContactRequestError>> {
    const contactRequest = await this.deps.contactRequests.findById(input.contactRequestId)
    if (!contactRequest) return err({ kind: 'CONTACT_REQUEST_NOT_FOUND' })
    if (contactRequest.requesterId !== input.viewerId) return err({ kind: 'NOT_REQUESTER' })

    const withdrawn = contactRequest.withdraw(this.deps.clock.now())
    if (!withdrawn.ok) return withdrawn

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.contactRequests.resolve(withdrawn.value)
    })
    return ok(undefined)
  }
}
