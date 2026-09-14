const collator = new Intl.Collator('fr', { sensitivity: 'base' })

/** The values of a cultural field, which the legacy app records as one comma-separated text. */
export function culturalTokens(raw: string | null): string[] {
  if (raw === null) return []
  return raw
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token !== '')
}

/** Every distinct value found in several cultural fields, in French order. */
export function distinctCulturalTokens(raws: readonly (string | null)[]): string[] {
  return [...new Set(raws.flatMap(culturalTokens))].sort(collator.compare)
}
