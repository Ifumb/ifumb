import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'IFUMB — Réseau généalogique culturel',
    template: '%s · IFUMB',
  },
  description: 'Construisez et partagez votre arbre généalogique familial et culturel.',
}

type RootLayoutProps = Readonly<{ children: ReactNode }>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>
        <a href="#main" className="skip-link">
          Aller au contenu
        </a>
        <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  )
}
