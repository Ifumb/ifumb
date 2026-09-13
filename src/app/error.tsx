'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>

export default function ErrorPage({ reset }: ErrorPageProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="error-title" className="space-y-4">
      <h1 id="error-title" ref={titleRef} tabIndex={-1} className="text-3xl font-bold">
        Une erreur est survenue
      </h1>
      <p>Nous n’avons pas pu afficher cette page. Vous pouvez réessayer.</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-brand-dark px-4 py-2 font-semibold text-earth-ivory"
        >
          Réessayer
        </button>
        <Link href="/">Revenir à l’accueil</Link>
      </div>
    </section>
  )
}
