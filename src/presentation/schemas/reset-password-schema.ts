import { z } from 'zod'
import {
  PASSWORD_CONFIRMATION_ERROR,
  isPasswordConfirmed,
  newPasswordField,
} from '@/presentation/schemas/auth-fields'

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Lien invalide.'),
    newPassword: newPasswordField,
    confirmPassword: z.string(),
  })
  .refine(isPasswordConfirmed, PASSWORD_CONFIRMATION_ERROR)

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
