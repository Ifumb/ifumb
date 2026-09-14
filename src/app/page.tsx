import type { Metadata } from 'next'
import { LinkList } from '@/presentation/views/link-list'

const ENTRY_LINKS = [
  { href: '/register', label: 'Créer un compte' },
  { href: '/login', label: 'Se connecter' },
  { href: '/explore', label: 'Explorer les arbres publics' },
] as const

export const metadata: Metadata = {
  description: 'Reliez votre famille par les unions et préservez tribus, clans et ethnies.',
}

export default function HomePage() {
  return (
    <section aria-labelledby="home-title" className="space-y-6">
      <h1 id="home-title" className="text-4xl font-bold text-brand-dark">
        IFUMB
      </h1>
      <p className="max-w-prose text-lg">
        Le réseau généalogique culturel : reliez les membres de votre famille à travers les unions,
        et préservez les liens de tribu, de clan et d’ethnie.
      </p>
      <LinkList links={ENTRY_LINKS} />
    </section>
  )
}
