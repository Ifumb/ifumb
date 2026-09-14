import Link from 'next/link'

/** Shown instead of search results once the visitor has searched too often in a short while. */
export function RateLimitedView() {
  return (
    <section aria-labelledby="rate-limited-title" className="max-w-prose space-y-4">
      <h2 id="rate-limited-title" className="text-2xl font-bold">
        Trop de recherches
      </h2>
      <p role="alert">
        Vous avez lancé beaucoup de recherches en peu de temps. Réessayez dans une minute.
      </p>
      <p>
        <Link href="/">Revenir à l’accueil</Link>
      </p>
    </section>
  )
}
