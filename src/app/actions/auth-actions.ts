'use server'
import 'server-only'
import type { Route } from 'next'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { signIn, signOut, TooManySignInAttempts } from '@/infrastructure/auth/auth'
import { container } from '@/infrastructure/di/container'
import { currentClientIp } from '@/infrastructure/http/client-ip'
import {
  INVALID_CREDENTIALS_MESSAGE,
  REGISTER_ERRORS,
  TOO_MANY_ATTEMPTS_MESSAGE,
} from '@/presentation/errors/auth-error-messages'
import {
  failed,
  failedAt,
  textEntry,
  validationFailed,
  type FormState,
} from '@/presentation/forms/form-state'
import { safeRedirectTarget } from '@/presentation/security/safe-redirect'
import { loginSchema } from '@/presentation/schemas/login-schema'
import { registerSchema } from '@/presentation/schemas/register-schema'

const HOME_AFTER_SIGN_IN = '/dashboard'

export async function registerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = registrationValues(formData)
  const parsed = registerSchema.safeParse({ ...values, password: textEntry(formData, 'password') })
  if (!parsed.success) return validationFailed(parsed.error, values)
  if (!(await isRegistrationAllowed())) return failed(TOO_MANY_ATTEMPTS_MESSAGE, values)

  const result = await container.registerUser().execute({
    email: parsed.data.email,
    password: parsed.data.password,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
  })
  if (!result.ok) return failedAt(REGISTER_ERRORS[result.error.kind], values)

  await signInAfterRegistration(parsed.data.email, parsed.data.password)
  redirect(destinationAfterSignIn(formData))
}

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = { email: textEntry(formData, 'email') }
  const parsed = loginSchema.safeParse({ ...values, password: textEntry(formData, 'password') })
  if (!parsed.success) return validationFailed(parsed.error, values)

  try {
    await signInWithPassword(parsed.data.email, parsed.data.password)
  } catch (error) {
    if (error instanceof TooManySignInAttempts) return failed(TOO_MANY_ATTEMPTS_MESSAGE, values)
    if (error instanceof AuthError) return failed(INVALID_CREDENTIALS_MESSAGE, values)
    throw error
  }
  redirect(destinationAfterSignIn(formData))
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' })
}

/** The non-secret registration fields, echoed back to the form when submission fails. */
function registrationValues(formData: FormData) {
  return {
    firstName: textEntry(formData, 'firstName'),
    lastName: textEntry(formData, 'lastName'),
    email: textEntry(formData, 'email'),
  }
}

/**
 * Where a redirect from an invitation link sends the visitor back to, once signed in.
 * reason: this path comes from a query parameter, not from the app's own static routes, so it can
 * never be checked against the typed-routes registry the way a literal `href` is — `Route` here is
 * an intentional escape hatch, not a bypass of `safeRedirectTarget`'s own runtime validation.
 */
function destinationAfterSignIn(formData: FormData): Route {
  return (safeRedirectTarget(textEntry(formData, 'redirect')) ?? HOME_AFTER_SIGN_IN) as Route
}

async function isRegistrationAllowed(): Promise<boolean> {
  return container.allowsAttempt([{ policy: 'registerByIp', subject: await currentClientIp() }])
}

async function signInWithPassword(email: string, password: string): Promise<void> {
  await signIn('credentials', { email, password, redirect: false })
}

/** The account exists at this point: if signing in is refused, the user can still log in later. */
async function signInAfterRegistration(email: string, password: string): Promise<void> {
  try {
    await signInWithPassword(email, password)
  } catch (error) {
    if (error instanceof AuthError) redirect('/login')
    throw error
  }
}
