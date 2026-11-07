const STEPS = [
  {
    number: '01',
    title: 'Posez les premières racines',
    description:
      'Donnez un nom à votre arbre. Commencez par vous, vos parents ou les proches que vous connaissez.',
  },
  {
    number: '02',
    title: 'Faites grandir votre histoire',
    description:
      'Ajoutez les membres, leurs unions et leurs identités culturelles. Chaque détail enrichit votre arbre.',
  },
  {
    number: '03',
    title: 'Réunissez votre famille',
    description:
      'Invitez vos proches à contribuer. Croisez vos souvenirs et construisez ensemble une histoire à transmettre.',
  },
] as const

// reason: les étapes restent dans une liste ordonnée, avec une numérotation décorative distincte.
export function LandingHowItWorksView() {
  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="how-it-works-title"
      className="landing-how landing-section"
    >
      <div className="landing-container">
        <p className="landing-eyebrow">Un premier nom. Puis toute une histoire.</p>
        <h2 id="how-it-works-title">
          Vos racines prennent vie
          <br />
          <em>en trois étapes.</em>
        </h2>
        <ol className="landing-step-grid">
          {STEPS.map((step) => (
            <li key={step.number}>
              <span className="landing-step-number" aria-hidden="true">
                {step.number}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
