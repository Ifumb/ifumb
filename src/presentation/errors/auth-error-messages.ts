import type { ChangePasswordError } from '@/core/use-cases/change-password'
import type { RegisterUserError } from '@/core/use-cases/register-user'
import type { ResetPasswordError } from '@/core/use-cases/reset-password'

/** Where an error is shown: on a field, or in the form-level message when `field` is absent. */
export type ErrorPlacement = { readonly field?: string; readonly message: string }

export const INVALID_CREDENTIALS_MESSAGE = 'Email ou mot de passe incorrect'

export const TOO_MANY_ATTEMPTS_MESSAGE =
  'Trop de tentatives en peu de temps. Patientez quelques minutes avant de réessayer.'

export const PASSWORD_RESET_REQUESTED_MESSAGE =
  'Si un compte correspond à cet email, un lien de réinitialisation vient de lui être envoyé.'

export const PASSWORD_CHANGED_MESSAGE = 'Votre mot de passe a été modifié.'

export const REGISTER_ERRORS: Readonly<Record<RegisterUserError['kind'], ErrorPlacement>> = {
  EMAIL_ALREADY_USED: { field: 'email', message: 'Un compte existe déjà avec cet email' },
  INVALID_EMAIL: { field: 'email', message: 'Email invalide' },
  INVALID_NAME: { message: 'Le prénom et le nom sont requis' },
}

export const CHANGE_PASSWORD_ERRORS: Readonly<Record<ChangePasswordError['kind'], ErrorPlacement>> =
  {
    USER_NOT_FOUND: { message: 'Votre session a expiré. Reconnectez-vous puis réessayez.' },
    WRONG_CURRENT_PASSWORD: { field: 'currentPassword', message: 'Mot de passe actuel incorrect' },
  }

export const RESET_PASSWORD_ERRORS: Readonly<Record<ResetPasswordError['kind'], ErrorPlacement>> = {
  INVALID_RESET_TOKEN: {
    message: 'Ce lien est invalide ou a expiré. Recommencez depuis « Mot de passe oublié ».',
  },
}
