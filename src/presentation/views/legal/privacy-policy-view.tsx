import { DraftBanner, DraftMarker } from '@/presentation/components/legal/draft-marker'
import { Dl, Row, Section, Table } from '@/presentation/components/legal/legal-layout'

const PURPOSES = [
  {
    purpose: 'Création et gestion du compte, authentification',
    data: 'Nom, prénom, e-mail, mot de passe (haché)',
    basis: 'Exécution du contrat',
  },
  {
    purpose: 'Construction et consultation de votre arbre',
    data: 'Fiche de membre : prénom (seul obligatoire), nom, genre, dates de naissance/décès, photo',
    basis: 'Exécution du contrat ; intérêt légitime du déclarant pour les données concernant un tiers',
  },
  {
    purpose: 'Identité culturelle (donnée sensible)',
    data: 'Tribu, clan, ethnicité — origine ethnique au sens du RGPD art. 9',
    basis: 'À trancher, voir « Un point particulier » ci-dessous',
  },
  {
    purpose: 'Collaboration sur un arbre',
    data: "E-mail du destinataire d'une invitation, rôle, jeton",
    basis: 'Exécution du contrat',
  },
  {
    purpose: 'Revue des modifications proposées',
    data: 'Historique des propositions, journal des modifications validées',
    basis: 'Exécution du contrat ; intérêt légitime (traçabilité)',
  },
  {
    purpose: 'Recherche et exploration publique (/explore)',
    data: 'Fiches et arbres marqués publics',
    basis: 'Consentement du propriétaire de l’arbre (choix de visibilité)',
  },
  {
    purpose: 'E-mails transactionnels',
    data: 'E-mail, contenu du message (invitation, réinitialisation de mot de passe, alerte)',
    basis: 'Exécution du contrat',
  },
  {
    purpose: 'Limitation de débit (anti-abus)',
    data: 'Adresse IP, horodatage',
    basis: 'Intérêt légitime (sécurité du service)',
  },
] as const

