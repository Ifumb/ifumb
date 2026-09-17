# Phase 3 — Suggestions inter-arbres (`cross-tree`) et `contact-requests`

**Statut : plan proposé, non confirmé par l'utilisateur, aucun code écrit.** Étape 3 du cycle de
travail (« produire le plan d'architecture des 14 points ») décrit dans `CLAUDE.md`. Avant de
coder : reconfirmer ce plan (ou l'ajuster puis reconfirmer) — **jamais de code avant confirmation
explicite**.

Legacy source lu pour produire ce plan (recherche approfondie, agent dédié) :
`ifumb/apps/api/src/cross-tree/` (`cross-tree.module.ts`, `cross-tree.controller.ts`,
`cross-tree-branch.controller.ts`, `cross-tree.service.ts`, 501 lignes), `ifumb/apps/api/src/
contact-requests/` (service, contrôleur, DTO), les composants web associés
(`CrossTreeSuggestionsPanel.tsx`, `CrossTreeRequestsPanel.tsx`, `TreePage.tsx` pour l'intégration
dans le graphe, `ContactRequestsPage.tsx`, `ContactRequestButton.tsx`, `PrivateMemberCard.tsx`,
`DiscoverableToggle.tsx`), et `members.service.ts` (`globalSearch`, le réglage `discoverable`).
Schéma déjà présent côté `ifumb-next` (`prisma/schema.prisma`) : `CrossTreeSuggestion`,
`CrossTreeConnectionRequest`, `CrossTreeLink`, `ContactRequest`, `Member.discoverable`,
`Notification.contactRequestId` (déjà prévu depuis le module 2.7), enums `SuggestionConfidence`,
`SuggestionStatus`, `ConnectionRequestStatus`, `ContactRequestStatus` — identique au legacy,
vérifié champ par champ. `NotificationType` (5 valeurs, figées depuis 2.7) ne contient **aucune**
valeur pour les événements cross-tree — point important, voir décision 6.

## Constats sur le legacy

**Ce que fait le module, en deux sous-systèmes qui partagent le même contrôleur/service côté
legacy**

- **Suggestions et liaison** : un algorithme de correspondance propose « ce membre de votre arbre
  pourrait être la même personne que ce membre-là, dans cet autre arbre » (nom de famille exact
  obligatoire, écart de naissance ≤ 5 ans, confiance HIGH/MEDIUM/LOW selon prénom/tribu/ethnie/année
  de naissance). Le propriétaire ou l'éditeur de l'arbre source accepte (→ crée une
  `CrossTreeConnectionRequest` PENDING, expire à 30 jours) ou rejette (terminal) une suggestion.
  Le propriétaire de l'arbre **cible** approuve (→ crée un `CrossTreeLink`) ou refuse la demande.
- **Branche étrangère** : une fois un `CrossTreeLink` établi, `GET /cross-tree/:linkId/branch`
  renvoie le graphe de l'arbre étranger autour du membre lié (« pont »), **avec accès complet à cet
  arbre étranger quelle que soit sa visibilité** — la liaison vaut accord mutuel. Le web l'intègre
  **directement dans le graphe principal** (pas une page séparée) : un marqueur « pont » sur le
  membre, un clic charge et fusionne les nœuds/arêtes étrangers dans le même canevas React Flow,
  relance dagre. C'est la pièce la plus dense de toute la phase — elle touche le graphe déjà construit
  aux modules 1.2/1.3.
- **`contact-requests`** : un mécanisme de prise de contact « à froid », indépendant du modèle de
  collaboration (invitations/rôles). N'importe quel visiteur connecté qui trouve un membre
  `discoverable` (arbre `PUBLIC`, ou `PRIVATE`/`SHARED` via la recherche globale) peut envoyer une
  demande de contact au **propriétaire** de l'arbre de ce membre. Cycle
  `PENDING → ACCEPTED | REFUSED` (propriétaire) ou `→ WITHDRAWN` (demandeur). Aucun email — seulement
  des `Notification` en base ; le rapprochement se fait ensuite par email échangé manuellement une
  fois l'email du contact revélé côté UI.
- **Réglage `discoverable`** : un booléen sur `Member`, activable par quiconque peut modifier ce
  membre (pas une action réservée au compte qui l'a revendiqué). Utilisé à deux endroits : la
  recherche globale (`globalSearch`, déjà partiellement portée en 1.4 pour la moitié `PUBLIC`) et le
  garde-fou de `contact-requests.create`.

**Bugs et écarts trouvés en lisant le code (pas encore en testant)**

1. **Aucun filtre `archivedAt`** sur le bassin de correspondance des suggestions (`cross-tree.
   service.ts`), ni sur les deux branches de `globalSearch` — même famille de bug déjà corrigée pour
   la recherche publique seule au module 1.4.
2. **`computeSuggestions` non atomique** : `deleteMany` puis `createMany` en deux requêtes séparées,
   contrairement au reste du fichier qui utilise `$transaction`.
3. **Fuite d'autorisation réelle** : le bassin de correspondance d'une suggestion inclut les arbres
   privés auxquels **l'utilisateur qui lance le calcul** a personnellement accès, mais la suggestion
   stockée est ensuite servie à **tout** propriétaire/éditeur de l'arbre source — y compris ceux qui
   n'ont eux-mêmes aucun accès à l'arbre cible. Un éditeur qui a par ailleurs une invitation privée
   ailleurs peut donc, en lançant « calculer », exposer des données d'un arbre privé à des
   collaborateurs qui n'y ont normalement pas accès.
4. **Expiration jamais revérifiée à l'approbation/au refus** : seule la lecture de la liste purge les
   demandes `PENDING` expirées ; `approve`/`refuse` ne vérifient que le statut, pas `expiresAt`. Pas
   de tâche planifiée (cohérent avec l'ADR 0004, hébergement pas encore choisi) — juste un balayage
   paresseux à la lecture, comme le legacy.
5. **Un rejet de suggestion est permanent, un blocage de contact aussi** : `@@unique([memberId,
   targetMemberId])` sur `CrossTreeSuggestion` et `@@unique([requesterId, memberId])` sur
   `ContactRequest` — un recalcul ou une nouvelle tentative ne peut jamais recréer la ligne, et
   `skipDuplicates`/la contrainte bloquent silencieusement toute correction. Les deux schémas sont
   déjà déployés, aucune migration possible.
6. **Aucune notification pour l'approbation/le refus d'une demande de connexion inter-arbres** :
   `CrossTreeModule` n'importe pas `NotificationsModule` et aucune des deux méthodes n'appelle le
   service de notifications. **`NotificationType` (figé depuis le module 2.7, schéma déjà déployé)
   ne contient aucune valeur pour cet événement** — impossible à fermer sans migration.
7. **Références pendantes à la suppression d'un membre** : les trois modèles `cross-tree`
   référencent `memberId` en chaîne brute, pas en relation Prisma — supprimer un membre laisse des
   lignes orphelines (le service s'en protège avec des `?? null`, mais rien ne les nettoie).
8. **Email du demandeur exposé au propriétaire avant toute décision**, et **email du propriétaire
   renvoyé par l'API à chaque statut** alors que l'UI ne l'affiche qu'une fois `ACCEPTED` — le
   filtrage n'existe que côté client, pas côté serveur, malgré un texte d'interface qui promet le
   contraire.
9. **`contact-requests.create` ne vérifie ni l'archivage ni la visibilité de l'arbre**, seulement
   `member.discoverable`.
10. **`globalSearch` exclut les arbres `SHARED`** des deux branches (public et découvrable), déjà
    signalé comme point ouvert dans `CLAUDE.md` depuis le module 1.4.
11. **Le `total` renvoyé par `globalSearch` est faux** (compte la page déjà découpée, pas le total
    réel) — déjà corrigé pour la moitié publique seule par `PrismaPublicMemberDirectory` (module 1.4).
12. **Email HTML non échappé**, même famille que les bugs déjà fermés aux modules 2.6/2.8 — `mail.
    service.ts` reste à éviter comme modèle si ce module en vient à envoyer un email (décision 7 :
    non, dans ce périmètre).

## Décisions proposées (à valider)

1. **Découpage en trois livraisons**, la phase étant, de l'aveu même de `CLAUDE.md`, « la logique la
   plus dense » de toute la migration :
   - **3.1 — Recherche découvrable + `contact-requests`** : réglage `discoverable`, recherche
     globale complète (publique + privée découvrable), envoi/réponse/retrait d'une demande de
     contact, notifications. Autonome, ne dépend de rien d'autre que l'existant.
   - **3.2 — Suggestions et demandes de connexion inter-arbres** : calcul, liste, accepter/rejeter
     une suggestion, lister/approuver/refuser une demande de connexion, lister les liaisons établies.
     Panneaux de liste uniquement (comme `CrossTreeSuggestionsPanel`/`CrossTreeRequestsPanel`), **pas
     encore** l'intégration dans le graphe.
   - **3.3 — Branche étrangère dans le graphe** : dépend de 3.2 (a besoin de liaisons existantes) et
     touche le plus lourdement le graphe déjà construit (modules 1.2/1.3, dagre + React Flow). Le
     morceau le plus risqué, délibérément isolé en dernier.
2. **Arbres `SHARED` traités comme `PRIVATE`** partout où le legacy les excluait à tort (recherche
   découvrable, bassin de correspondance des suggestions) — ferme le bug 10 et l'incohérence interne
   du legacy (qui, lui, les incluait déjà côté bassin de suggestions mais pas côté recherche).
3. **Fuite d'autorisation (bug 3) fermée en filtrant à la lecture, pas en réduisant le bassin** :
   `GetSuggestionsUseCase` ne montre une suggestion que si le **visiteur courant** (pas seulement
   n'importe quel propriétaire/éditeur de l'arbre source) a lui-même accès à l'arbre cible — le calcul
   garde son bassin large (tous les arbres publics + tous ceux que le calculateur peut voir), mais
   chaque lecteur ne voit ensuite que ce qu'il pourrait lui-même consulter. Préserve la fonctionnalité
   (suggérer des correspondances entre arbres privés liés par une invitation) sans la fuite.
4. **Upsert au lieu d'un blocage permanent (bug 5), même leçon qu'au module 2.8** :
   `ContactRequestWriter.create` réinitialise une ligne existante `REFUSED`/`WITHDRAWN` à `PENDING`
   plutôt que d'être bloqué par la contrainte `@unique` — refusé (« déjà en cours ») seulement si la
   ligne existante est `PENDING` ou `ACCEPTED`. Même principe pour `CrossTreeSuggestion` : un
   recalcul réinitialise une ligne `REJECTED` à `NEW` si un nouveau signal la justifie encore, mais ne
   touche jamais une ligne déjà `ACCEPTED` (déjà engagée dans une demande de connexion).
5. **Expiration** : balayage paresseux à la lecture, comme le legacy (bug 4) — cohérent avec l'ADR
   0004, pas de tâche planifiée dans cette phase.
6. **Pas de notification pour l'approbation/le refus d'une connexion inter-arbres (bug 6)** :
   impossible à fermer sans élargir `NotificationType`, un enum du schéma déjà déployé — **aucune
   migration n'étant possible**, ce point reste identique au legacy et est documenté comme tel, pas
   corrigé. À revoir seulement si une migration redevient possible (cutover, Phase 4).
7. **Toujours aucun email pour `contact-requests` ni `cross-tree`** dans ce périmètre — comme le
   legacy, seulement des `Notification` en base. Pas de nouvelle dépendance mail, pas de nouveau
   risque d'injection HTML (bug 12 évité en ne l'introduisant pas).
8. **Exposition d'email resserrée côté serveur (bug 8)** : l'email du demandeur et celui du
   propriétaire ne sont renvoyés par l'API qu'une fois la demande `ACCEPTED`, dans les deux sens —
   correction réelle, pas seulement un masquage côté client.
9. **Références pendantes (bug 7)** : gérées en code applicatif exactement comme le legacy (recherche
   tolérante, `?? null`), aucune relation Prisma ajoutée — non migrable.
10. **`discoverable` reste modifiable par quiconque peut modifier la fiche** (propriétaire, ou compte
    qui l'a revendiquée), pas réservé à un rôle plus strict — comportement legacy conservé,
    non signalé comme un bug par l'utilisateur ni par cette recherche.

Le reste de ce document décrit l'ensemble des trois modules ; chaque point dit lequel concerne.

---

## 1. Workflow

Trois ajouts de fonctionnalité indépendants mais liés, dans l'ordre 3.1 → 3.2 → 3.3, chacun avec son
propre gate et son propre commit — sur le modèle du découpage 2.6a/2.6b.

## 2. Découpage par couche

**`core/entities`**

- **`contact-request.ts`** (3.1) : entité `ContactRequest` (id, treeId, memberId, requesterId,
  message, statut, dates). `.send(...)` (nouveau, `PENDING`) ; `.respond(decision, now)` →
  `Result<ContactRequest, AlreadyResolved>` (`ACCEPTED`/`REFUSED`, propriétaire) ; `.withdraw(now)` →
  `Result<ContactRequest, AlreadyResolved>` (demandeur).
- **`cross-tree-suggestion.ts`** (3.2) : entité `CrossTreeSuggestion` (id, treeId, memberId,
  targetTreeId, targetMemberId, confiance, statut). `.propose(...)`, `.accept(now)` →
  `Result<…, AlreadyResolved>`, `.reject(now)` → idem.
- **`member-matching.ts`** (3.2, fonctions pures) : `matchConfidence(a: MatchableMember, b:
  MatchableMember): Confidence | null` — porte l'algorithme (nom exact, écart de naissance ≤ 5 ans,
  prénom/tribu/ethnie/année), testable isolément sans base de données.
- **`connection-request.ts`** (3.2) : entité `CrossTreeConnectionRequest` (id, arbres/membres
  demandeur et cible, statut, expiration). `.approve(now)`/`.refuse(now)` →
  `Result<…, AlreadyResolved | Expired>` (l'entité revérifie elle-même l'expiration à la résolution —
  ferme le bug 4 au niveau du domaine, pas seulement à la lecture).
- **`cross-tree-link.ts`** (3.3) : entité simple `CrossTreeLink` (id, deux couples arbre/membre).

**`core/use-cases`**

- **3.1** : `ToggleMemberDiscoverableUseCase` (ou extension d'`UpdateMemberUseCase` — à trancher en
  codant selon ce qui reste le plus simple), `SearchDiscoverableMembersUseCase` (combine
  `PublicMemberDirectory` existant + un nouveau bassin privé/découvrable, un seul `Page<T>` avec un
  vrai total — ferme le bug 11), `SendContactRequestUseCase`, `RespondToContactRequestUseCase`,
  `WithdrawContactRequestUseCase`, `ListContactRequestsUseCase` (reçues/envoyées).
- **3.2** : `ComputeSuggestionsUseCase`, `GetSuggestionsUseCase` (filtre par accès du lecteur —
  décision 3), `AcceptSuggestionUseCase`, `RejectSuggestionUseCase`, `GetConnectionRequestsUseCase`,
  `ApproveConnectionRequestUseCase`, `RefuseConnectionRequestUseCase`, `ListCrossTreeLinksUseCase`.
- **3.3** : `GetForeignBranchUseCase` (réutilise la logique de graphe déjà écrite en 1.2/1.3 —
  probablement une fonction pure partagée plutôt qu'une duplication ; à confirmer en lisant
  `core/use-cases/get-family-graph.ts` en détail avant de coder ce module précis).
- **Ports** : `ports/contact-request-reader.ts`/`writer.ts`, `ports/discoverable-member-directory.ts`
  (3.1) ; `ports/cross-tree-suggestion-reader.ts`/`writer.ts`,
  `ports/connection-request-reader.ts`/`writer.ts`, `ports/cross-tree-link-reader.ts`/`writer.ts`
  (3.2/3.3). Écritures via l'unité de travail existante (`UnitOfWorkContext` gagne `contactRequests`
  en 3.1, `crossTreeSuggestions`/`connectionRequests`/`crossTreeLinks` en 3.2/3.3) ; lectures en
  ports autonomes, sur le modèle déjà établi (`InvitationReader`, `NotificationReader`).

**`infrastructure`**

- Adaptateurs Prisma et doublures en mémoire pour chaque port ci-dessus, un fichier par port comme
  partout ailleurs.
- **`prisma-notification-reader.ts` (3.1, modification)** : la jointure actuelle ne couvre que
  `pendingChange` — les notifications `CONTACT_REQUEST_*` ont déjà leur libellé
  (`notification-labels.ts`, préparé en 2.7) mais aucune donnée jointe. Ajouter la jointure
  `contactRequest` (arbre, demandeur, propriétaire) pour que `toView` résolve nom et arbre dans ce
  cas aussi — sans ça, ces notifications s'afficheraient vides une fois produites.
- `di/contact-request-use-cases.ts`, `di/cross-tree-use-cases.ts` : fabriques regroupées, sur le
  modèle de `di/invitation-use-cases.ts`.

**`presentation` et `app`**

- **3.1** : page `/contact-requests` (onglets Reçues/Envoyées), bouton « Contacter » sur une carte de
  membre découvrable, bascule `discoverable` sur la fiche membre (propriétaire/éditeur), extension de
  `/explore/members` pour inclure les résultats découvrables privés (carte réduite, sans nom d'arbre
  ni photo, sans lien de navigation).
- **3.2** : panneaux liste sur la page de l'arbre (« Connexions » et « Demandes de connexion »),
  miroir des panneaux legacy mais sans le graphe.
- **3.3** : intégration dans `/tree/[id]/graph` — marqueur « pont » sur un membre lié, action pour
  charger/fusionner la branche étrangère dans le canevas déjà rendu (le point le plus délicat du
  module, à détailler précisément dans un plan de 14 points **dédié à 3.3 seul**, une fois 3.1 et 3.2
  faits et le code réel du graphe revu de près).

## 3. Sens des dépendances

- Pages et actions, puis conteneur, puis cas d'usage, puis entités — comme partout ailleurs.
- 3.3 dépend du graphe déjà construit (1.2/1.3) et des liaisons de 3.2 ; 3.1 et 3.2 sont
  indépendants l'un de l'autre.
- `GetSuggestionsUseCase` (3.2) réutilise `readableTree`/`tree-read-access.ts` pour vérifier l'accès
  du lecteur à l'arbre cible (décision 3), jamais une vérification dupliquée.

## 4. Base de données

- Tables existantes `CrossTreeSuggestion`, `CrossTreeConnectionRequest`, `CrossTreeLink`,
  `ContactRequest`, colonne `Member.discoverable`. **Aucune migration** — confirmé identique au
  schéma legacy, champ par champ (voir recherche).
- Les bugs 5, 6 et 7 ne peuvent être fermés qu'en partie ou pas du tout, précisément parce que le
  schéma est figé (décisions 4, 6, 9).

## 5. Fichiers

*(Détail complet à produire pour 3.1 en premier — cette section reste au niveau des grandes lignes
tant que 3.1 n'est pas confirmé ; le même exercice sera refait avant 3.2 et avant 3.3, comme pour
2.6a/2.6b.)*

**3.1 — à créer** : `core/entities/contact-request.ts`, cas d'usage listés au point 2, ports
`contact-request-reader.ts`/`writer.ts`/`discoverable-member-directory.ts`, adaptateurs Prisma et
mémoire correspondants, `presentation/mappers/contact-request-view-models.ts`,
`presentation/mappers/discoverable-member-view-models.ts`, vues et formulaires (bouton contacter,
bascule découvrable, page `/contact-requests`), actions serveur, page(s) app.

**3.1 — à modifier** : `search-public-members.ts` ou son remplaçant (fusion public + découvrable),
`prisma-notification-reader.ts` (jointure `contactRequest`), `member-view-models.ts` (bascule
découvrable sur la fiche), `container.ts`, `unit-of-work.ts` et ses implémentations.

## 6. Checklist Clean Code par fichier

- **`member-matching.ts`** : fonctions pures, une par règle (nom, écart de naissance, confiance),
  testables sans I/O — c'est la pièce la plus « algorithme » de toute la phase, mérite d'être isolée
  proprement plutôt que noyée dans un cas d'usage.
- **Cas d'usage de lecture filtrée** (`GetSuggestionsUseCase`) : le filtrage par accès du lecteur
  (décision 3) est une seule fonction claire, pas un `if` noyé dans une boucle.
- **Entités de résolution** (`ContactRequest`, `CrossTreeSuggestion`, `CrossTreeConnectionRequest`) :
  même forme que `Invitation`/`PendingChange` — `Result` en retour, jamais d'exception pour un refus
  métier attendu.
- **Adaptateurs** : `server-only`, aucune logique métier, upsert explicite documenté par un
  `// reason:` (décision 4), comme `prisma-invitation-writer.ts`.
- **Tous les fichiers** : moins de 200 lignes, 120 colonnes au plus.

## 7. Stratégie de test

**3.1**

- `contact-request.test.ts` : envoi, upsert d'une ligne `REFUSED`/`WITHDRAWN` (corrige le bug 5),
  refus si `PENDING`/`ACCEPTED` existe déjà, réponse/retrait, `AlreadyResolved`.
- `search-discoverable-members.test.ts` : fusion public + privé découvrable, un seul total correct
  (corrige le bug 11), arbres `SHARED` inclus (corrige le bug 10), arbres archivés exclus (corrige le
  bug 1), résumé réduit sans nom d'arbre ni photo pour un résultat privé.
- Intégration : email du contact renvoyé seulement une fois `ACCEPTED` (corrige le bug 8, à vérifier
  contre une vraie requête Prisma, pas seulement en mémoire) ; notification `CONTACT_REQUEST_*`
  lisible avec son nom et son arbre une fois la jointure du lecteur étendue.
- E2E : un visiteur découvre un membre privé découvrable, envoie une demande ; le propriétaire la
  voit, l'accepte ; les deux emails apparaissent seulement à ce moment-là.

**3.2**

- `member-matching.test.ts` : chaque règle de confiance isolément, y compris les cas limites (écart
  de naissance exactement 5 ans, noms différents).
- `compute-suggestions.test.ts` : upsert d'une ligne `REJECTED` (corrige le bug 5), aucun arbre
  archivé dans le bassin (corrige le bug 1), atomique (corrige le bug 2).
- `get-suggestions.test.ts` : un lecteur sans accès à l'arbre cible ne voit pas la suggestion même
  s'il est éditeur de l'arbre source (corrige le bug 3 — le test le plus important de ce module).
- `approve-connection-request.test.ts` : refuse une demande expirée même sans passage préalable par
  la liste (corrige le bug 4 au niveau du domaine).

**3.3** : stratégie détaillée à produire avec le plan dédié, une fois le code du graphe (1.2/1.3)
revu de près.

## 8. Impact de version

- 3.1 : `feat(contact-requests): discoverable search and contact requests`, probable `0.1.17`.
- 3.2 : `feat(cross-tree): suggestions and connection requests`, `0.1.18`.
- 3.3 : `feat(cross-tree): foreign branch in the graph`, `0.1.19`.
- Rien de cassant, aucune migration.

## 9. Accessibilité

- Panneaux de suggestions/demandes : chaque carte de correspondance avec un titre de niveau
  approprié, confiance annoncée en texte (jamais une couleur seule), boutons nommés complètement
  (« Accepter la correspondance avec Awa Diallo »).
- Page `/contact-requests` : deux onglets clairement annoncés, statut en texte, email révélé dans un
  lien `mailto:` explicite seulement quand pertinent (décision 8).
- Carte de membre découvrable dans la recherche : indique explicitement « Arbre privé » en texte,
  jamais seulement une icône.
- Bascule `discoverable` : `role` et libellé clairs, description de ce que ça change à proximité
  immédiate (pas seulement une infobulle).

## 10. Design et UX

- Réutilisation des mêmes briques que les modules précédents (`Button`, `StatusMessage`,
  `FormErrorSummary`, cartes `rounded-lg border-earth-sand`).
- Badges de confiance (HIGH/MEDIUM/LOW) et de statut, même famille visuelle que les badges déjà en
  place.
- État vide explicite à chaque liste (aucune suggestion, aucune demande, aucun résultat découvrable).

## 11. Performance et SEO

- `/contact-requests`, panneaux de suggestions/demandes : `robots: { index: false }`.
- Recherche découvrable : une seule requête combinée avec un vrai total (corrige le bug 11), jamais
  deux pages indépendantes recollées à la main.
- 3.3 : le chargement d'une branche étrangère reste à la demande (un clic), jamais précalculé pour
  tout le graphe — comme le legacy.

## 12. Sécurité et robustesse

- **Autorisation** : recalcul/lecture de suggestion réservé à OWNER/EDITOR de l'arbre source (comme
  le legacy), mais avec le filtrage supplémentaire de la décision 3 ; approbation/refus de connexion
  réservés à OWNER de l'arbre cible ; `contact-requests` réservé au propriétaire (réponse) ou au
  demandeur (retrait), vérifié dans chaque cas d'usage, jamais seulement au niveau de la route.
- **Entrées** : `discoverable` revérifié à l'envoi d'une demande de contact (comme le legacy) ; arbre
  archivé désormais aussi vérifié (corrige le bug 9).
- **Exposition de données** : email resserré côté serveur (décision 8, corrige un vrai bug de
  confidentialité) ; résumé de membre découvrable réduit, sans nom d'arbre ni photo, sans lien de
  navigation vers une fiche qu'un visiteur non autorisé ne pourrait pas ouvrir de toute façon.
- **Débit** : `treeWriteByUser` couvre le calcul de suggestions et les écritures de connexion ;
  `publicSearchByIp` couvre la recherche découvrable (déjà en place pour sa moitié publique).
- **Divers** : CSRF selon l'ADR 0006 ; pas de nouvelle dépendance ; pas de nouvel email, donc pas de
  nouveau risque d'injection HTML (décision 7).
- **ADR probable** : une décision structurante sur le filtrage par accès du lecteur (décision 3, qui
  ferme une vraie fuite d'autorisation du legacy) mérite sans doute sa propre ADR, sur le modèle de
  l'ADR 0008 — à confirmer une fois 3.2 codé.

## 13. Conventions d'API

Sans objet pour 3.1/3.2 : Server Actions et pages. 3.3 pourrait avoir besoin d'un Route Handler pour
le chargement de la branche étrangère si elle doit être appelée depuis un composant client du graphe
sans rechargement de page complet (React Flow est déjà un îlot client) — à trancher précisément en
codant 3.3, une fois le mécanisme client du graphe existant relu de près.

## 14. Déploiement et exploitation

- Aucune nouvelle variable d'environnement.
- Aucune migration, health check inchangé.
- Le bug 6 (aucune notification pour une connexion approuvée/refusée) reste un écart connu et
  documenté, non un oubli — à rouvrir seulement si une migration devient possible.
