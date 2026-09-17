import 'server-only'
import type {
  ContactRequestReader,
  ReceivedContactRequestView,
  SentContactRequestView,
} from '@/core/use-cases/ports/contact-request-reader'

export type ContactRequestsList = {
  readonly received: readonly ReceivedContactRequestView[]
  readonly sent: readonly SentContactRequestView[]
}

type ListContactRequestsDeps = { readonly contactRequests: ContactRequestReader }

/** Both inboxes of one signed-in visitor: what others sent them, and what they sent others. */
export class ListContactRequestsUseCase {
  constructor(private readonly deps: ListContactRequestsDeps) {}

  async execute(viewerId: string): Promise<ContactRequestsList> {
    const [received, sent] = await Promise.all([
      this.deps.contactRequests.listReceivedBy(viewerId),
      this.deps.contactRequests.listSentBy(viewerId),
    ])
    return { received, sent }
  }
}
