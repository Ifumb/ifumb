import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  description: 'Reliez votre famille par les unions et préservez tribus, clans et ethnies.',
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export default function HomePage() {
  return (
    <section
      aria-labelledby="home-title"
      className="landing flex min-h-dvh flex-col items-center justify-center p-6 text-center"
    >
      <h1 id="home-title" className="mb-3 text-5xl font-bold text-brand">
        IFUMB
      </h1>
      <p className="mb-2 text-xl text-earth-bark">
        Votre réseau généalogique, sans frontières culturelles
      </p>
      <p className="mb-8 max-w-lg text-gray-500">
        Construisez, consultez et enrichissez votre réseau généalogique — unions multiples, identité
        culturelle, collaboration familiale.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/register" className="primary-action !px-6 !py-3 !text-base">
          Commencer gratuitement
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-brand px-6 py-3 font-medium text-brand hover:bg-brand/5"
        >
          Se connecter
        </Link>
      </div>
      <Link href="/explore" className="mt-6 text-sm text-gray-600 hover:text-brand">
        Explorer les arbres publics
      </Link>
    </section>
  )
}
