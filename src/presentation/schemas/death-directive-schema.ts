import { z } from 'zod'
import { DEATH_DIRECTIVE_MAX_LENGTH } from '@/core/entities/user'

export const deathDirectiveSchema = z.object({
  directive: z
    .string()
    .max(DEATH_DIRECTIVE_MAX_LENGTH, `Maximum ${DEATH_DIRECTIVE_MAX_LENGTH} caractères`),
})

export type DeathDirectiveSchema = z.infer<typeof deathDirectiveSchema>
