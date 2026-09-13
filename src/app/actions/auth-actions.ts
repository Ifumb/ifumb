'use server'
import 'server-only'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/infrastructure/auth/auth'
import { container } from '@/infrastructure/di/container'
import {
  INVALID_CREDENTIALS_MESSAGE,
  REGISTER_ERRORS,
} from '@/presentation/errors/auth-error-messages'
import {
  failed,
  failedAt,
  textEntry,
  validationFailed,
  type FormState,
} from '@/presentation/forms/form-state'
import { loginSchema } from '@/presentation/schemas/login-schema'
import { registerSchema } from '@/presentation/schemas/register-schema'

const HOME_AFTER_SIGN_IN = '/dashboard'

export async function registerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = {
    firstName: textEntry(formData, 'firstName'),
    lastName: textEntry(formData, 'lastName'),
    email: textEntry(formData, 'email'),
  }
  const parsed = registerSchema.safeParse({ ...values, password: textEntry(formData, 'password') })
  if (!parsed.success) return validationFailed(parsed.error, values)

  const result = await container.registerUser().execute({
    email: parsed.data.email,
    password: parsed.data.password,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
  })
  if (!result.ok) return failedAt(REGISTER_ERRORS[result.error.kind], values)

  await signInWithPassword(parsed.data.email, parsed.data.password)
  redirect(HOME_AFTER_SIGN_IN)
}

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = { email: textEntry(formData, 'email') }
  const parsed = loginSchema.safeParse({ ...values, password: textEntry(formData, 'password') })
  if (!parsed.success) return validationFailed(parsed.error, values)

  try {
    await signInWithPassword(parsed.data.email, parsed.data.password)
  } catch (error) {
    if (error instanceof AuthError) return failed(INVALID_CREDENTIALS_MESSAGE, values)
    throw error
  }
  redirect(HOME_AFTER_SIGN_IN)
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' })
}

async function signInWithPassword(email: string, password: string): Promise<void> {
  await signIn('credentials', { email, password, redirect: false })
}
