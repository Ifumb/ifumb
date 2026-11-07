import { Icon } from '@/presentation/components/ui/icon'

const QUESTIONS = [
  {
    question: 'Faut-il déjà connaître toute son histoire familiale ?',
    answer:
      'Quelques noms suffisent pour commencer. Ajoutez ce que vous connaissez, puis enrichissez votre arbre à votre rythme avec l’aide de vos proches.',
  },
  {
    question: 'Qui peut voir mon arbre généalogique ?',
    answer:
      'Votre arbre est privé par défaut. Vous choisissez les personnes que vous invitez et leurs droits d’accès. Vous pouvez aussi décider de rendre votre arbre public.',
  },
  {
    question: 'Ma famille vit dans plusieurs pays. Peut-on contribuer ensemble ?',
    answer:
      'Oui. Vos proches peuvent rejoindre le même arbre avec leur compte, où qu’ils vivent. Les invitations vous permettent de choisir qui peut consulter ou enrichir votre histoire familiale.',
  },
] as const

// reason: details/summary fournit une interaction accessible au clavier sans état ni JavaScript client.
export function LandingQuestionsView() {
  return (
    <section
      aria-labelledby="questions-title"
      className="landing-questions landing-container landing-section"
    >
      <div>
        <p className="landing-eyebrow">Avant de commencer</p>
        <h2 id="questions-title">
          Une question ?<br />
          <em>C’est naturel.</em>
        </h2>
        <p className="mt-5 max-w-xs text-landing-muted">
          Votre histoire se construit à votre rythme. Voici de quoi faire le premier pas.
        </p>
      </div>
      <div className="landing-question-list">
        {QUESTIONS.map(({ question, answer }) => (
          <details key={question}>
            <summary>
              {question}
              <Icon name="plus" size={19} />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
