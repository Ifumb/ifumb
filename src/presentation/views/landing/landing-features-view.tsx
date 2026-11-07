import { Icon, type IconName } from '@/presentation/components/ui/icon'

type Feature = Readonly<{ icon: IconName; title: string; description: string; detail: string }>

const FEATURES: readonly Feature[] = [
  {
    icon: 'union',
    title: 'Toutes vos unions',
    detail: 'Chaque lien compte',
    description:
      'Mariages, remariages, familles recomposées : représentez votre famille dans toute sa richesse.',
  },
  {
    icon: 'dna',
    title: 'Vos identités culturelles',
    detail: 'Des racines visibles',
    description:
      'Tribus, clans et ethnies ont leur place dans chaque fiche et dans la recherche de vos proches.',
  },
  {
    icon: 'people',
    title: 'Une histoire collective',
    detail: 'À construire ensemble',
    description:
      'Invitez vos proches à enrichir le même arbre. Reliez les arbres lorsque vos histoires se croisent.',
  },
  {
    icon: 'lock',
    title: 'Un partage choisi',
    detail: 'Vous gardez la main',
    description:
      'Votre arbre commence en privé. Vous décidez de sa visibilité et des accès accordés à votre famille.',
  },
]

// reason: le titre et la liste composent une seule section éditoriale sans logique métier.
export function LandingFeaturesView() {
  return (
    <section
      id="pourquoi-ifumb"
      aria-labelledby="features-title"
      className="landing-features landing-section"
    >
      <div className="landing-container">
        <div className="landing-section-heading">
          <div>
            <p className="landing-eyebrow">La famille, dans toute sa richesse</p>
            <h2 id="features-title">
              Un arbre qui vous
              <br />
              <em>ressemble vraiment.</em>
            </h2>
          </div>
          <p>
            Chaque famille a ses liens, ses cultures et ses façons de se raconter. IFUMB leur donne
            une place, dès le départ.
          </p>
        </div>
        <ul className="landing-feature-grid">
          {FEATURES.map((feature) => (
            <FeatureItem key={feature.title} feature={feature} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function FeatureItem({ feature }: Readonly<{ feature: Feature }>) {
  return (
    <li className="landing-feature">
      <span className="landing-feature-icon">
        <Icon name={feature.icon} size={24} />
      </span>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
      <span className="landing-feature-detail">{feature.detail}</span>
    </li>
  )
}
