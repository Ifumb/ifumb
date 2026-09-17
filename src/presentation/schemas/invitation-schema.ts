import { z } from 'zod'
import { emailField } from '@/presentation/schemas/auth-fields'

export const INVITE_ROLES = ['EDITOR', 'VIEWER'] as const

export const INVITE_ENTRIES = ['email', 'role'] as const

export const inviteSchema = z.object({
  email: emailField,
  role: z.enum(INVITE_ROLES, { error: 'Choisissez un rôle' }),
})

export const CHANGE_ROLE_ENTRIES = ['role'] as const

export const changeRoleSchema = z.object({
  role: z.enum(INVITE_ROLES, { error: 'Choisissez un rôle' }),
})
