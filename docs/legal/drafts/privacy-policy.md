<!-- BROUILLON À FAIRE VALIDER PAR UN JURISTE / DPO — conventions : assets/templates/README.md (skill `legal`) -->
<!-- Source : RGPD art. 12-14 (UE/Belgique) ; loi gabonaise 025/2023 art. 98 (notice d'information), art. 74-76 (données sensibles), art. 190 (mineurs). Ce document ne peut pas être publié tant que les [À COMPLÉTER] identitaires ne sont pas renseignés, et pas avant que le mécanisme d'export/suppression (§ 6) existe réellement dans le produit. -->

# Politique de confidentialité

Version [À COMPLÉTER : n°] — mise à jour le [À COMPLÉTER : date]. Versions précédentes : [À COMPLÉTER : lien].

## 1. Qui est responsable de vos données ?
- Responsable du traitement : [À COMPLÉTER : identité, adresse, e-mail — voir `legal-notice.md`].
- Représentant au Gabon (loi 025/2023 art. 4) : [À COMPLÉTER].
- Délégué à la protection des données (DPO) : non désigné à ce stade. [À COMPLÉTER : à réévaluer — un DPD est obligatoire au Gabon pour un traitement à grande échelle de données sensibles, art. 125 ; en UE, l'obligation dépend aussi de l'échelle, art. 37 RGPD]. Point de contact vie privée en attendant : [À COMPLÉTER].

## 2. Quelles données, pourquoi et sur quelle base ?

| Finalité | Données concernées | Base juridique | Source | Obligatoire ou facultatif |
| --- | --- | --- | --- | --- |
| Création et gestion du compte, authentification | Nom, prénom, e-mail, mot de passe (haché) | Exécution du contrat (conditions d'utilisation) | Directement auprès de vous | Obligatoire pour créer un compte |
| Construction et consultation de l'arbre généalogique | Fiches de « Membre » : prénom (seul obligatoire), nom, genre, date de naissance (exacte ou approximative), date de décès, photo | Exécution du contrat, pour les données vous concernant ; intérêt légitime du déclarant à documenter son histoire familiale, pour les données concernant un tiers (parent, enfant, personne décédée) — [CHOIX : base légale à confirmer avec un DPO, voir § 9] | Saisies par vous ou par un autre utilisateur de votre arbre | Prénom obligatoire ; le reste facultatif |
| Identité culturelle | Tribu, clan, ethnicité (`Member.tribe`, `.clan`, `.ethnicity`) — **donnée sensible** (origine ethnique, RGPD art. 9 ; loi gabonaise art. 74-76) | [CHOIX : consentement explicite de la personne concernée quand elle est utilisatrice / certification du déclarant quand la personne décrite est un tiers non-utilisateur — voir § 9, décision à prendre avant publication] | Saisies par vous ou par un autre utilisateur | Facultatif |
| Collaboration sur un arbre | E-mail du destinataire d'une invitation, rôle (éditeur/propriétaire), jeton d'invitation | Exécution du contrat | Saisies par le propriétaire de l'arbre | Obligatoire pour inviter un collaborateur |
| Revue des modifications proposées | Historique des propositions (création/modification/suppression), journal d'audit des changements validés | Exécution du contrat ; intérêt légitime (traçabilité, prévention des abus) | Générées par votre usage | — |
| Notifications | Compteur et contenu des notifications (invitation, modification en attente, etc.) | Exécution du contrat | Générées par votre usage | — |
| Recherche et exploration publique (`/explore`) | Fiches de membres et arbres marqués publics, recherche par nom/tribu/ethnicité | Consentement du propriétaire de l'arbre (choix explicite de la visibilité « public ») | Rendu public par le propriétaire de l'arbre | Facultatif — visibilité choisie par le propriétaire |
| Mise en relation entre arbres distincts (demandes de contact, liaison de branches) | Message de mise en relation, lien entre arbres | Exécution du contrat / intérêt légitime | Saisies par vous | Facultatif |
| Envoi d'e-mails transactionnels (invitation, réinitialisation de mot de passe, alerte de modification en attente) | E-mail, contenu du message | Exécution du contrat | — | Nécessaire au fonctionnement du compte |
| Limitation de débit (anti-abus) sur les recherches publiques | Adresse IP, horodatage | Intérêt légitime (sécurité du service) | Technique | — |

*Donnée sensible et donnée de mineur traitées : voir § 9 « Un point particulier : les données sur vos proches ». Décision à faire valider par un DPO avant publication.*

## 3. Avec qui sont-elles partagées ?
- **Supabase** (hébergement de la base de données PostgreSQL, région Union européenne) — sous-traitant technique.
- **Vercel** (hébergement et exécution de l'application) — sous-traitant technique.
- **Resend** (envoi des e-mails transactionnels : invitations, réinitialisation de mot de passe, alertes) — sous-traitant technique.
- **Upstash** (limitation de débit / anti-abus, si activé en production) — sous-traitant technique.
- Les autres utilisateurs de votre arbre, selon le rôle que vous leur accordez (éditeur, propriétaire).
- Le public, uniquement pour le contenu que le propriétaire d'un arbre choisit explicitement de rendre « public » (`/explore`).
- Aucune vente de données, aucun partage à des fins publicitaires.
- Liste des sous-traitants tenue à jour : [À COMPLÉTER : lien].

## 4. Où vos données sont-elles traitées ?
Vérifié techniquement le 2026-11-07 (CLI Vercel authentifiée, `.env.local`) :
- **Stockage** (base de données Supabase/PostgreSQL) : Irlande, Union européenne — région AWS `eu-west-1` (hôte `aws-1-eu-west-1.pooler.supabase.com`).
- **Calcul applicatif** (Vercel, ce qui exécute chaque Server Action et route API) : États-Unis — région `iad1` (Virginie), confirmé sur les 10 derniers déploiements de production (`vercel inspect`). Aucune configuration de région n'existe dans le dépôt (pas de `vercel.json`) : c'est le réglage par défaut de Vercel, jamais choisi ni documenté.
- **Conséquence** : vos données transitent par les États-Unis à chaque utilisation du service, même si leur stockage durable reste dans l'UE — un transfert international au sens du RGPD (chapitre V), distinct du simple hébergement de la base. [CHOIX : garantie de transfert applicable (adhésion de Vercel Inc. au cadre UE-États-Unis de protection des données (EU-U.S. Data Privacy Framework), ou clauses contractuelles types) à vérifier et documenter avant publication — ce point n'avait pas été identifié avant l'audit du 2026-11-07, voir le registre légal].
- **Si vous êtes situé au Gabon** : vos données sont, de plus, transférées hors du territoire gabonais. La loi 025/2023 (art. 171) soumet ce transfert à une **autorisation préalable de l'APDPVP** — voir `docs/legal/drafts/africa-prior-formalities.md`. Ce document ne sera publié en production qu'une fois cette autorisation obtenue.

## 5. Combien de temps conservons-nous vos données ?
[À COMPLÉTER — aucune durée de conservation n'est aujourd'hui définie ni documentée dans le projet. À trancher avant publication : durée de conservation d'un compte inactif, d'un arbre supprimé, du journal d'audit, des jetons d'invitation expirés.]

## 6. Vos droits
Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données. Vous pouvez retirer votre consentement à tout moment, sans remettre en cause la licéité du traitement effectué avant ce retrait.

**État actuel du produit : ces droits ne sont pas encore tous exerçables directement depuis l'application.** Un compte peut aujourd'hui demander la modification de ses fiches, mais aucun mécanisme d'export ou de suppression de compte n'existe dans le code à la date de cet audit. **Cette section ne doit pas être publiée telle quelle tant que ce mécanisme n'est pas livré** — voir le registre légal, écart majeur n° 2.

Exercer vos droits en attendant : [À COMPLÉTER : adresse e-mail ou formulaire de contact]. Réponse sous un mois, prolongeable de deux mois en cas de complexité.

## 7. Décisions automatisées et profilage
Aucune décision automatisée produisant des effets juridiques ou vous affectant de manière significative n'est prise par IFUMB.

## 8. Réclamation auprès d'une autorité
- Au Gabon : **Autorité de Protection des Données à caractère Personnel et à la Vie Privée (APDPVP)** — [À COMPLÉTER : adresse et portail à jour].
- En Belgique : **Autorité de protection des données (APD/GBA)**, rue de la Presse 35, 1000 Bruxelles — [À COMPLÉTER : vérifier l'adresse et le portail à jour avant publication].
- Pour un autre pays de l'UE : l'autorité de votre État de résidence habituelle.

## 9. Un point particulier : les données sur vos proches
IFUMB est un outil généalogique : une grande partie des données traitées (nom, dates, tribu, clan, ethnicité) décrit **des personnes qui ne sont pas elles-mêmes utilisatrices du service** — parents, enfants (y compris mineurs), ou personnes décédées, saisies par un autre membre de la famille.

- **Mineurs** : si vous décrivez un enfant mineur dans votre arbre, vous le faites en tant que titulaire de l'autorité parentale ou avec son accord. [CHOIX : formulation exacte et éventuelle case de certification à l'ajout d'un membre mineur — décision produit à valider, voir le registre légal].
- **Personne décrite devenant elle-même utilisatrice** : elle peut « revendiquer » sa fiche (fonctionnalité « c'est moi ») et exercer alors elle-même l'ensemble des droits du § 6 sur ses propres données.
- **Personne décrite qui ne devient jamais utilisatrice** (y compris une personne décédée pour la partie de ses données qui reste rattachée à des proches vivants) : elle peut, par l'intermédiaire du propriétaire de l'arbre ou en nous contactant directement, demander la rectification ou le retrait des informations la concernant.
- **Donnée sensible (tribu/clan/ethnicité)** : en la saisissant sur un tiers, le déclarant certifie agir légitimement pour documenter l'histoire familiale et ne pas porter atteinte aux intérêts de la personne décrite. [CHOIX : base légale et mécanisme de certification exacts à arbitrer avec un DPO avant publication — voir le registre légal, point à vérifier].

## 10. Cookies et traceurs
IFUMB n'utilise, à la date de cet audit, aucun traceur publicitaire ni analytique. Le seul cookie posé est le cookie de session nécessaire à l'authentification (Auth.js), strictement nécessaire au fonctionnement du service — aucune bannière de consentement n'est donc requise pour celui-ci. Si un outil de mesure d'audience ou publicitaire était ajouté, cette section et une politique cookies dédiée devront être mises à jour avant son activation.

<!-- Collecte INDIRECTE (art. 14 RGPD) : les données d'un Member saisies par un tiers relèvent de ce régime — information due dans un délai raisonnable, au plus tard lors de la première communication si la personne est contactée, ou lors de la première divulgation à un tiers. Voir § 9. -->
