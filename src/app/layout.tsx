import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@/app/globals.css'
import { appBaseUrl } from '@/infrastructure/config/app-url'
import { SiteHeader } from '@/presentation/views/site-header'

export const metadata: Metadata = {
  metadataBase: appBaseUrl(),
  title: {
    default: 'IFUMB — Réseau généalogique culturel',
    template: '%s · IFUMB',
  },
  description: 'Construisez et partagez votre arbre généalogique familial et culturel.',
}

type RootLayoutProps = Readonly<{ children: ReactNode; overlay: ReactNode }>

export default function RootLayout({ children, overlay }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>
        <a href="#main" className="skip-link">
          Aller au contenu
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="page-shell">
          {children}
        </main>
        {overlay}
      </body>
    </html>
  )
}
