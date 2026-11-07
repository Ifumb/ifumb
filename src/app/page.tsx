import type { Metadata } from 'next'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { LandingFeaturesView } from '@/presentation/views/landing/landing-features-view'
import { LandingFooterView } from '@/presentation/views/landing/landing-footer-view'
import { LandingHeroView } from '@/presentation/views/landing/landing-hero-view'
import { LandingHowItWorksView } from '@/presentation/views/landing/landing-how-it-works-view'
import { LandingHeaderView } from '@/presentation/views/landing/landing-header-view'
import { LandingQuestionsView } from '@/presentation/views/landing/landing-questions-view'
import { LandingInvitationView } from '@/presentation/views/landing/landing-invitation-view'

export const metadata: Metadata = {
  title: 'Votre histoire familiale, à transmettre',
  description:
    'Construisez votre arbre généalogique avec unions multiples, tribus, clans et ethnies au premier plan — pensé pour les familles africaines, partout dans le monde.',
  alternates: { canonical: '/' },
}

// reason: la composition par sections garde chaque bloc de contenu dans sa propre vue nommée.
export default async function HomePage() {
  const user = await currentUserOrNull()
  return (
    <div className="landing">
      <LandingHeaderView signedIn={!!user} />
      <LandingHeroView signedIn={!!user} />
      <LandingFeaturesView />
      <LandingHowItWorksView />
      <LandingQuestionsView />
      <LandingInvitationView signedIn={!!user} />
      <LandingFooterView signedIn={!!user} />
    </div>
  )
}
