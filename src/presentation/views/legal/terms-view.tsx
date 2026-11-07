import Link from 'next/link'
import { DraftBanner, DraftMarker } from '@/presentation/components/legal/draft-marker'
import { Section } from '@/presentation/components/legal/legal-layout'

// reason: chaque section reste groupee avec son contenu pour rester lisible comme un seul document.
export function TermsView() {
  return (
    <article className="space-y-8">
      <h1 className="text-3xl font-bold">Conditions générales d’utilisation</h1>
      <DraftBanner />

      <Section title="1. Objet et acceptation">
        <p>
          IFUMB est un service gratuit de construction et de partage d’arbres généalogiques.
          L’inscription vaut acceptation des présentes conditions et de la{' '}
          <Link href="/legal/confidentialite">politique de confidentialité</Link>.
        </p>
      </Section>

      <Section title="2. Âge minimum">
        <p>
          L’inscription est réservée aux personnes d’au moins 16 ans.{' '}
          <DraftMarker kind="choix">
            seuil à confirmer — 16 ans suit l’ordonnance gabonaise sur les plateformes (force
            obligatoire non vérifiée) ; l’âge de consentement numérique belge est de 13 ans
          </DraftMarker>
          . Un enfant peut en revanche être décrit dans l’arbre d’un adulte sans détenir lui-même un
          compte.
        </p>
      </Section>

      <Section title="3. Votre compte">
        <p>
          Vous êtes responsable de la confidentialité de votre mot de passe et de toute activité
          effectuée depuis votre compte.
        </p>
      </Section>

      <Section title="4. Règles de contenu et de modération">
        <p>
          Contenu interdit : usurpation d’identité, harcèlement, contenu illicite, atteinte aux
          droits d’un tiers, contenu impliquant un mineur de façon inappropriée.
        </p>
        <p>
          Modération en place : proposition de modification soumise à l’approbation du propriétaire
          de l’arbre, journal d’audit des changements.{' '}
          <DraftMarker kind="a-completer">
            décrire le réexamen humain disponible en cas de litige et le délai cible de traitement
            d’un signalement
          </DraftMarker>
          .
        </p>
      </Section>

      <Section title="5. Licence sur le contenu que vous soumettez">
        <p>
          En ajoutant une fiche de membre, une photo ou tout autre contenu, vous accordez à IFUMB
          une licence non exclusive, mondiale, gratuite, portant sur l’hébergement, l’affichage, la
          reproduction technique et l’indexation au sein du service, jusqu’à la suppression du
          contenu. Vous garantissez être titulaire des droits sur les photos déposées, ou avoir
          l’accord des personnes qui y figurent (ou de leurs représentants légaux si mineures).
          Aucun contenu n’est utilisé pour entraîner un modèle d’intelligence artificielle à ce
          jour.
        </p>
      </Section>

      <Section title="6. Signaler un contenu">
        <p>
          Un lien « Signaler » doit être accessible depuis chaque fiche de membre et chaque arbre
          public. <DraftMarker kind="a-completer">mécanisme non encore implémenté</DraftMarker>. Un
          signalement concernant un mineur (cyberharcèlement, contenu préjudiciable) vise un accusé
          de réception sous 24 heures et une décision sous 72 heures.
        </p>
      </Section>

      <Section title="7. Point de contact">
        <p>
          Point de contact unique, par voie électronique, pour les autorités et les utilisateurs :{' '}
          <DraftMarker kind="a-completer">contact</DraftMarker>.
        </p>
      </Section>

      <Section title="8. Suspension et suppression de compte">
        <p>
          IFUMB peut suspendre ou clôturer un compte en cas de manquement grave ou répété aux
          présentes conditions, après{' '}
          <DraftMarker kind="a-completer">
            procédure — information préalable sauf urgence, possibilité de contester
          </DraftMarker>
          .
        </p>
      </Section>

      <Section title="9. Droit de réponse d'une personne décrite">
        <p>
          Une personne décrite dans un arbre peut demander la rectification ou le retrait des
          informations la concernant, en s’adressant au propriétaire de l’arbre ou directement à
          IFUMB.
        </p>
      </Section>

      <Section title="10. Droit applicable et modification des conditions">
        <p>
          <DraftMarker kind="a-completer">
            droit applicable et juridiction, préavis en cas de modification substantielle
          </DraftMarker>
          .
        </p>
      </Section>
    </article>
  )
}
