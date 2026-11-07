import type { Metadata } from 'next'
import { TermsView } from '@/presentation/views/legal/terms-view'

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Les règles d'usage du service IFUMB : compte, contenu, modération, signalement.",
}

export default function TermsPage() {
  return <TermsView />
}
