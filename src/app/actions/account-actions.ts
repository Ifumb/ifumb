'use server'
import 'server-only'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  CHANGE_PASSWORD_ERRORS,
  PASSWORD_CHANGED_MESSAGE,
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
import { changePasswordSchema } from '@/presentation/schemas/change-password-schema'

export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()

  const parsed = changePasswordSchema.safeParse({
    currentPassword: textEntry(formData, 'currentPassword'),
    newPassword: textEntry(formData, 'newPassword'),
    confirmPassword: textEntry(formData, 'confirmPassword'),
  })
  if (!parsed.success) return validationFailed(parsed.error)

  const allowed = await container.allowsAttempt([
    { policy: 'passwordChangeByUser', subject: currentUser.id },
  ])
  if (!allowed) return failed(TOO_MANY_ATTEMPTS_MESSAGE)

  const result = await container.changePassword().execute({
    userId: currentUser.id,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  })
  if (!result.ok) return failedAt(CHANGE_PASSWORD_ERRORS[result.error.kind])

  return succeeded(PASSWORD_CHANGED_MESSAGE)
}
