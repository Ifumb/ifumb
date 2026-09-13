/** Violation of a domain invariant: a programming or data error, not an expected outcome. */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly context: Readonly<Record<string, unknown>> = {},
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
