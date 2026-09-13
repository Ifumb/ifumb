import 'server-only'
import { randomUUID } from 'node:crypto'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'

/**
 * UUID v4 identifiers. Existing rows keep their legacy cuid ids: both are opaque strings,
 * and nothing in the legacy app validates the id format.
 */
export class UuidIdGenerator implements IdGenerator {
  next(): string {
    return randomUUID()
  }
}
