'use server'
import 'server-only'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import {
  DEATH_DIRECTIVE_ERRORS,
  DEATH_DIRECTIVE_SAVED_MESSAGE,
} from '@/presentation/errors/death-directive-messages'
import { failed, succeeded, textEntry, validationFailed, type FormState } from '@/presentation/forms/form-state'
import { deathDirectiveSchema } from '@/presentation/schemas/death-directive-schema'

export async function updateDeathDirectiveAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireCurrentUser()

  const parsed = deathDirectiveSchema.safeParse({ directive: textEntry(formData, 'directive') })
  if (!parsed.success) return validationFailed(parsed.error)

  const result = await container.updateDeathDirective().execute({
    userId: currentUser.id,
    directive: parsed.data.directive,
  })
  if (!result.ok) return failed(DEATH_DIRECTIVE_ERRORS[result.error.kind])

  return succeeded(DEATH_DIRECTIVE_SAVED_MESSAGE)
}
