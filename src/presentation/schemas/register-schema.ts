import { z } from 'zod'
import {
  emailField,
  newPasswordField,
  requiredCheckbox,
  requiredText,
} from '@/presentation/schemas/auth-fields'

export const registerSchema = z.object({
  firstName: requiredText('Prénom requis'),
  lastName: requiredText('Nom requis'),
  email: emailField,
  password: newPasswordField,
  ageConfirmed: requiredCheckbox('Confirmez que vous avez 16 ans ou plus'),
  termsAccepted: requiredCheckbox(
    "Acceptez les conditions d'utilisation et la politique de confidentialité",
  ),
})

export type RegisterSchema = z.infer<typeof registerSchema>
