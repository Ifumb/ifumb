# ifumb — Migration vers Next.js

## Objectif du dépôt

Migrer **l'intégralité** de l'application ifumb (monorepo React/Vite + NestJS situé dans
`ifumb-legacy/`) vers **une application Next.js unique** dans `ifumb/`.

Absorption complète : le backend NestJS disparaît, il n'y a **pas** de BFF ni d'API NestJS
résiduelle. À terme, `ifumb-legacy/` est déprécié et un seul déploiement subsiste.

*Renommage du 2026-09-18 : ce dépôt s'appelait `ifumb-next` (dossier local et dépôt GitHub), le
legacy s'appelait `ifumb`. Les deux dépôts GitHub et dossiers locaux ont été renommés
(`ifumb-next`→`ifumb`, `ifumb`→`ifumb-legacy`) une fois la Phase 3 terminée — l'historique Git (et
les liens/commits antérieurs à cette date) garde les anciens noms.*

La migration se fait **module par module**, et **chaque module doit builder** avant de passer au
suivant (voir « Gate de build », qui est la règle centrale de ce document).

---

## Cartographie du dépôt

Depuis le 2026-09-16, le poste de travail a été réorganisé : tout vit sous un dossier parent
`ifumb-apps/` (`C:\Users\chermann-king\Development\ifumb-apps\`), qui est la racine réellement
ouverte dans l'éditeur — ce dépôt (`ifumb/`) n'en est qu'un sous-dossier.

```
ifumb-apps/                          # racine réelle du poste de travail
  ifumb-legacy/                      # SOURCE — legacy (React 18 + Vite / NestJS + Prisma). LECTURE SEULE.
    apps/web/                        #   frontend actuel
    apps/api/                        #   backend actuel (~14 modules, 13 controllers, ~56 handlers)
    apps/api/prisma/                 #   schema.prisma (~17 modèles) + 10 migrations
    packages/shared/                 #   types TS partagés (@ifumb/shared)
    docs/audit-migration-nextjs.md   # AUDIT — état des lieux + phasage (non normatif)
    CLAUDE.md                        #   contexte du legacy (contient des inexactitudes, voir plus bas)

  ifumb/                              # CIBLE — l'application Next.js. Tout le code neuf va ici. (ce dépôt)

  docs/
    nextjs-clean-architect/          # SKILL — SOURCE éditée par l'utilisateur. NORMATIF.
      SKILL.md                       #   contrat principal
      references/                    #   à lire paresseusement, selon le besoin du module en cours
      audit/assets/                  #   arbre projet de référence + templates de fichiers
```

Chemin absolu du skill : `C:\Users\chermann-king\Development\ifumb-apps\docs\nextjs-clean-architect\SKILL.md`
— soit `../docs/nextjs-clean-architect/` depuis la racine de ce dépôt.

**Aucune copie installée du skill n'est présente dans cet environnement** : pas de
`.claude/skills/nextjs-clean-architect/`, ni dans `ifumb/`, ni ailleurs sous `ifumb-apps/`
(vérifié le 2026-09-16). Tant qu'aucune copie n'est installée, `/nextjs-clean-architect` n'est pas
invocable comme slash command dans cette session — le skill se consulte en lisant directement
`docs/nextjs-clean-architect/SKILL.md` (et ses `references/` au besoin) et en suivant ses règles
manuellement. Si une copie installée est ajoutée plus tard (globale sous `~/.claude/skills/`, ou
projet sous `ifumb-apps/.claude/skills/` ou `ifumb/.claude/skills/`), rétablir la vérification
avant de démarrer un module :

```bash
diff -rq ../docs/nextjs-clean-architect .claude/skills/nextjs-clean-architect
```

Si elles divergent, c'est la source sous `docs/` qui gagne : resynchroniser la copie installée avant
d'écrire du code, et ouvrir une nouvelle session pour que le skill rechargé soit pris en compte.

---

## Hiérarchie des sources

1. **Le skill `nextjs-clean-architect` est normatif** (source : `../docs/nextjs-clean-architect/`,
   soit `ifumb-apps/docs/nextjs-clean-architect/` en absolu ; non invocable par `/nextjs-clean-architect`
   dans cet environnement faute de copie installée — se lit directement, voir « Cartographie »).
   Ses règles (dependency rule, SOLID, checklist Clean
   Code, stratégie de test, accessibilité, Conventional Commits, pnpm, spécificités Next.js 16,
   anti-patterns) s'appliquent à tout fichier écrit dans `ifumb/`. Le skill impose de
   **produire le plan d'architecture défini par `SKILL.md` (14 points, dont certains conditionnels) et d'obtenir la confirmation de l'utilisateur
   avant de générer du code** — pour chaque module migré, et aussi pour chaque fix ou chore.
   Ce document ne recopie pas ces règles : en cas de doute, c'est `SKILL.md` qui fait foi.
2. **`ifumb-legacy/docs/audit-migration-nextjs.md` est un état des lieux, explicitement non normatif**
   (il le dit dans son propre en-tête). Il fournit l'inventaire, l'ordre des modules, le phasage
   et les risques. Il ne dicte pas l'architecture cible.
3. **En cas de conflit, le skill l'emporte.** Conflit connu et déjà tranché : l'audit suggère
   d'appeler « Prisma directement » depuis les Server Actions ; le skill l'interdit. → Prisma
   n'est jamais importé hors de `src/infrastructure/persistence/prisma/`. Chaque agrégat a un
   port défini dans `src/core/use-cases/`, injecté via le conteneur DI.
4. **`ifumb-legacy/CLAUDE.md` décrit le legacy et contient des inexactitudes vérifiées** : il mentionne
   `pg_trgm` et `shadcn/ui`, or aucun des deux n'est réellement utilisé dans le code (recherche
   par simples filtres Prisma `contains`/`insensitive`, primitives Radix UI brutes). Ne pas s'y
   fier sans vérifier dans le code.

---

## Gate de build — règle centrale

**Un module n'est terminé que lorsque `ifumb/` build.** Depuis `ifumb/` :

```bash
pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm run audit && pnpm build
```

Les six commandes doivent passer, avec une couverture `src/core/**` ≥ 90 % et aucune vulnérabilité `high` ou `critical`. Avec Docker démarré, `pnpm test:integration` et `pnpm test:e2e` complètent le gate. S'y ajoute le **gate
de sortie du skill** (`SKILL.md`, étape 6), qui n'est pas recopié ici : checklist Clean Code
parcourue, stratégie de test respectée, test axe à 0 violation et passe clavier pour tout changement
d'UI, message de commit Conventional Commit dont le type correspond au changement réel.

Règles associées, sans exception :

- Le gate est exécuté **à la fin de chaque module**, pas en fin de phase.
- Tant que le gate est rouge, **on ne commence pas le module suivant** — on répare.
- **Un seul module en cours à la fois.** Pas de migration parallèle de deux modules.
- `pnpm lint` appelle ESLint directement (`eslint .`) : `next lint` n'existe plus en Next.js 16 et
  `next build` ne lint plus. Le lint n'est donc **pas** couvert par le build — il reste au gate.
- **Ne jamais annoncer « ça build » sans avoir lancé la commande.** Le rapport de fin de module
  colle la sortie réelle. Un échec est rapporté tel quel, jamais contourné par un `any`, un
  `@ts-ignore`, une règle ESLint désactivée ou un `ignoreBuildErrors` dans `next.config`.
- Ces scripts (`typecheck`, `lint`, `test`, `audit`, `build`, `test:integration`, `test:e2e`) existent
  dans `ifumb/package.json` : les supprimer ou les vider revient à contourner le gate.

---

## Ordre de migration

Repris de l'audit (§6 et §7). Chaque ligne = un passage complet du cycle *plan → confirmation →
code → tests → gate de build → rapport*.

| Phase | Module(s) | Cible | Complexité |
|---|---|---|---|
| 0 | Bootstrap + `packages/shared` + `auth`/`users` + pilote `trees` (lecture) | App Router, Auth.js v5, `src/proxy.ts`, conteneur DI | Élevée — structurant |
| 1 | **Lecture seule** : `members`, `unions`, `graph` (+ parenté, ancêtres communs), explore | Server Components ; `reactflow` en Client Component | Moyenne |
| 2 | **Écritures et collaboration**, dans cet ordre : `audit-log` → mutations OWNER (arbres, membres, unions, claim) → `pending-changes` (mutations EDITOR) → `invitations`, `notifications` | Server Actions + Route Handler pour le lien d'invitation public | Élevée |
| 3 | `cross-tree` (suggestions + branch), `contact-requests` | Server Actions | Élevée — logique la plus dense |
| 4 | Cutover | Dépréciation de `ifumb-legacy/apps/*`, déploiement unique | — |
| — | `mail` (Resend) | Module serveur partagé, réutilisé tel quel | Faible |

L'auth est traitée en Phase 0 parce qu'elle est structurante pour tout le reste — et parce que
le modèle actuel (JWT en `localStorage`) est une faille à corriger, pas à porter.

### Découpage de la Phase 0 et état

| Module | Contenu | État |
|---|---|---|
| 0.1 | Bootstrap | fait — `5d875a1` |
| 0.2 | Auth + users | fait — `e167c4b` |
| 0.2b | Mise en conformité avec la v3 du skill (Node 22.12 + Vitest 5, en-têtes de sécurité, rate limiting, résilience, `pnpm audit`, SEO, pool Prisma, health check, ADR) | fait — `edacc3e` |
| 0.3 | Arbres en lecture (pilote `trees`) | fait — `52df08c` |

**Phase 0 terminée.** Points reportés :

- ~~porter `GET /trees/explore`~~ — résolu en 1.4 ;
- ~~ajouter l'action « Créer un arbre » à l'état vide du dashboard~~ — résolu en 2.2 ;
- ~~navigation « Compte » sur `/tree/[id]`~~ — résolu en 1.1 (`layout.tsx` de la route) ;
- ~~préchargement de la page courante par « Mes arbres »~~ — résolu en 1.1 (`NavLinks`,
  `prefetch={false}`). Les logs « destination stream closed early » restants viennent d'autres
  préchargements coupés en fin de test E2E, sans impact fonctionnel.

### Découpage de la Phase 1 et état

| Module | Contenu | État |
|---|---|---|
| 1.1 | Membres et unions en lecture : liste + recherche sur la page d'arbre, fiche membre avec relations, nav compte, ADR 0005 | fait — `c210d67` |
| 1.2 | Graphe en lecture : `/tree/[id]/graph`, dagre côté serveur, React Flow en îlot client, centrage, filtres, marqueurs d'attente (OWNER/EDITOR seulement), photos via `next/image` | fait — `0dfa9bd` |
| 1.3 | Descendance (pivot), chemin de parenté, ancêtres communs : modes du graphe pilotés par l'URL, calculs purs dans `core`, corrections des libellés legacy (conjoints, alliance, degrés) | fait — `8f60b18` |
| 1.4 | Explorer (`/explore`) et recherche de membres publics (`/explore/members`) : ports de lecture dédiés, pagination, limitation par IP, corrections des bugs legacy (filtres combinés, facettes, pagination, arbres archivés) | fait — `8ca684a` |

Points ouverts : pooler Supabase (6543) toujours non vérifié en conditions réelles ; la famille
entière est chargée à chaque requête (acceptable en lecture, à revoir si les arbres grossissent) ;
visites guidées driver.js du legacy non portées (elles montrent surtout des actions d'écriture —
module à placer après la Phase 2). Branches étrangères du graphe et membres « découvrables »
d'arbres privés, reportés à la Phase 3 ici : faits (modules 3.3 et 3.1 respectivement).

**Phase 1 terminée.**

### Découpage de la Phase 2 et état

| Module | Contenu | État |
|---|---|---|
| 2.1 | Journal de l'arbre en lecture (`/tree/[id]/history`, contributeurs), pagination par clé, diffs legacy affichés honnêtement | fait — `d042474` |
| 2.2 | Arbres en écriture (OWNER) : création, modification, audit dans la même transaction (UnitOfWork), garde `BUSINESS_WRITES_ENABLED`, ADR 0006 (CSRF) | fait — `751b501` |
| 2.3 | Membres en écriture (OWNER ; édition par le compte qui a revendiqué la fiche), validation des dates partielles, suppression d'un enfant d'union | fait — `b850093` |
| 2.4 | Unions en écriture (OWNER) : page d'union, parents modifiables, enfants liés/retirés, refus des cycles, nœuds du graphe cliquables | fait — `58fafde` |
| 2.5 | Photos des membres : envoi côté serveur (clé de service), ré-encodage `sharp` sans métadonnées, retrait, suppression avec le membre, ADR 0007 | fait — `9c6221e` |
| 2.6a | Modifications en attente — propositions : membres et unions, notification, email throttlé, page `/tree/[id]/pending` en lecture | fait — `dc551af` |
| 2.6b | Modifications en attente — revue : approbation/rejet, application atomique, détection de péremption | fait — `d56b1c9` |
| 2.7 | Notifications (liste, lu, tout lu, compteur temps réel) | fait — `dd5a2ff` |
| 2.8 | Invitations (email, lien public par jeton, accepter/refuser/révoquer, rôle) + action « c'est moi » (claim, reportée de 2.3 ; `claimedByUserId` unique globalement) | fait — `da7f252` |

Reportés en Phase 3 : réglage « découvrable » d'un membre (avec `contact-requests`), visites guidées.

### Plan détaillé du reste de la migration (pour reprise par un autre développeur)

Ce qui suit permet de reprendre la migration sans avoir participé aux sessions précédentes. Le
cycle de travail à suivre pour chaque module est celui décrit plus bas (« Cycle de travail par
module ») : lire le legacy, vérifier l'emplacement du skill (voir « Cartographie »), produire le plan des 14 points,
**attendre confirmation avant de coder**, gate de build à la fin, commit local, rapport.

**Le projet Supabase de staging (ADR 0005) n'existe pas** (confirmé par l'utilisateur le
2026-09-16). Sans lui, seules les commandes automatisées (tests unitaires, intégration, E2E — elles
utilisent une base Postgres locale via Docker, jamais Supabase) peuvent tourner ; aucun essai manuel
de `pnpm dev` avec des écritures réelles n'est possible. Les modules 2.6a et 2.6b ont été menés
entièrement sur la base Docker jetable, gate complet y compris `test:integration`/`test:e2e`.

**Flake E2E « document-title » constaté en testant 2.6b, corrigé en 2.7** : sous `pnpm test:e2e`
(parallélisme par défaut hors CI), `expectNoAccessibilityViolations` échouait occasionnellement
avec « Document does not have a non-empty `<title>` element » sur une page atteinte par navigation
cliente (`Link` suivi immédiatement d'un contrôle axe) — le contenu (et son titre `<h1>`) peut
s'afficher un tick avant que l'App Router commite le nouveau `<title>`. Corrigé dans
`tests/e2e/support/fixtures.ts` : `expectNoAccessibilityViolations` attend désormais
`page.title()` non vide avant de lancer axe. Confirmé par deux runs complets en parallélisme par
défaut sans réapparition.

Convention de version constatée jusqu'ici (SemVer mineure en 0.x par `feat`) :
0.1.8→2.1, 0.1.9→2.2, 0.1.10→2.3, 0.1.11→2.4, 0.1.12→2.5, 0.1.13→2.6a, 0.1.14→2.6b, 0.1.15→2.7,
0.1.16→2.8, 0.1.17→3.1 (déduit automatiquement par release-please au commit — ne pas modifier
`package.json` à la main).

#### Module 2.6a — Modifications en attente : propositions (fait — `dc551af`)

Plan complet des 14 points :
[`ifumb/docs/plans/2.6-modifications-en-attente.md`](ifumb/docs/plans/2.6-modifications-en-attente.md).
Les formulaires membre et union (2.3/2.4) distinguent désormais *appliquer* (OWNER, ou compte ayant
revendiqué la fiche) de *proposer* (EDITOR) via `writeMode()`
(`src/core/entities/contribution-access.ts`), au lieu de refuser l'éditeur avec
`*_MANAGEMENT_FORBIDDEN`. Une proposition (`PendingChange`, `src/core/entities/pending-change.ts`)
enregistre un JSON avant/après aux mêmes clés que le modèle legacy, notifie le propriétaire et lui
envoie un email throttlé à 1/h/arbre (`TreeWriter.claimPendingAlertSlot`, écriture conditionnelle).
Page `/tree/[id]/pending` en lecture (le propriétaire voit tout, un éditeur ses propres
propositions). Détail dans le message du commit.

**Deux bugs trouvés en lançant le gate complet (Docker), pas dans le plan initial** — utiles pour
2.6b et au-delà : (1) un getter/`Object.assign` est nécessaire dès qu'une dépendance partagée
(comme le mailer, qui lit `RESEND_API_KEY`) est aussi consommée par des cas d'usage de lecture — un
spread (`{ ...deps, x }`) lit un getter immédiatement et casse sa paresse ; (2) une page peut avoir
son propre garde-fou d'accès, séparé et plus strict que le cas d'usage qu'elle appelle — vérifier
les deux avant de conclure qu'un rôle est bien géré bout en bout.

**Reporté à 2.6b** (hors gate, noté explicitement dans le rapport de 2.6a) : lien « N modifications
en attente » sur la page de l'arbre, bannière « sera proposé » avant soumission sur les formulaires,
test d'intégration dédié à la règle « une proposition par (auteur, cible) » (codée et couverte
indirectement par les tests d'écriture, jamais vérifiée isolément contre Postgres).

#### Module 2.6b — Modifications en attente : revue (fait — `d56b1c9`)

Le propriétaire approuve ou rejette (un par un, ou en lot), avec un commentaire facultatif au rejet.
`pending-change-application.ts` reparse le JSON de la proposition en `MemberDetailsInput`/
`UnionDetailsInput` (tolérant, jamais de clé inconnue écrite) et le fait passer par les mêmes
fonctions d'entité qu'une écriture directe — jamais appliqué brut. `proposal-staleness.isOutdated`
détecte une proposition devenue caduque. `ApprovePendingChangeUseCase`/`RejectPendingChangeUseCase`
écrivent l'application, le statut, le journal et la notification dans une seule transaction ;
`ReviewAllPendingChangesUseCase` compose les deux, une transaction par proposition (une erreur de
domaine sur l'une n'annule jamais les autres). Détail complet, y compris quel bug legacy chaque
décision ferme : ADR `0008-revue-des-propositions-editeur.md` et le message du commit.

**Un vrai bug d'accessibilité trouvé en testant, pas dans le plan** : le message de confirmation
d'une action par proposition (Approuver/Rejeter) ne survivait pas à la disparition de cette
proposition de la liste, puisqu'elle n'est plus « en attente » après l'action — le message
disparaissait avec elle avant d'être annoncé. Corrigé en redirigeant vers la liste avec le résultat
porté par un paramètre d'URL (`review=approved|rejected`), lu et affiché par la page elle-même, dans
une zone qui survit au changement de contenu.

**Reporté, hors gate** : lien de navigation « N modifications en attente » depuis la page de
l'arbre (la page `/pending` n'est atteignable que par URL directe).

#### Module 2.7 — Notifications (fait — `dd5a2ff`)

Liste (`/notifications`, dans le groupe de routes `(app)` pour hériter d'`AccountNav`), marquer
comme lue (par élément, action serveur sans confirmation), tout marquer comme lu
(`MarkAllNotificationsReadUseCase`), compteur non lu dans `AccountNav` via `NotificationBadge`.
**Temps réel choisi explicitement par l'utilisateur** (pas seulement un rafraîchissement à la
navigation) : sondage client toutes les 15 s sur `GET /api/notifications/unread-count`
(`Cache-Control: no-store`, jamais mis en cache), limité par une nouvelle politique
`notificationPollByUser` (20/min). SSE/WebSockets écartés : ADR 0004 diffère le choix de
l'hébergement à la bascule, le code doit rester compatible auto-hébergé et serverless.

`NotificationReader` (nouveau port, `listForUser`/`unreadCountFor`) séparé de `NotificationWriter`
(étendu de `record` à `markRead`/`markAllRead`) ; `GetUnreadNotificationCountUseCase` séparé de
`GetNotificationsUseCase` pour que le sondage ne charge jamais les lignes enrichies qu'il jetterait.
`UnitOfWorkContext.notifications` volontairement réduit à `Pick<NotificationWriter, 'record'>` —
marquer comme lu ne doit jamais être transactionnel. `NotificationType` élargi aux 5 valeurs Prisma
(les deux `CONTACT_REQUEST_*` restent inatteignables jusqu'à `contact-requests`, Phase 3, mais le
côté lecture doit déjà les tolérer). Message volontairement simplifié par rapport au legacy : une
ligne (qui + type + arbre), sans détail champ par champ (qui reste à un clic, sur `/pending`).

**Un vrai bug d'accessibilité trouvé en testant, pas dans le plan** (même famille que celui de
2.6b, mécanisme différent) : le bouton « Tout marquer comme lu » démonte tout son formulaire — et
donc son message de confirmation — dès que `unreadCount` retombe à 0, ce que l'action elle-même
provoque via `revalidatePath`. Corrigé en gardant le formulaire toujours monté (seul le bouton se
cache une fois qu'il n'y a plus rien à marquer), à l'image de la convention déjà en place sur
`NotificationBadge`.

Legacy de référence : `ifumb-legacy/apps/api/src/notifications/` (`create`, `createForContactRequest`,
`findForUser`), `ifumb-legacy/apps/web/src/hooks/useNotifications.ts`.

#### Module 2.8 — Invitations + action « c'est moi » (fait — `da7f252`)

Plan complet des 14 points :
[`ifumb/docs/plans/2.8-invitations-et-claim.md`](ifumb/docs/plans/2.8-invitations-et-claim.md).
Cycle de vie complet d'une invitation (`core/entities/invitation.ts` : `send`/`resolve`/
`changeRole`, même vocabulaire que `PendingChange.resolve` du module 2.6b) : le propriétaire invite
par email + rôle, l'invité accepte ou rejette (email du compte revérifié contre celui de
l'invitation), le propriétaire change un rôle ou révoque. Page `/tree/[id]/collaborators`
(propriétaire seulement, lien depuis `/tree/[id]/settings`), page publique
`/invitations/accept?token=…`. Action « c'est moi » (`ClaimMemberUseCase`) : bouton sur la fiche
membre, ouvert à tout visiteur qui peut lire l'arbre (pas seulement un éditeur), comme le legacy.

**Trois vrais bugs legacy corrigés, trouvés en lisant le code avant de coder** (pas en testant,
cette fois) :
1. Ré-inviter un email après un rejet plantait (`@@unique([treeId, email])` jamais géré par un
   upsert) — `sendInvitation` est maintenant un upsert sur `(treeId, email)`, refusé seulement si la
   ligne existante est déjà `ACCEPTED` (`ALREADY_COLLABORATOR`).
2. `claim` vérifiait l'unicité par arbre alors que `Member.claimedByUserId` est **unique
   globalement** en base — un deuxième claim dans un autre arbre aurait fait remonter une erreur SQL
   brute. `MemberClaimReader` (nouveau port, lecture globale) referme ça proprement
   (`ALREADY_CLAIMED_ELSEWHERE`), vérifié par un test d'intégration qui provoque volontairement la
   vraie contrainte `@unique` pour documenter pourquoi la vérification doit être globale.
3. Email d'invitation vulnérable à l'injection HTML (même famille que le bug 8 du module 2.6) —
   `mail/invitation-email.ts` échappe tout, sur le modèle de `pending-change-alert-email.ts`.

**Décisions structurantes** : révoquer un collaborateur accepté rejette aussi ses propositions en
attente sur cet arbre dans la même transaction (`PendingChangeWriter.rejectAllByAuthor`, porté du
legacy `rejectAllByUser`, silencieux — pas de notification). Pas d'écran dédié « à qui êtes-vous ? »
après acceptation (réduction de périmètre validée) : l'invité est redirigé sur l'arbre et revendique
sa fiche depuis la page membre. Ajout généraliste d'une redirection après connexion/inscription
(`?redirect=…`, absente jusqu'ici côté `ifumb`), avec `safeRedirectTarget` qui rejette tout ce
qui n'est pas un chemin relatif interne (`presentation/security/safe-redirect.ts`) — sans ça,
`redirect()` suivrait aveuglément n'importe quelle URL passée en paramètre.

**Piège trouvé en lançant le gate (pas en écrivant le code)** : `SendInvitationUseCase` accédait à
`this.deps.mailer` directement, hors `try/catch` — comme `mailer` est un getter paresseux
(`container.ts`), l'accéder plante immédiatement si `RESEND_API_KEY` est absent (E2E), avant même
d'atteindre l'appel réseau. Corrigé en encapsulant tout l'envoi dans un bloc `try/catch` « au mieux »
identique à celui de `proposal-recording.ts` (module 2.6) — leçon à revérifier sur tout futur
mailer paresseux du même genre.

#### Phase 3 — cross-tree et contact-requests

Plan complet des 14 points (les trois sous-modules) :
[`ifumb/docs/plans/3-cross-tree-et-contact-requests.md`](ifumb/docs/plans/3-cross-tree-et-contact-requests.md).
Découpée en trois livraisons, la phase étant « la logique la plus dense » du projet :

| Module | Contenu | État |
|---|---|---|
| 3.1 | Recherche découvrable + `contact-requests` : réglage `discoverable`, recherche globale complète (publique + privée découvrable), envoi/réponse/retrait d'une demande de contact, notifications | fait — `83057b3` |
| 3.2 | Suggestions et demandes de connexion inter-arbres (pages liste, sans le graphe) | fait — `3e8580e` |
| 3.3 | Branche étrangère intégrée dans le graphe (dépend de 3.2, touche le plus lourdement 1.2/1.3) | fait — `d3b5fe2` |

##### Module 3.1 — Recherche découvrable + contact-requests (fait — `83057b3`)

`Member.discoverable` sort désormais du même isolement que `claimedById` dans l'entité (jamais dans
`MemberDetailsInput`/`revise()` — un réglage de confidentialité, pas un fait généalogique) ; bascule
immédiate par `ToggleMemberDiscoverableUseCase`, réservée au propriétaire ou au compte qui a
revendiqué la fiche, jamais proposée à un éditeur. `/explore/members` gagne une deuxième section,
paginée indépendamment de la section publique (chacune avec son propre total honnête — corrige le
bug où le legacy renvoyait la taille de page comme total). `core/entities/contact-request.ts` :
cycle de vie `send`/`respond`/`withdraw`, même vocabulaire que `Invitation`/`PendingChange`. Page
`/contact-requests` (Reçues/Envoyées).

**Trois vrais bugs legacy corrigés en lisant le code avant de coder** (même discipline qu'aux
modules 2.6/2.8) :
1. aucun filtre `archivedAt` sur la recherche découvrable ni sur le bassin de correspondance —
   fermé pour ce module (module 3.2 devra faire de même pour les suggestions) ;
2. un contact refusé ou retiré bloquait la paire (demandeur, membre) pour toujours
   (`@@unique([requesterId, memberId])`, schéma déjà déployé) — fermé par un upsert dans
   `ContactRequestWriter.send`, même leçon qu'au module 2.8 ;
3. l'email du demandeur et celui du propriétaire étaient renvoyés par l'API à **tout** statut, alors
   que l'interface ne les affichait qu'une fois la demande acceptée — filtrage purement côté client
   dans le legacy, resserré ici côté serveur (`PrismaContactRequestReader`, jamais l'email hors
   `ACCEPTED`), vérifié par un test d'intégration dédié.

Arbres `SHARED` traités comme `PRIVATE` dans la recherche découvrable (fermé l'incohérence du
legacy, qui les excluait ici mais pas du bassin de suggestions cross-tree). Pas de notification pour
l'approbation/le refus d'une connexion inter-arbres : ça reste un écart documenté pour le module
3.2, `NotificationType` (schéma déjà déployé) n'ayant aucune valeur pour cet événement.

Reportés ici depuis les phases précédentes (à ne pas oublier pour 3.2/3.3) :
- visites guidées `driver.js` (montrent surtout des actions d'écriture, d'où le report après la
  Phase 2) ;
- branches étrangères du graphe (nœuds d'un autre arbre liés par `cross-tree`) → module 3.3.

##### Module 3.2 — Suggestions et demandes de connexion inter-arbres (fait — `3e8580e`)

Plan complet des 14 points :
[`ifumb/docs/plans/3.2-suggestions-et-connexions-inter-arbres.md`](ifumb/docs/plans/3.2-suggestions-et-connexions-inter-arbres.md).
`core/entities/member-matching.ts` porte l'algorithme de correspondance du legacy (`scoreMatch`) en
fonction pure et testable isolément : nom de famille identique obligatoire, écart de naissance > 5
ans disqualifie (si les deux sont connus), prénom identique + (tribu partagée OU année identique) →
`HIGH`, prénom identique seul → `MEDIUM`, sous-chaîne de prénom → `LOW`. Trois entités complètent le
cycle : `CrossTreeSuggestion` (`propose`/`accept`/`reject`), `CrossTreeConnectionRequest`
(`open`/`approve`/`refuse`, revérifie elle-même son expiration) et `CrossTreeLink` (simple).
`NEW → ACCEPTED` (ouvre une demande de connexion, 30 jours) ou `REJECTED` ; `PENDING → APPROVED`
(établit le lien) ou `REFUSED`. Nouvelles pages `/tree/[id]/suggestions`, `/tree/[id]/
connection-requests`, `/tree/[id]/links`, liées depuis la page de l'arbre selon le rôle
(contributeur, propriétaire, tout lecteur).

**Correction en cours de route, avant le premier test d'intégration** : la règle « ne jamais
toucher une suggestion déjà `ACCEPTED` lors d'un recalcul » vivait d'abord côté writer Prisma
(`updateMany` conditionnel + lecture de désambiguïsation). En écrivant les tests unitaires de
`ComputeSuggestionsUseCase`, ce design s'est révélé incompatible avec le pattern déjà établi
(`SendInvitationUseCase` module 2.8, `SendContactRequestUseCase` module 3.1) où c'est toujours le
**cas d'usage** qui lit l'état existant et décide, jamais le writer. Corrigé :
`CrossTreeSuggestionReader.listAcceptedPairsForTree` renvoie les paires déjà acceptées,
`ComputeSuggestionsUseCase` filtre avant d'écrire, `PrismaCrossTreeSuggestionWriter.upsertMany` est
redevenu un upsert inconditionnel — testé aux deux niveaux (unitaire avec un double en mémoire,
intégration contre Postgres réel) que le recalcul ne touche jamais une paire acceptée.

**Quatre bugs legacy fermés** (numérotation reprise du document de constats commun à la Phase 3) :
1. fuite d'autorisation (bug 3) : le bassin de calcul dépend de qui lance le calcul, mais le legacy
   servait ensuite la suggestion stockée à tout propriétaire/éditeur de l'arbre source, même sans
   accès personnel à l'arbre cible — fermé en filtrant à la lecture dans `GetSuggestionsUseCase`
   (accès du lecteur courant à l'arbre cible, `readableTree` réutilisé), vérifié en unitaire **et**
   en E2E (un éditeur du même arbre source qu'un autre éditeur ayant accès à l'arbre cible ne voit
   pas sa suggestion) ;
2. rejet permanent d'une suggestion (bug 5) : `@@unique([memberId, targetMemberId])` sans dimension
   statut — fermé par l'upsert décrit ci-dessus ;
3. expiration d'une demande de connexion jamais revérifiée à l'approbation/au refus (bug 4),
   seulement au balayage paresseux de la liste : `CrossTreeConnectionRequest.approve`/`refuse`
   revérifie désormais `expiresAt` elle-même, sans tâche planifiée (ADR 0004) ;
4. aucun filtre sur les arbres archivés dans le bassin de candidats (bug 1), même famille que 1.4 et
   3.1.

Écarts documentés, non fermés : aucune notification pour l'approbation/le refus d'une connexion
(bug 6, `NotificationType` n'a aucune valeur pour cet événement, schéma figé) ; références pendantes
à la suppression d'un membre (bug 7, `memberId`/`targetMemberId` ne sont pas des relations Prisma,
tolérées comme au module 3.1). Arbres `SHARED` inclus dans le bassin de calcul au même titre que
`PUBLIC`. Nouvelle politique de débit `computeSuggestionsByUser`, plus stricte que
`treeWriteByUser` (le calcul est O(n×m)). Branche étrangère dans le graphe toujours hors périmètre :
module 3.3.

Gate complet exécuté : typecheck, lint, test (866/866), audit, build, test:integration (124/124,
Docker), test:e2e (85/85).

##### Module 3.3 — Branche étrangère intégrée dans le graphe (fait — `d3b5fe2`)

Plan complet des 14 points :
[`ifumb/docs/plans/3.3-branche-etrangere-dans-le-graphe.md`](ifumb/docs/plans/3.3-branche-etrangere-dans-le-graphe.md).
Dernier sous-module de la Phase 3, qui est donc terminée dans son intégralité. `GetCrossTreeBranchUseCase`
charge la branche distante d'un `CrossTreeLink` : `otherSide()`/`ownSide()` (module 3.2) identifient
le membre pivot des deux côtés, `toFamilyGraph` (module 1.2) est réutilisé tel quel pour construire
le graphe de l'arbre distant, sans aucune modification de signature. Côté présentation,
`mergeForeignBranch` (fonction pure, testée isolément) fusionne ce graphe distant dans le graphe
local : le nœud pivot distant est retiré, ses arêtes réécrites vers l'id du membre-pont local, pour
que dagre pose la branche comme un seul graphe connexe au lieu d'un amas disjoint. Nouvelle route
`GET /api/tree/[id]/graph/branch` (session vérifiée, jamais cache, sur le modèle de
`/api/notifications/unread-count`) qui renvoie le graphe fusionné déjà mis en page côté serveur à
chaque bascule d'un bouton pont — le layout reste entièrement côté serveur (invariant déjà en place
depuis le module 1.2), aucune dépendance dagre ajoutée au client.

**Autorisation par lien** (fidèle au comportement legacy, volontaire) : `GetCrossTreeBranchUseCase`
n'applique jamais `readableTree` sur l'arbre distant, uniquement sur l'arbre local. Un `CrossTreeLink`
valide est la seule autorisation nécessaire pour voir sa branche, quelle que soit la visibilité
réelle de l'arbre distant (y compris `PRIVATE`) — testé en unitaire, en intégration contre un vrai
Postgres, et en E2E avec un arbre distant `PRIVATE` possédé par un compte totalement étranger.
Décisions suivies du plan : branche = arbre distant entier, pas de profondeur limitée ; aucun badge
« en attente » sur les nœuds distants, quel que soit le rôle réel du visiteur sur l'arbre distant ;
nœuds distants jamais cliquables (membre ni union), l'accès accordé restant scopé à cette seule vue ;
aucun bouton de branche sur un nœud lui-même distant (pas de chaînage récursif).

**Deux bugs trouvés en écrivant les tests, pas en codant** : un `<div aria-label>` sans rôle valide
sur un nœud-union distant violait `aria-prohibited-attr` (axe) — corrigé avec `role="img"` ; le
compteur « N membres affichés » ne comptait que les membres de l'arbre local, jamais ceux ajoutés par
une branche fusionnée — corrigé dans `toMergedFamilyGraphViewModel`.

Gate complet exécuté : typecheck, lint, test (878/878), audit, build, test:integration (127/127,
Docker), test:e2e (86/86).

#### Phase 4 — Cutover

En cours. Plan complet : [`ifumb/docs/plans/4-cutover.md`](ifumb/docs/plans/4-cutover.md).
Cible d'hébergement tranchée (décision utilisateur du 2026-09-17, résout l'ADR 0004) : **Vercel**.
Voir l'ADR 0009 pour le détail de chaque conséquence de ce choix (rate limiting, pool Prisma, IP
cliente, sondes de santé, CI, dépendances ajoutées).

**Partie code faite** (commit à suivre) : `UpstashRateLimiter` (nouveau, sélectionné dans
`container.ts` seulement si `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` sont définies —
`InMemoryRateLimiter` reste le défaut en dev/CI/tests) ; `PRISMA_POOL_MAX_CONNECTIONS` configurable
par variable d'environnement ; nouvelle sonde `GET /api/health/ready` (ping base) ; nouveau workflow
`smoke.yml` (déclenché sur `deployment_status`) ; commentaires et message d'erreur de
`business-writes.ts`/`client-ip.ts` mis à jour pour la cible Vercel ; `.env.example` complété.

**Restent, tous opérationnels** (voir le runbook du plan, aucun n'est du code) : créer/connecter le
projet Vercel, créer le compte Upstash, renseigner les variables d'environnement de production,
vérifier en réel la compatibilité du pooler Supabase en mode transaction avec `@prisma/adapter-pg`
(point ouvert depuis l'ADR 0003, jamais testé — le staging n'a jamais existé), basculer
`BUSINESS_WRITES_ENABLED` en deux temps, rediriger le trafic, arrêter le legacy.

**Renommage fait** (demande utilisateur du 2026-09-18, après le commit du code ci-dessus) : ce dépôt
(`Ifumb/ifumb-next` sur GitHub, `ifumb-next/` en local) est devenu `Ifumb/ifumb`/`ifumb/` ; le
legacy (`Ifumb/ifumb`, `ifumb/` en local) est devenu `Ifumb/ifumb-legacy`/`ifumb-legacy/`. Couvert :
les deux dépôts GitHub (`gh repo rename`), les remotes Git, les dossiers locaux, les `name` de
`package.json` (et `package-name` de `release-please-config.json` côté cible), le nom du conteneur
Docker de test (`ifumb-next-postgres-test` → `ifumb-postgres-test`), les références dans cette
documentation. Aucun risque de production connu côté hébergement legacy (confirmé par
l'utilisateur). Non touchés, volontairement : l'historique Git des deux dépôts (commits antérieurs
au 2026-09-18, qui gardent les anciens noms dans leur texte) et les décisions déjà actées des ADR/
plans antérieurs (`docs/adr/`, `docs/plans/`), qui restent des relevés au moment où ils ont été
écrits plutôt que d'être réécrits rétroactivement.

#### Rappels transverses pour la suite

- **Un seul module en cours à la fois**, gate de build vert avant de passer au suivant.
- Avant de démarrer un module : vérifier qu'il n'y a toujours qu'une source du skill
  (`ifumb-apps/docs/nextjs-clean-architect/`). Si une copie installée apparaît un jour sous
  `.claude/skills/`, revenir au `diff -rq` décrit dans « Cartographie » (la source sous `docs/`
  fait foi en cas d'écart).
- Commits locaux uniquement (`git commit`, jamais `push` ni `tag`) tant que l'utilisateur ne le
  demande pas explicitement.
- Chaque module de la Phase 2 a ajouté une ADR dans `ifumb/docs/adr/` quand la décision était
  structurante (0005 à 0007 à ce jour) ; continuer cette pratique plutôt que de disperser la
  justification dans les messages de commit uniquement.
- Mémoire de session : `ifumb-migration-progress.md` (projet Claude Code de cet utilisateur) retrace
  l'historique détaillé, les hash de commit et les conventions établies module par module — utile en
  complément de ce fichier si l'outil y donne accès.

### Pourquoi la Phase 1 est en lecture seule (décision utilisateur du 2026-09-13)

L'ordre de l'audit ne tenait pas : dans le legacy, **toute écriture** de membre ou d'union écrit
une entrée d'`audit-log` (OWNER) ou crée une `pending-change` (EDITOR), et le « claim » écrit aussi
dans l'audit-log. Porter ces écritures avant ces deux modules aurait donné une parité fausse et
laissé des trous dans l'historique lu par le legacy. La Phase 1 porte donc tout le côté lecture ;
la Phase 2 commence par l'audit-log, puis les écritures OWNER, puis les pending-changes.

Quand une nouvelle version du skill rend du code déjà commité non conforme, on ne l'ignore pas et
on ne la mélange pas au module suivant : un module de mise en conformité dédié passe d'abord.

### Dérogation actée : cible d'hébergement reportée au cutover

Le skill fait du déploiement Docker autonome (`output: 'standalone'`, `Dockerfile`, job `deploy`)
une exigence de toute migration. **Décision utilisateur du 2026-09-13 : la cible d'hébergement
(Docker autonome ou Vercel) est tranchée au cutover (Phase 4), pas avant.** Conséquences :

- `Dockerfile`, `.dockerignore` et le job `deploy` de release-please ne sont **pas** créés avant la
  Phase 4 ;
- tout ce qui ne dépend pas de la cible est fait dès 0.2b : `GET /api/health`, tests de smoke,
  en-têtes de sécurité, CI ;
- le code reste compatible avec les deux cibles : pas de dépendance à un système de fichiers local,
  et le rate limiting passe par un port, pour qu'un store partagé puisse remplacer l'in-memory si la
  cible est serverless ;
- la décision et ses conséquences sont consignées dans une ADR (`docs/adr/`) de `ifumb`.

---

## Points de vigilance

- **Auth** : le JWT en `localStorage` ne doit **pas** être reporté. Cible actée : Auth.js v5,
  provider Credentials, session en cookie httpOnly lue côté serveur. Credentials impose
  `strategy: 'jwt'` : la table `RefreshToken` n'est plus alimentée mais reste dans le schéma
  jusqu'au cutover.
- **Base de données** : la base Supabase existante est réutilisée. `schema.prisma` et les
  migrations sont copiés tels quels ; **jamais de `prisma migrate dev` sur cette base** (il la
  réinitialiserait). Toute nouvelle migration est additive et soumise à confirmation.
- **Écritures de développement** (décision utilisateur du 2026-09-13) : ifumb n'écrit **jamais**
  de données métier (arbres, membres, unions…) dans la base de production pendant la migration. Dès
  que les écritures arrivent (Phase 2), le développement et les essais manuels utilisent un **projet
  Supabase de staging** restauré depuis une sauvegarde de la production ; la production n'est
  touchée qu'au cutover. À consigner dans une ADR 0005 qui précise l'ADR 0001.
- **CSRF** : la protection actuelle repose uniquement sur `sameSite: strict`. À réévaluer
  explicitement pour toute Server Action / Route Handler de mutation.
- **Server Actions** : joignables par POST direct. Chacune re-vérifie authn **et** authz. Aucune
  confiance dans un champ de formulaire caché. Aucune logique métier — ce sont des contrôleurs
  fins qui appellent un use case.
- **Libs client-only** : `reactflow` en `dynamic(..., { ssr: false })`, `driver.js` et
  `@supabase/supabase-js` (navigateur) cantonnés à des Client Components. Un oubli casse le build
  ou le rendu serveur (`window`/`document` indisponibles).
- **Prisma / pooler** : conserver impérativement le pooler Supabase (pgbouncer, port 6543) si les
  fonctions tournent en serverless. Adapter `binaryTargets` à la cible de déploiement.
- **Dette de tests** : le legacy n'a quasi aucun test (1 spec Playwright pour tout le monorepo).
  Les tests s'écrivent **au fil de l'eau, module par module** — jamais reportés en fin de projet.
- **Env vars** : `VITE_*` → `NEXT_PUBLIC_*` pour ce qui est exposé au client, et séparation
  stricte d'avec les secrets serveur.
- **`tree.store` / `union.store`** : ils se chevauchent déjà dans le legacy. Clarifier la fusion
  avant de porter — ne pas dupliquer l'incohérence dans la nouvelle architecture.

---

## Cycle de travail par module

1. Lire le code source du module dans `ifumb-legacy/apps/api/src/<module>/` et ses consommateurs dans
   `ifumb-legacy/apps/web/src/`.
2. Vérifier l'emplacement du skill et, si une copie installée existe, qu'elle est identique à la
   source sous `docs/` (voir « Cartographie »).
3. Produire le **plan d'architecture** exigé par `SKILL.md` (14 points ; les points 9 à 14 ne
   s'appliquent que si le module touche l'UI, une route, une action sensible, une API externe ou
   le déploiement — le plan dit explicitement lesquels sont sans objet).
4. **Attendre la confirmation** de l'utilisateur. Ne pas générer de code avant.
5. Coder de l'intérieur vers l'extérieur : entities → use cases + ports → infrastructure → app/.
   Les tests des artefacts `core/` sont écrits **avant** leur implémentation (test-first) ; ceux
   des adapters et composants après.
6. **Passer le gate de build** et le gate de sortie du skill.
7. Rapporter selon `SKILL.md` étape 7 : fichiers, couverture, sortie réelle du gate, ligne
   checklist Clean Code par fichier, message de commit proposé et bump attendu, écarts justifiés.

---

## Commandes

```bash
# Cible — depuis ifumb/
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build          # gate de fin de module
pnpm test           # Vitest
pnpm test:e2e       # Playwright
```

```bash
# Legacy — depuis ifumb-legacy/, pour lecture ou comparaison de comportement uniquement
pnpm dev            # démarre l'ancien FE + BE en parallèle
```

Gestionnaire de paquets : **pnpm exclusivement** — jamais npm, yarn ni bun. `ifumb/` est
verrouillé sur `pnpm@12.3.4` (`packageManager` + `preinstall: npx only-allow pnpm`), Node >= 22.12
(plancher du skill : Node 20 est en fin de vie).
Le legacy reste sur `pnpm@10.31.0` : ne pas aligner l'un sur l'autre.

---

## Contraintes d'écriture

- `ifumb-legacy/` est en **lecture seule** jusqu'au cutover (Phase 4). Aucune modification du
  legacy pour faire avancer la migration — s'il faut un correctif, il va dans `ifumb/`.
- Tout le code neuf va dans `ifumb/`, selon l'arbre défini par le skill
  (`src/core/`, `src/infrastructure/`, `src/app/`, `src/presentation/`, `tests/`).
- **Conventional Commits dès le premier commit** de `ifumb/` (commitlint + hook Husky
  `commit-msg`). La version n'est jamais éditée à la main dans `package.json`.
- Langue : explications, plans et prose en **français**. Code, identifiants, chemins et
  commentaires en **anglais**.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
