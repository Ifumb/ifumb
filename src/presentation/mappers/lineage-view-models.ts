/** "Pivot" for the pivot itself, "+2" below it, "−1" above it; null outside a lineage view. */
export function relativeGenerationLabel(relative: number | null, isPivot: boolean): string | null {
  if (isPivot) return 'Pivot'
  return relative === null ? null : signed(relative)
}

export function signed(value: number): string {
  if (value > 0) return `+${value}`
  return value < 0 ? `−${-value}` : '0'
}
