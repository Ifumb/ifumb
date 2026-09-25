import { z } from 'zod'

const count = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().nonnegative().safe())
const summarySchema = z.object({
  review: z.literal('bulk'),
  approved: count,
  rejected: count,
  skipped: count,
})

// reason: la confirmation survit au remplacement de la liste, sans accepter de texte arbitraire dans l’URL.
export function bulkReviewMessage(
  query: Record<string, string | string[] | undefined>,
): string | null {
  const parsed = summarySchema.safeParse(query)
  if (!parsed.success) return null
  const { approved, rejected, skipped } = parsed.data
  const parts = [
    approved > 0 ? `${approved} approuvée(s)` : null,
    rejected > 0 ? `${rejected} rejetée(s)` : null,
    skipped > 0 ? `${skipped} ignorée(s) (dépassée(s) ou déjà traitée(s))` : null,
  ].filter(Boolean)
  return parts.length ? `${parts.join(', ')}.` : 'Aucune proposition à traiter.'
}
