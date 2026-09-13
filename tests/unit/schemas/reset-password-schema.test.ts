import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { resetPasswordSchema } from '@/presentation/schemas/reset-password-schema'

const valid = { token: 'token-1', newPassword: 'brand-new-pass', confirmPassword: 'brand-new-pass' }

function fieldErrorsOf(input: unknown) {
  const parsed = resetPasswordSchema.safeParse(input)
  return parsed.success ? {} : z.flattenError(parsed.error).fieldErrors
}

describe('resetPasswordSchema', () => {
  it('accepts a new password confirmed identically', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('reports a mismatch on the confirmation field', () => {
    const errors = fieldErrorsOf({ ...valid, confirmPassword: 'something-else' })

    expect(errors.confirmPassword).toEqual(['Les mots de passe ne correspondent pas'])
  })

  it('rejects a new password shorter than 8 characters', () => {
    const errors = fieldErrorsOf({ ...valid, newPassword: 'short', confirmPassword: 'short' })

    expect(errors.newPassword).toEqual(['Minimum 8 caractères'])
  })
})
