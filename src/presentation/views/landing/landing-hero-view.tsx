import Link from 'next/link'
import { Icon } from '@/presentation/components/ui/icon'
import { LandingPrimaryAction } from './landing-primary-action'
import { LandingPreviewView } from './landing-preview-view'

type LandingHeroViewProps = Readonly<{ signedIn: boolean }>

// reason: le JSX conserve ensemble le titre, les actions et les repères de confiance de la section.
export function LandingHeroView({ signedIn }: LandingHeroViewProps) {
  return (
    <section aria-labelledby="home-title" className="landing-container landing-hero">
      <div className="landing-hero-copy">
        <p className="landing-eyebrow">
          <span /> Nos racines nous relient
        </p>
        <h1 id="home-title">
          Chaque famille
          <br />a une histoire.
          <br />
          <em>Faites vivre la vôtre.</em>
        </h1>
        <p className="landing-intro">
          Rassemblez vos proches, retrouvez vos racines et transmettez votre histoire. Un arbre
          généalogique qui fait toute leur place aux familles africaines et à leur diaspora.
        </p>
        <div className="landing-hero-actions">
          <LandingPrimaryAction signedIn={signedIn} />
          <Link href="/explore" className="landing-text-link">
            Explorer les arbres publics <Icon name="next" />
          </Link>
        </div>
        <p className="landing-reassurance">
          <Icon name="lock" size={14} /> Votre arbre est privé par défaut. Vous choisissez avec qui
          le partager.
        </p>
      </div>
      <LandingPreviewView />
    </section>
  )
}
