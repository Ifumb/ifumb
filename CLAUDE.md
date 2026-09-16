# ifumb — Migration vers Next.js

## Objectif du dépôt

Migrer **l'intégralité** de l'application ifumb (monorepo React/Vite + NestJS situé dans `ifumb/`)
vers **une application Next.js unique** dans `ifumb-next/`.

Absorption complète : le backend NestJS disparaît, il n'y a **pas** de BFF ni d'API NestJS
résiduelle. À terme, `ifumb/` est déprécié et un seul déploiement subsiste.

La migration se fait **module par module**, et **chaque module doit builder** avant de passer au
suivant (voir « Gate de build », qui est la règle centrale de ce document).

---

## Cartographie du dépôt

Depuis le 2026-09-16, le poste de travail a été réorganisé : tout vit sous un dossier parent
`ifumb-apps/` (`C:\Users\chermann-king\Development\ifumb-apps\`), qui est la racine réellement
ouverte dans l'éditeur — ce dépôt (`ifumb-next/`) n'en est qu'un sous-dossier.

```
ifumb-apps/                          # racine réelle du poste de travail
  ifumb/                             # SOURCE — legacy (React 18 + Vite / NestJS + Prisma). LECTURE SEULE.
    apps/web/                        #   frontend actuel
    apps/api/                        #   backend actuel (~14 modules, 13 controllers, ~56 handlers)
    apps/api/prisma/                 #   schema.prisma (~17 modèles) + 10 migrations
    packages/shared/                 #   types TS partagés (@ifumb/shared)
    docs/audit-migration-nextjs.md   # AUDIT — état des lieux + phasage (non normatif)
    CLAUDE.md                        #   contexte du legacy (contient des inexactitudes, voir plus bas)

  ifumb-next/                        # CIBLE — l'application Next.js. Tout le code neuf va ici. (ce dépôt)

  docs/
    nextjs-clean-architect/          # SKILL — SOURCE éditée par l'utilisateur. NORMATIF.
      SKILL.md                       #   contrat principal
      references/                    #   à lire paresseusement, selon le besoin du module en cours
      audit/assets/                  #   arbre projet de référence + templates de fichiers
```

Chemin absolu du skill : `C:\Users\chermann-king\Development\ifumb-apps\docs\nextjs-clean-architect\SKILL.md`
— soit `../docs/nextjs-clean-architect/` depuis la racine de ce dépôt.

**Aucune copie installée du skill n'est présente dans cet environnement** : pas de
`.claude/skills/nextjs-clean-architect/`, ni dans `ifumb-next/`, ni ailleurs sous `ifumb-apps/`
(vérifié le 2026-09-16). Tant qu'aucune copie n'est installée, `/nextjs-clean-architect` n'est pas
invocable comme slash command dans cette session — le skill se consulte en lisant directement
`docs/nextjs-clean-architect/SKILL.md` (et ses `references/` au besoin) et en suivant ses règles
manuellement. Si une copie installée est ajoutée plus tard (globale sous `~/.claude/skills/`, ou
projet sous `ifumb-apps/.claude/skills/` ou `ifumb-next/.claude/skills/`), rétablir la vérification
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
   anti-patterns) s'appliquent à tout fichier écrit dans `ifumb-next/`. Le skill impose de
   **produire le plan d'architecture défini par `SKILL.md` (14 points, dont certains conditionnels) et d'obtenir la confirmation de l'utilisateur
   avant de générer du code** — pour chaque module migré, et aussi pour chaque fix ou chore.
   Ce document ne recopie pas ces règles : en cas de doute, c'est `SKILL.md` qui fait foi.
2. **`ifumb/docs/audit-migration-nextjs.md` est un état des lieux, explicitement non normatif**
   (il le dit dans son propre en-tête). Il fournit l'inventaire, l'ordre des modules, le phasage
   et les risques. Il ne dicte pas l'architecture cible.
3. **En cas de conflit, le skill l'emporte.** Conflit connu et déjà tranché : l'audit suggère
   d'appeler « Prisma directement » depuis les Server Actions ; le skill l'interdit. → Prisma
   n'est jamais importé hors de `src/infrastructure/persistence/prisma/`. Chaque agrégat a un
   port défini dans `src/core/use-cases/`, injecté via le conteneur DI.
4. **`ifumb/CLAUDE.md` décrit le legacy et contient des inexactitudes vérifiées** : il mentionne
   `pg_trgm` et `shadcn/ui`, or aucun des deux n'est réellement utilisé dans le code (recherche
   par simples filtres Prisma `contains`/`insensitive`, primitives Radix UI brutes). Ne pas s'y
   fier sans vérifier dans le code.

---

## Gate de build — règle centrale

**Un module n'est terminé que lorsque `ifumb-next/` build.** Depuis `ifumb-next/` :

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
  dans `ifumb-next/package.json` : les supprimer ou les vider revient à contourner le gate.

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
| 4 | Cutover | Dépréciation de `ifumb/apps/*`, déploiement unique | — |
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
module à placer après la Phase 2) ; branches étrangères du graphe → Phase 3 (`cross-tree`) ;
membres « découvrables » d'arbres privés dans la recherche → Phase 3 avec `contact-requests` (y
trancher le cas des arbres `SHARED`, exclus par le legacy).

**Phase 1 terminée.**

### Découpage de la Phase 2 et état

| Module | Contenu | État |
|---|---|---|
| 2.1 | Journal de l'arbre en lecture (`/tree/[id]/history`, contributeurs), pagination par clé, diffs legacy affichés honnêtement | fait — `d042474` |
| 2.2 | Arbres en écriture (OWNER) : création, modification, audit dans la même transaction (UnitOfWork), garde `BUSINESS_WRITES_ENABLED`, ADR 0006 (CSRF) | fait — `751b501` |
| 2.3 | Membres en écriture (OWNER ; édition par le compte qui a revendiqué la fiche), validation des dates partielles, suppression d'un enfant d'union | fait — `b850093` |
| 2.4 | Unions en écriture (OWNER) : page d'union, parents modifiables, enfants liés/retirés, refus des cycles, nœuds du graphe cliquables | fait — `58fafde` |
| 2.5 | Photos des membres : envoi côté serveur (clé de service), ré-encodage `sharp` sans métadonnées, retrait, suppression avec le membre, ADR 0007 | fait — `9c6221e` |
| 2.6 | Modifications en attente (propositions EDITOR, revue, application, notification) | à planifier |
| 2.7 | Notifications (liste, lu, tout lu) | — |
| 2.8 | Invitations (email, lien public par jeton, accepter/refuser/révoquer, rôle) + action « c'est moi » (claim, reportée de 2.3 ; `claimedByUserId` unique globalement) | — |

Reportés en Phase 3 : réglage « découvrable » d'un membre (avec `contact-requests`), visites guidées.

### Plan détaillé du reste de la migration (pour reprise par un autre développeur)

Ce qui suit permet de reprendre la migration sans avoir participé aux sessions précédentes. Le
cycle de travail à suivre pour chaque module est celui décrit plus bas (« Cycle de travail par
module ») : lire le legacy, vérifier l'emplacement du skill (voir « Cartographie »), produire le plan des 14 points,
**attendre confirmation avant de coder**, gate de build à la fin, commit local, rapport.

**Question ouverte non résolue, à poser avant tout essai manuel d'écriture** : le projet Supabase
de **staging** (ADR 0005) existe-t-il déjà ? Sans lui, seules les commandes automatisées (tests
unitaires, intégration, E2E — elles utilisent une base Postgres locale via Docker, jamais Supabase)
peuvent tourner ; aucun essai manuel de `pnpm dev` avec des écritures réelles n'est possible.

Convention de version constatée jusqu'ici (SemVer mineure en 0.x par `feat`) :
0.1.8→2.1, 0.1.9→2.2, 0.1.10→2.3, 0.1.11→2.4, 0.1.12→2.5. Donc 2.6a→0.1.13, 2.6b→0.1.14 si le
découpage ci-dessous est conservé.

#### Module 2.6 — Modifications en attente (EDITOR)

Plan complet des 14 points :
[`ifumb-next/docs/plans/2.6-modifications-en-attente.md`](ifumb-next/docs/plans/2.6-modifications-en-attente.md)
— **proposé, pas encore confirmé ni codé**. Legacy à relire avant de coder :
`ifumb/apps/api/src/pending-changes/` (service et contrôleur),
`ifumb/apps/api/src/notifications/notifications.service.ts`,
`ifumb/apps/api/src/mail/mail.service.ts` (méthode `sendPendingChangeAlert`), les branches
`if (treeRole === 'EDITOR')` dans `members.service.ts` et `unions.service.ts`, et le composant
`ifumb/apps/web/src/components/tree/PendingChangesPanel.tsx`.

Découpage recommandé en deux livraisons (le module est trop gros pour un seul commit) :

- **2.6a — Propositions.** Les formulaires membre et union existants (créer/modifier/supprimer),
  déjà écrits en 2.3 et 2.4, se mettent à distinguer *appliquer* (OWNER, ou compte ayant revendiqué
  la fiche) de *proposer* (EDITOR) au lieu de refuser l'EDITOR avec `*_MANAGEMENT_FORBIDDEN`. Une
  proposition enregistre un JSON avant/après **au format des clés du modèle `PendingChange` du
  legacy** (pour qu'une proposition créée avant le cutover reste lisible par l'app legacy tant que
  les deux coexistent), notifie le propriétaire (table `Notification`) et lui envoie un email
  (throttlé à 1/h/arbre via `Tree.pendingNotifLastSentAt`, réutilise le mailer Resend existant côté
  patron de `resend-password-reset-mailer.ts`). Page `/tree/[id]/pending` en lecture seule (liste
  des propositions, pour le propriétaire toutes, pour l'éditeur les siennes).
- **2.6b — Revue.** Le propriétaire approuve ou rejette (un par un ou en lot), avec commentaire.
  L'approbation **revalide** le JSON avec les mêmes règles de domaine que l'écriture directe (jamais
  d'écriture brute façon legacy — c'est le bug 1 ci-dessous), détecte les propositions devenues
  caduques (l'état courant ne correspond plus à l'« avant » enregistré), et applique dans une seule
  transaction avec le journal et la notification à l'auteur.

Bugs legacy identifiés à corriger dans ce module (numérotés dans le plan complet) :
1. Le JSON de la proposition est appliqué tel quel à Prisma (`...fields as never`) : aucune
   validation à l'approbation, une proposition peut porter des clés arbitraires.
2. Une approbation peut écraser silencieusement des changements faits entre-temps par le
   propriétaire (pas de détection de proposition caduque).
3. Deux éditeurs proposant sur la même cible : la seconde proposition écrase la première sans que
   l'auteur enregistré change.
4. Rien n'est atomique (proposition, journal, notification, statut en écritures séparées).
5. Suppression d'un membre enfant d'union via une proposition : même bug de contrainte `RESTRICT`
   que corrigé en 2.3 pour l'écriture directe, mais pas pour ce chemin.
6. Un traitement en lot s'arrête à la première erreur sans rien défaire.
7. Le journal d'une création approuvée pointe vers un identifiant temporaire (`new-<horodatage>`)
   au lieu de l'identifiant réel créé.
8. L'email d'alerte insère les noms (arbre, éditeur) sans échappement HTML.

Décisions déjà proposées (à confirmer avec l'utilisateur au moment de coder) : les liens
enfant-union (2.4) et les photos (2.5) restent réservés au propriétaire même après 2.6 — le format
JSON legacy ne les représente pas ; une seule proposition PENDING par (auteur, cible) ; ADR 0008 à
rédiger pour la compatibilité du format et l'atomicité.

#### Module 2.7 — Notifications

Non planifié en détail. Legacy : `ifumb/apps/api/src/notifications/` (service déjà lu partiellement
pendant la planification de 2.6 : `create`, `createForContactRequest`, `findForUser` avec
enrichissement des noms de cible), `ifumb/apps/web/src/hooks/useNotifications.ts`. Dépend de 2.6
(les notifications `PENDING_CHANGE_*` existent déjà en base une fois 2.6 fait). Prévoir : liste,
marquer comme lue, tout marquer comme lu, compteur non lues (probablement dans la navigation
« Compte »). Vérifier si un `NotificationType` du schéma Prisma reste inutilisé tant que
`contact-requests` (Phase 3) n'est pas porté.

#### Module 2.8 — Invitations + action « c'est moi » (claim)

Non planifié en détail. Legacy : `ifumb/apps/api/src/invitations/` (service, contrôleur, DTO),
probablement `CollaboratorsPanel.tsx` et `InviteModal.tsx` côté web (noms à vérifier), et la méthode
`claim` de `members.service.ts` (déjà repérée pendant la lecture pour 2.3 : vérifie que
`claimedByUserId` est libre avant d'écrire). Points connus à traiter :
- envoi d'email d'invitation (Resend, motif déjà en place) ;
- lien public par jeton (`Invitation.token`), accepter/refuser sans compte existant peut-être ;
- révoquer une invitation, changer un rôle ;
- `claimedByUserId` est **unique globalement** dans le schéma (`@unique` sur `Member`), pas par
  arbre : un compte ne peut revendiquer qu'un seul membre dans toute l'application, tous arbres
  confondus — vérifier que c'est le comportement voulu ou un bug legacy à documenter ;
  `rejectAllByUser` (legacy) rejette silencieusement les propositions PENDING d'un utilisateur dont
  l'accès est révoqué — à reporter si pertinent.
- l'action claim a été délibérément reportée de 2.3 à ce module (décision utilisateur).

#### Phase 3 — cross-tree et contact-requests

Non planifiée. Legacy : `ifumb/apps/api/src/cross-tree/` (suggestions + `cross-tree-branch`
controller séparé — à comprendre avant de planifier), `ifumb/apps/api/src/contact-requests/`.
Reportés ici depuis les phases précédentes (à ne pas oublier) :
- réglage « membre découvrable » dans la recherche publique (Phase 1, explore) — trancher le cas
  des arbres `SHARED` que le legacy excluait de la découverte ;
- visites guidées `driver.js` (montrent surtout des actions d'écriture, d'où le report après la
  Phase 2) ;
- branches étrangères du graphe (nœuds d'un autre arbre liés par `cross-tree`).

#### Phase 4 — Cutover

Non planifiée. Rappels des décisions déjà actées ailleurs dans ce document : la cible d'hébergement
(Docker autonome vs Vercel) est tranchée à ce stade seulement (ADR 0004) ; c'est aussi le seul
moment où `ifumb-next` peut écrire dans la base de **production** partagée (ADR 0005) ; dépréciation
de `ifumb/apps/*` ; passage à un déploiement unique.

#### Rappels transverses pour la suite

- **Un seul module en cours à la fois**, gate de build vert avant de passer au suivant.
- Avant de démarrer un module : vérifier qu'il n'y a toujours qu'une source du skill
  (`ifumb-apps/docs/nextjs-clean-architect/`). Si une copie installée apparaît un jour sous
  `.claude/skills/`, revenir au `diff -rq` décrit dans « Cartographie » (la source sous `docs/`
  fait foi en cas d'écart).
- Commits locaux uniquement (`git commit`, jamais `push` ni `tag`) tant que l'utilisateur ne le
  demande pas explicitement.
- Chaque module de la Phase 2 a ajouté une ADR dans `ifumb-next/docs/adr/` quand la décision était
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
- la décision et ses conséquences sont consignées dans une ADR (`docs/adr/`) de `ifumb-next`.

---

## Points de vigilance

- **Auth** : le JWT en `localStorage` ne doit **pas** être reporté. Cible actée : Auth.js v5,
  provider Credentials, session en cookie httpOnly lue côté serveur. Credentials impose
  `strategy: 'jwt'` : la table `RefreshToken` n'est plus alimentée mais reste dans le schéma
  jusqu'au cutover.
- **Base de données** : la base Supabase existante est réutilisée. `schema.prisma` et les
  migrations sont copiés tels quels ; **jamais de `prisma migrate dev` sur cette base** (il la
  réinitialiserait). Toute nouvelle migration est additive et soumise à confirmation.
- **Écritures de développement** (décision utilisateur du 2026-09-13) : ifumb-next n'écrit **jamais**
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

1. Lire le code source du module dans `ifumb/apps/api/src/<module>/` et ses consommateurs dans
   `ifumb/apps/web/src/`.
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
# Cible — depuis ifumb-next/
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build          # gate de fin de module
pnpm test           # Vitest
pnpm test:e2e       # Playwright
```

```bash
# Legacy — depuis ifumb/, pour lecture ou comparaison de comportement uniquement
pnpm dev            # démarre l'ancien FE + BE en parallèle
```

Gestionnaire de paquets : **pnpm exclusivement** — jamais npm, yarn ni bun. `ifumb-next/` est
verrouillé sur `pnpm@12.3.4` (`packageManager` + `preinstall: npx only-allow pnpm`), Node >= 22.12
(plancher du skill : Node 20 est en fin de vie).
Le legacy reste sur `pnpm@10.31.0` : ne pas aligner l'un sur l'autre.

---

## Contraintes d'écriture

- `ifumb/` est en **lecture seule** jusqu'au cutover (Phase 4). Aucune modification du legacy pour
  faire avancer la migration — s'il faut un correctif, il va dans `ifumb-next/`.
- Tout le code neuf va dans `ifumb-next/`, selon l'arbre défini par le skill
  (`src/core/`, `src/infrastructure/`, `src/app/`, `src/presentation/`, `tests/`).
- **Conventional Commits dès le premier commit** de `ifumb-next/` (commitlint + hook Husky
  `commit-msg`). La version n'est jamais éditée à la main dans `package.json`.
- Langue : explications, plans et prose en **français**. Code, identifiants, chemins et
  commentaires en **anglais**.
