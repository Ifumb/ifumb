import { z } from 'zod'
import { emailField } from '@/presentation/schemas/auth-fields'

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Mot de passe requis'),
})

export type LoginSchema = z.infer<typeof loginSchema>
