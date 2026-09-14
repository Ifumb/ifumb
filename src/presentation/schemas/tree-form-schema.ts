import { z } from 'zod'
import { TREE_DESCRIPTION_MAX_LENGTH, TREE_NAME_MAX_LENGTH } from '@/core/entities/tree'

export const TREE_VISIBILITIES = ['PRIVATE', 'SHARED', 'PUBLIC'] as const

/** The tree form, as submitted; limits are the entity's own. */
export const treeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom de l’arbre est requis')
    .max(TREE_NAME_MAX_LENGTH, `Le nom ne peut pas dépasser ${TREE_NAME_MAX_LENGTH} caractères`),
  description: z
    .string()
    .trim()
    .max(
      TREE_DESCRIPTION_MAX_LENGTH,
      `La description ne peut pas dépasser ${TREE_DESCRIPTION_MAX_LENGTH} caractères`,
    ),
  visibility: z.enum(TREE_VISIBILITIES, { error: 'Choisissez une visibilité' }),
})

export type TreeFormData = z.infer<typeof treeFormSchema>
