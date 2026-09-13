'use server'
import 'server-only'
import { redirect } from 'next/navigation'
import { container } from '@/infrastructure/di/container'
import {
  PASSWORD_RESET_REQUESTED_MESSAGE,
  RESET_PASSWORD_ERRORS,
} from '@/presentation/errors/auth-error-messages'
import {
  failedAt,
  succeeded,
  textEntry,
  validationFailed,
  type FormState,
} from '@/presentation/forms/form-state'
import { forgotPasswordSchema } from '@/presentation/schemas/forgot-password-schema'
import { resetPasswordSchema } from '@/presentation/schemas/reset-password-schema'

export async function requestPasswordResetAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: textEntry(formData, 'email') }
  const parsed = forgotPasswordSchema.safeParse(values)
  if (!parsed.success) return validationFailed(parsed.error, values)

  await container.requestPasswordReset().execute({ email: parsed.data.email })
  return succeeded(PASSWORD_RESET_REQUESTED_MESSAGE)
}

export async function resetPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: textEntry(formData, 'token'),
    newPassword: textEntry(formData, 'newPassword'),
    confirmPassword: textEntry(formData, 'confirmPassword'),
  })
  if (!parsed.success) return validationFailed(parsed.error)

  const result = await container.resetPassword().execute({
    token: parsed.data.token,
    newPassword: parsed.data.newPassword,
  })
  if (!result.ok) return failedAt(RESET_PASSWORD_ERRORS[result.error.kind])

  redirect('/login?reset=success')
}
