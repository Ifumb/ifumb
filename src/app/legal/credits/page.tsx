import type { Metadata } from 'next'
import { CreditsView } from '@/presentation/views/legal/credits-view'

export const metadata: Metadata = {
  title: 'Crédits et licences tierces',
  description: 'Les composants open source utilisés par IFUMB et leurs licences.',
}

export default function CreditsPage() {
  return <CreditsView />
}
