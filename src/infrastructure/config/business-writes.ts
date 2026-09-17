import 'server-only'

/** Raised when the application tries to store business data while writes are not enabled. */
export class BusinessWritesDisabledError extends Error {
  constructor() {
    super(
      'Business writes are disabled: set BUSINESS_WRITES_ENABLED=true on a staging or test ' +
        'database during the migration (ADR 0005), or on the real production deployment once the ' +
        'cutover runbook has confirmed it healthy (ADR 0009).',
    )
    this.name = 'BusinessWritesDisabledError'
  }
}

/**
 * Whether trees, members and unions may be written.
 * reason: during the migration `.env.local` points at the production database shared with the
 * legacy app, and writes stay off by default so a local trial can never alter production data
 * (ADR 0005). At cutover this same switch is what turns production writes on, deliberately and
 * only once the first read-only deployment has been verified healthy (ADR 0009) — never a side
 * effect of the deployment itself.
 */
export function businessWritesEnabled(): boolean {
  return process.env.BUSINESS_WRITES_ENABLED === 'true'
}
