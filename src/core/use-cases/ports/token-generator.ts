import 'server-only'

/** Issues unguessable single-use tokens (e.g. password reset links). */
export interface TokenGenerator {
  generate(): string
}
