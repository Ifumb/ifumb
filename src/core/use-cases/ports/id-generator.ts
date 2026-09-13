import 'server-only'

/** Issues identifiers for new aggregates, so ids are known before persistence. */
export interface IdGenerator {
  next(): string
}
