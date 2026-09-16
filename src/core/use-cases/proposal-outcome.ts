/** What a write use case did: applied the change, or proposed it for the owner to review. */
export type WriteOutcome<T> = ({ readonly outcome: 'applied' } & T) | ProposedOutcome

export type ProposedOutcome = { readonly outcome: 'proposed'; readonly pendingChangeId: string }

export function applied<T>(value: T): { readonly outcome: 'applied' } & T {
  return { outcome: 'applied', ...value }
}

export function proposed(pendingChangeId: string): ProposedOutcome {
  return { outcome: 'proposed', pendingChangeId }
}
