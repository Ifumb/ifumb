import { z } from 'zod'
import { emailField } from '@/presentation/schemas/auth-fields'

export const forgotPasswordSchema = z.object({
  email: emailField,
})

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
