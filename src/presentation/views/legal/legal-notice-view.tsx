import { DraftBanner, DraftMarker } from '@/presentation/components/legal/draft-marker'
import { Dl, Row, Section } from '@/presentation/components/legal/legal-layout'

// reason: chaque section reste groupée avec son contenu pour rester lisible comme un seul document.
export function LegalNoticeView() {
  return (
    <article className="space-y-8">
      <h1 className="text-3xl font-bold">Mentions légales</h1>
      <DraftBanner />

      <Section title="Éditeur">
        <Dl>
          <Row term="Dénomination">
            <DraftMarker kind="a-completer">identité légale de l’éditeur</DraftMarker>
          </Row>
          <Row term="Forme juridique">
            <DraftMarker kind="a-completer">aucune entité n’est encore immatriculée</DraftMarker>
          </Row>
          <Row term="Adresse d'établissement">
            <DraftMarker kind="a-completer">adresse</DraftMarker>
          </Row>
          <Row term="Numéro d'entreprise (BCE/KBO, RCCM ou équivalent)">
            <DraftMarker kind="a-completer">numéro</DraftMarker>
          </Row>
          <Row term="Contact direct">
            <DraftMarker kind="a-completer">e-mail et téléphone</DraftMarker>
          </Row>
        </Dl>
      </Section>

      <Section title="Représentant au Gabon">
        <p>
          La loi gabonaise 025/2023 (art. 4) exige la désignation d’un représentant établi au Gabon
          si l’éditeur n’y est pas établi.{' '}
          <DraftMarker kind="a-completer">
            dépend de la forme et du pays d’immatriculation de l’éditeur
          </DraftMarker>
          .
        </p>
      </Section>

      <Section title="Conditions contractuelles">
        <p>Conditions générales d’utilisation : voir la page dédiée.</p>
        <p>
          Droit applicable et juridiction :{' '}
          <DraftMarker kind="a-completer">
            à préciser, sans priver un consommateur de l’UE de la protection de la loi de son État
            de résidence
          </DraftMarker>
          .
        </p>
      </Section>

      <Section title="Hébergement">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Application (calcul) : Vercel Inc. — exécutée en pratique dans la région États-Unis
            (Virginie) à la date du 2026-11-07, réglage par défaut, jamais configuré
            explicitement —{' '}
            <DraftMarker kind="a-completer">adresse exacte du siège</DraftMarker>
          </li>
          <li>
            Base de données : Supabase (PostgreSQL), région Irlande (Union européenne) confirmée
            techniquement le 2026-11-07 —{' '}
            <DraftMarker kind="a-completer">adresse exacte du sous-traitant</DraftMarker>
          </li>
          <li>Envoi d’e-mails transactionnels : Resend</li>
        </ul>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          © <DraftMarker kind="a-completer">année</DraftMarker>{' '}
          <DraftMarker kind="a-completer">entité</DraftMarker>. Marque « IFUMB » et logo :{' '}
          <DraftMarker kind="a-completer">statut</DraftMarker>. Composants logiciels tiers : voir la
          page crédits et licences.
        </p>
      </Section>
    </article>
  )
}
