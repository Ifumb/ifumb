type StatusMessageProps = Readonly<{ message?: string }>

/**
 * Polite live region for a successful outcome. The region itself stays mounted and visible
 * even when empty, because screen readers only announce changes to a region already present.
 */
export function StatusMessage({ message }: StatusMessageProps) {
  return (
    <div role="status">
      {message && (
        <p className="flex items-start gap-2 rounded-md border-2 border-forest bg-white p-4 font-medium text-forest">
          <span aria-hidden="true">✓</span>
          {message}
        </p>
      )}
    </div>
  )
}