// reason: chaque section reste groupee avec son contenu pour rester lisible comme un seul document.
export function PrivacyPolicyView() {
  return (
    <article className="space-y-8">
      <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
      <DraftBanner />
      <p className="text-sm text-gray-600">
        Version <DraftMarker kind="a-completer">n°</DraftMarker> — mise à jour le{' '}
        <DraftMarker kind="a-completer">date</DraftMarker>.
      </p>

      <Section title="1. Qui est responsable de vos données ?">
        <p>
          Responsable du traitement :{' '}
          <DraftMarker kind="a-completer">identité, adresse, e-mail</DraftMarker>. Représentant au
          Gabon (loi 025/2023 art. 4) :{' '}
          <DraftMarker kind="a-completer">à désigner</DraftMarker>.
        </p>
        <p>
          Délégué à la protection des données (DPO) : non désigné à ce stade.{' '}
          <DraftMarker kind="choix">
            à réévaluer selon l’échelle du traitement de données sensibles
          </DraftMarker>
          . Point de contact vie privée en attendant :{' '}
          <DraftMarker kind="a-completer">contact</DraftMarker>.
        </p>
      </Section>

      <Section title="2. Quelles données, pourquoi et sur quelle base ?">
        <Table>
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-2 pr-4 font-semibold">Finalité</th>
              <th className="py-2 pr-4 font-semibold">Données</th>
              <th className="py-2 font-semibold">Base légale</th>
            </tr>
          </thead>
          <tbody>
            {PURPOSES.map((row) => (
              <tr key={row.purpose} className="border-b border-gray-100 align-top">
                <td className="py-2 pr-4">{row.purpose}</td>
                <td className="py-2 pr-4 text-gray-700">{row.data}</td>
                <td className="py-2 text-gray-700">{row.basis}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section title="3. Avec qui sont-elles partagées ?">
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase (hébergement de la base de données, région Union européenne)</li>
          <li>Vercel (hébergement et exécution de l’application)</li>
          <li>Resend (envoi des e-mails transactionnels)</li>
          <li>Upstash (limitation de débit, si activé en production)</li>
          <li>Les autres utilisateurs de votre arbre, selon le rôle que vous leur accordez</li>
          <li>Le public, uniquement pour le contenu qu’un propriétaire d’arbre rend « public »</li>
        </ul>
        <p>Aucune vente de données, aucun partage à des fins publicitaires.</p>
      </Section>

      <Section title="4. Où vos données sont-elles traitées ?">
        <p>
          Vérifié techniquement le 2026-11-07 : votre arbre et votre compte sont stockés dans une
          base de données hébergée en Irlande (Union européenne, région <code>eu-west-1</code>).
          L’application elle-même (ce qui lit et écrit ces données à chaque action que vous faites)
          s’exécute aux États-Unis (région Vercel <code>iad1</code>, Virginie), faute de
          configuration spécifique à ce jour — c’est le réglage par défaut de l’hébergeur, pas un
          choix délibéré documenté.
        </p>
        <p className="rounded-md border-2 border-brand-dark bg-white p-3">
          <strong>Conséquence :</strong> vos données transitent donc vers les États-Unis à chaque
          utilisation du service, même si leur stockage durable reste dans l’UE.{' '}
          <DraftMarker kind="choix">
            garantie de transfert applicable (adhésion de Vercel Inc. au cadre UE-États-Unis de
            protection des données, ou clauses contractuelles types) à vérifier et documenter avant
            publication — point soulevé par l’audit, pas encore validé par un juriste
          </DraftMarker>
          .
        </p>
        <p>
          Si vous êtes situé au Gabon, vos données sont, de plus, transférées hors du territoire
          gabonais : la loi 025/2023 (art. 171) soumet ce transfert à une autorisation préalable de
          l’APDPVP — en cours, voir le dossier des formalités gabonaises.
        </p>
      </Section>

      <Section title="5. Combien de temps conservons-nous vos données ?">
        <p>
          <DraftMarker kind="a-completer">
            aucune durée de conservation n’est encore définie (compte inactif, arbre supprimé,
            journal d’audit, jetons d’invitation expirés)
          </DraftMarker>
          .
        </p>
      </Section>

      <Section title="6. Vos droits">
        <p>
          Accès, rectification, effacement, limitation, opposition, portabilité, retrait du
          consentement à tout moment.
        </p>
        <p className="rounded-md border-2 border-brand-dark bg-white p-3">
          <strong>État actuel du produit :</strong> ces droits ne sont pas encore tous exerçables
          directement depuis l’application — aucun mécanisme d’export ni de suppression de compte
          n’existe à ce jour. Cette section ne doit pas être publiée telle quelle tant que ce
          mécanisme n’est pas livré.
        </p>
        <p>
          Exercer vos droits en attendant :{' '}
          <DraftMarker kind="a-completer">e-mail ou formulaire de contact</DraftMarker>. Réponse
          sous un mois, prolongeable de deux mois en cas de complexité.
        </p>
      </Section>

      <Section title="7. Décisions automatisées et profilage">
        <p>Aucune décision automatisée produisant des effets juridiques n’est prise par IFUMB.</p>
      </Section>

      <Section title="8. Réclamation auprès d'une autorité">
        <Dl>
          <Row term="Au Gabon">
            APDPVP — <DraftMarker kind="a-completer">adresse et portail à jour</DraftMarker>
          </Row>
          <Row term="En Belgique">
            Autorité de protection des données (APD/GBA), rue de la Presse 35, 1000 Bruxelles —{' '}
            <DraftMarker kind="a-completer">à vérifier avant publication</DraftMarker>
          </Row>
        </Dl>
      </Section>

      <Section title="9. Un point particulier : les données sur vos proches">
        <p>
          IFUMB est un outil généalogique : une grande partie des données traitées décrit des
          personnes qui ne sont pas elles-mêmes utilisatrices du service — parents, enfants (y
          compris mineurs), ou personnes décédées, saisies par un autre membre de la famille.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Mineurs :</strong> en décrivant un enfant mineur, vous le faites en tant que
            titulaire de l’autorité parentale ou avec son accord.{' '}
            <DraftMarker kind="choix">formulation exacte et éventuelle certification</DraftMarker>.
          </li>
          <li>
            <strong>Personne décrite devenant utilisatrice :</strong> elle peut revendiquer sa
            fiche (« c’est moi ») et exercer elle-même ses droits.
          </li>
          <li>
            <strong>Personne décrite qui ne devient jamais utilisatrice :</strong> elle peut
            demander la rectification ou le retrait des informations la concernant, par
            l’intermédiaire du propriétaire de l’arbre ou en nous contactant directement.
          </li>
          <li>
            <strong>Donnée sensible (tribu/clan/ethnicité) sur un tiers :</strong> en la saisissant,
            le déclarant certifie agir légitimement pour documenter l’histoire familiale.{' '}
            <DraftMarker kind="choix">
              base légale et mécanisme de certification à arbitrer avec un DPO
            </DraftMarker>
            .
          </li>
        </ul>
      </Section>

      <Section title="10. Cookies et traceurs">
        <p>
          IFUMB n’utilise aujourd’hui aucun traceur publicitaire ni analytique. Le seul cookie posé
          est le cookie de session nécessaire à l’authentification, strictement nécessaire au
          fonctionnement du service — aucune bannière de consentement n’est donc requise pour
          celui-ci.
        </p>
      </Section>
    </article>
  )
}
