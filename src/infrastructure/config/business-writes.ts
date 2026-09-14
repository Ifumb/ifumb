import 'server-only'

/** Raised when the application tries to store business data while writes are not enabled. */
export class BusinessWritesDisabledError extends Error {
  constructor() {
    super(
      'Business writes are disabled: set BUSINESS_WRITES_ENABLED=true only when DATABASE_URL points ' +
        'at a staging or test database (ADR 0005).',
    )
    this.name = 'BusinessWritesDisabledError'
  }
}

/**
 * Whether trees, members and unions may be written.
 * reason: during the migration `.env.local` points at the production database shared with the
 * legacy app. Writes stay off until an environment opts in explicitly, so that a local trial can
 * never alter production data (ADR 0005).
 */
export function businessWritesEnabled(): boolean {
  return process.env.BUSINESS_WRITES_ENABLED === 'true'
}
