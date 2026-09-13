import { z } from 'zod'
import {
  PASSWORD_CONFIRMATION_ERROR,
  isPasswordConfirmed,
  newPasswordField,
} from '@/presentation/schemas/auth-fields'

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: newPasswordField,
    confirmPassword: z.string(),
  })
  .refine(isPasswordConfirmed, PASSWORD_CONFIRMATION_ERROR)

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>
