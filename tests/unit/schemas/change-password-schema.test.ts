import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { changePasswordSchema } from '@/presentation/schemas/change-password-schema'

const valid = {
  currentPassword: 'old-password',
  newPassword: 'brand-new-pass',
  confirmPassword: 'brand-new-pass',
}

function fieldErrorsOf(input: unknown) {
  const parsed = changePasswordSchema.safeParse(input)
  return parsed.success ? {} : z.flattenError(parsed.error).fieldErrors
}

describe('changePasswordSchema', () => {
  it('accepts a current password and a confirmed new one', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('requires the current password', () => {
    const errors = fieldErrorsOf({ ...valid, currentPassword: '' })

    expect(errors.currentPassword).toEqual(['Mot de passe actuel requis'])
  })

  it('reports a mismatch on the confirmation field', () => {
    const errors = fieldErrorsOf({ ...valid, confirmPassword: 'something-else' })

    expect(errors.confirmPassword).toEqual(['Les mots de passe ne correspondent pas'])
  })
})
