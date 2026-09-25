'use client'

import { useState } from 'react'
import { Icon } from '@/presentation/components/ui/icon'

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function CopyTreeLink({ href }: Readonly<{ href: string }>) {
  const [status, setStatus] = useState('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).href)
      setStatus('Lien copié.')
    } catch {
      setStatus('Copie indisponible. Copiez l’adresse de cette page.')
    }
  }
  return (
    <div className="relative">
      <button
        type="button"
        className="tree-header-action"
        onClick={copy}
        aria-label="Copier le lien public"
      >
        <Icon name="copy" />
        <span>Copier le lien</span>
      </button>
      <span
        role="status"
        className={
          status
            ? 'absolute right-0 top-full z-30 w-56 rounded bg-white p-2 text-xs shadow'
            : 'sr-only'
        }
      >
        {status}
      </span>
    </div>
  )
}
