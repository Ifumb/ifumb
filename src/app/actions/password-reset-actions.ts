'use server'
import 'server-only'
import { redirect } from 'next/navigation'
import { container } from '@/infrastructure/di/container'
import { currentClientIp } from '@/infrastructure/http/client-ip'
import { accountKey } from '@/infrastructure/rate-limiting/account-key'
import {
  PASSWORD_RESET_REQUESTED_MESSAGE,
  RESET_PASSWORD_ERRORS,
  TOO_MANY_ATTEMPTS_MESSAGE,
} from '@/presentation/errors/auth-error-messages'
import {
  failed,
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

  // The email budget applies to any typed address, registered or not, so it reveals nothing.
  const allowed = await container.allowsAttempt([
    { policy: 'passwordResetRequestByIp', subject: await currentClientIp() },
    { policy: 'passwordResetRequestByEmail', subject: accountKey(parsed.data.email) },
  ])
  if (!allowed) return failed(TOO_MANY_ATTEMPTS_MESSAGE, values)

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

  const ip = await currentClientIp()
  if (!(await container.allowsAttempt([{ policy: 'passwordResetByIp', subject: ip }]))) {
    return failed(TOO_MANY_ATTEMPTS_MESSAGE)
  }

  const result = await container.resetPassword().execute({
    token: parsed.data.token,
    newPassword: parsed.data.newPassword,
  })
  if (!result.ok) return failedAt(RESET_PASSWORD_ERRORS[result.error.kind])

  redirect('/login?reset=success')
}
