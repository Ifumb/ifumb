import 'server-only'
import type { ContactRequest } from '@/core/entities/contact-request'

/**
 * Write side of contact requests.
 * reason: `(requesterId, memberId)` is unique in the database (one row ever, of any status) —
 * `send` is always an upsert on that pair (module 2.8's lesson), never a blind insert, so a
 * refused or withdrawn request can be tried again instead of being blocked forever.
 */
export interface ContactRequestWriter {
  send(contactRequest: ContactRequest): Promise<void>
  /** Stores a request's resolution: accepted, refused, or withdrawn. */
  resolve(contactRequest: ContactRequest): Promise<void>
}
