import { err, ok, type Result } from '@/core/shared/result'

export type InvalidEmail = { readonly kind: 'INVALID_EMAIL' }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class Email {
  private constructor(readonly value: string) {
    Object.freeze(this)
  }

  /**
   * Validates the address shape and trims it.
   * Letter case is kept as typed: legacy accounts are looked up by exact match.
   */
  static parse(raw: string): Result<Email, InvalidEmail> {
    const trimmed = raw.trim()
    if (!EMAIL_PATTERN.test(trimmed)) {
      return err({ kind: 'INVALID_EMAIL' })
    }
    return ok(new Email(trimmed))
  }
}
