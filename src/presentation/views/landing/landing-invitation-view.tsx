import { Icon } from '@/presentation/components/ui/icon'
import { LandingPrimaryAction } from './landing-primary-action'

// reason: le titre, le texte et l’action forment un seul bloc sémantique de conclusion.
export function LandingInvitationView({ signedIn }: Readonly<{ signedIn: boolean }>) {
  return (
    <section aria-labelledby="invitation-title" className="landing-invitation">
      <div className="landing-container">
        <Icon name="branch" size={34} className="mx-auto mb-5" />
        <p className="landing-eyebrow">Un héritage commence par un premier lien</p>
        <h2 id="invitation-title">
          L’histoire de votre famille
          <br />
          mérite d’être transmise.
        </h2>
        <p>Commencez avec un nom. Faites grandir le reste ensemble.</p>
        <LandingPrimaryAction signedIn={signedIn} closing />
      </div>
    </section>
  )
}
