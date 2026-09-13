import { z } from 'zod'
import { emailField, newPasswordField, requiredText } from '@/presentation/schemas/auth-fields'

export const registerSchema = z.object({
  firstName: requiredText('Prénom requis'),
  lastName: requiredText('Nom requis'),
  email: emailField,
  password: newPasswordField,
})

export type RegisterSchema = z.infer<typeof registerSchema>
