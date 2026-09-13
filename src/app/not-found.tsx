import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Page introuvable' }

export default function NotFound() {
  return (
    <section aria-labelledby="not-found-title" className="space-y-4">
      <h1 id="not-found-title" className="text-3xl font-bold">
        Page introuvable
      </h1>
      <p>La page que vous cherchez n’existe pas ou a été déplacée.</p>
      <Link href="/">Revenir à l’accueil</Link>
    </section>
  )
}
