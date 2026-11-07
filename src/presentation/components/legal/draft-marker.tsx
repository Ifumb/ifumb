import type { ReactNode } from 'react'

type DraftMarkerProps = Readonly<{ kind: 'a-completer' | 'choix'; children: ReactNode }>

/** Flags a placeholder inline, inside legal drafts, so it stays impossible to miss before publishing. */
export function DraftMarker({ kind, children }: DraftMarkerProps) {
  const label = kind === 'a-completer' ? 'À COMPLÉTER' : 'CHOIX À TRANCHER'
  return (
    <mark className="rounded bg-amber-100 px-1 py-0.5 font-semibold text-amber-900">
      {label} : {children}
    </mark>
  )
}

/** Sits atop every legal draft page so it is never mistaken for a finished, published document. */
export function DraftBanner() {
  return (
    <div role="note" className="mb-8 rounded-md border-2 border-brand-dark bg-white p-4 text-sm">
      <strong>Brouillon à faire valider par un juriste.</strong> Ce document n’est pas prêt à être
      publié : il contient des informations à compléter (surlignées) et des choix encore ouverts.
      Ne pas s’y fier comme à un engagement définitif.
    </div>
  )
}
