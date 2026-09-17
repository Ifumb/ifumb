import type { SuggestionConfidence } from '@/core/entities/member-matching'

/** Confidence is announced in text, never a color alone (module 3.2 §9). */
export const SUGGESTION_CONFIDENCE_LABELS: Readonly<Record<SuggestionConfidence, string>> = {
  HIGH: 'Confiance élevée',
  MEDIUM: 'Confiance moyenne',
  LOW: 'Confiance faible',
}
