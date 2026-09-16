# 0008 — Revue des propositions d'éditeur : compatibilité de format, revalidation, atomicité

## Status

Accepted — 2026-09-17. Précise l'ADR 0001 (schéma legacy repris à l'identique) ; ferme les bugs 1
à 8 du legacy identifiés dans `docs/plans/2.6-modifications-en-attente.md`, dont 3, 7 et 8 étaient
déjà réglés côté proposition (module 2.6a). Ce document couvre la revue (module 2.6b).

## Context

Dans le legacy, une proposition (`PendingChange`) enregistre un JSON avant/après selon les clés du
modèle Prisma. À l'approbation, `pending-changes.service.ts` l'applique tel quel :
`...fields as never` directement dans `prisma.member.create`/`update`. Aucune règle de domaine n'est
revérifiée ; une proposition devenue caduque (l'état réel a changé depuis) écrase silencieusement ce
changement ; l'application, le journal, le changement de statut et la notification sont des écritures
séparées, non atomiques ; un traitement en lot s'arrête à la première exception.

Deux options ont été considérées pour l'application : rejouer le JSON tel quel (rapide, mais rouvre
les bugs 1 et 2) ; le faire passer par les mêmes règles de domaine qu'une écriture directe (plus de
code, mais une seule source de vérité pour ce qui est un membre ou une union valide).

## Decision

- **Aucune application « brute » du JSON.** `core/use-cases/pending-change-application.ts` reparse
  le JSON en `MemberDetailsInput`/`UnionDetailsInput` (`proposal-snapshots.ts`, partie lecture,
  tolérante : clé absente ou illisible → valeur par défaut ou celle de la cible actuelle, jamais une
  clé inconnue écrite) puis appelle exactement les mêmes fonctions d'entité que l'écriture directe
  (`Member.start`/`revise`, `unionDetailsProblem`/`parentChangeProblem`). Ferme le bug 1.
- **Détection de péremption.** `proposal-staleness.isOutdated` compare le `snapshotBefore` enregistré
  à l'état actuel de la cible ; une proposition dont un champ enregistré ne correspond plus est
  refusée (`CHANGE_OUTDATED`), jamais appliquée en écrasant le changement intercurrent. Ferme le
  bug 2.
- **Une seule proposition PENDING par (auteur, cible), jamais par cible seule** (module 2.6a,
  réaffirmé ici) : deux éditeurs peuvent chacun avoir la leur en attente sur la même cible ; le
  remplacement ne touche que la proposition du même auteur. Ferme le bug 3.
- **Atomicité.** `ApprovePendingChangeUseCase`/`RejectPendingChangeUseCase` écrivent l'application (le
  cas échéant), le changement de statut de la proposition, l'entrée de journal
  (`PENDING_CHANGE_APPROVED`/`PENDING_CHANGE_REJECTED`) et la notification à l'auteur dans une seule
  transaction (`UnitOfWork`). Ferme le bug 4.
- **Suppression d'un enfant d'union** via une proposition approuvée réutilise le même `MemberWriter`
  que l'écriture directe (corrigé en 2.3) : aucun code spécifique, le comportement est hérité. Ferme
  le bug 5.
- **Revue en lot : une transaction par proposition**, jamais une transaction globale
  (`ReviewAllPendingChangesUseCase`). Une proposition devenue caduque, illisible ou déjà traitée est
  comptée « ignorée » (skipped) ; les autres sont traitées normalement. Une erreur inattendue (panne
  de la base, par exemple) reste bloquante pour le lot restant — délibéré : une vraie panne
  d'infrastructure doit arrêter le traitement, pas être avalée silencieusement. Ferme le bug 6.
- **Identifiant réel dès la proposition** (module 2.6a, réaffirmé ici) : le `targetId` d'une
  proposition de création est l'identifiant généré à la proposition (`ids.next()`), réutilisé sans
  changement à l'approbation — jamais de `new-<horodatage>`. Ferme le bug 7.
- **HTML échappé dans l'email d'alerte** (module 2.6a, réaffirmé ici). Ferme le bug 8.
- **Toujours hors revue, réservés au propriétaire** (module 2.6a, réaffirmé ici) : les liens
  enfant-union et les photos — le format de proposition ne les représente pas.

## Consequences

- Aucune migration : les tables `PendingChange`, `Notification`, `AuditLog` existantes suffisent.
- Une proposition valide au moment où elle a été faite peut être refusée à l'approbation si la
  famille a changé entretemps d'une façon qui viole une règle de domaine (parent supprimé, cycle
  créé) — traité comme les autres refus de validation, jamais comme un bug : le propriétaire revoit
  alors la fiche cible avant de retenter.
- Les tests d'entité et de cas d'usage n'appliquent jamais un JSON directement à Prisma : ils passent
  systématiquement par `pending-change-application.ts`, seul point qui traduit une proposition en
  écriture.
- Le format des snapshots reste compatible avec le legacy : une proposition créée avant le cutover,
  ou par le legacy tant qu'il tourne aux côtés de `ifumb-next`, reste lisible et approuvable ici.
