import type { Metadata } from 'next'
import { LegalNoticeView } from '@/presentation/views/legal/legal-notice-view'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: "Identité de l'éditeur, hébergement et informations légales du service IFUMB.",
}

export default function LegalNoticePage() {
  return <LegalNoticeView />
}
