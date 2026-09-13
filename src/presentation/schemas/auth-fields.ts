import { z } from 'zod'

/** Limits carried over from the legacy API DTOs (class-validator). */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 100
export const NAME_MAX_LENGTH = 100

const PASSWORDS_DO_NOT_MATCH = 'Les mots de passe ne correspondent pas'

// reason: unlike the skill template, no `.toLowerCase()`: the legacy app stores and looks up
// emails exactly as typed, so lowercasing would lock out existing mixed-case accounts.
export const emailField = z.string().trim().pipe(z.email('Email invalide'))

export const newPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Minimum ${PASSWORD_MIN_LENGTH} caractères`)
  .max(PASSWORD_MAX_LENGTH, `Maximum ${PASSWORD_MAX_LENGTH} caractères`)

export function requiredText(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .max(NAME_MAX_LENGTH, `Maximum ${NAME_MAX_LENGTH} caractères`)
}

type PasswordConfirmation = { newPassword: string; confirmPassword: string }

export function isPasswordConfirmed(data: PasswordConfirmation): boolean {
  return data.newPassword === data.confirmPassword
}

/** Reports a failed confirmation on the confirmation field itself. */
export const PASSWORD_CONFIRMATION_ERROR = {
  path: ['confirmPassword'],
  error: PASSWORDS_DO_NOT_MATCH,
}
