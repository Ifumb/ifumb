# Phase 4 — Cutover

**Statut : plan proposé, non confirmé par l'utilisateur, aucun code écrit.** Dernière phase de la
migration : bascule de `ifumb-next` en production, dépréciation de `ifumb/`. Étape 3 du cycle de
travail : **jamais de code avant confirmation explicite**.

**Décision utilisateur du 2026-09-17 (résout l'ADR 0004) : cible d'hébergement = Vercel.** Ce choix
détermine tout le reste de ce plan — un déploiement Docker autonome n'aurait pas la même liste.

## Ce que cette phase n'est pas

Contrairement aux modules 1.x–3.x, il n'y a ici ni nouvelle entité ni nouveau cas d'usage métier au
sens du skill. Le travail se répartit en trois catégories, distinguées explicitement à chaque point
du plan :

- **Code** — ce que je change moi-même dans `ifumb-next/`, gate complet à l'appui.
- **Opérationnel** — ce que toi seul peux faire (comptes, secrets, DNS, arrêt du legacy) : je ne
  peux pas créer un projet Vercel, un compte Upstash, ou couper le service legacy à ta place.
- **Vérification partagée** — un point resté ouvert depuis l'ADR 0003 (compatibilité du pooler
  Supabase en mode transaction avec `@prisma/adapter-pg`) qui n'a **jamais été testé en réel** dans
  tout ce projet (le staging Supabase n'existe toujours pas, confirmé le 2026-09-16) : à vérifier
  ensemble dès qu'un projet Supabase (staging ou production) est joignable.

## Constats (relecture des ADR 0001, 0003, 0004, 0005 et du code actuel)

1. `POOL_MAX_CONNECTIONS = 5` est une constante en dur dans `client.ts`, pensée pour une seule
   instance de process. Sur Vercel, chaque fonction serverless peut instancier son propre pool ; le
   nombre réel de connexions simultanées vers le pooler Supabase devient
   `POOL_MAX_CONNECTIONS × instances concurrentes`, potentiellement bien au-delà de la limite du
   pooler.
2. `InMemoryRateLimiter` (module 0.2b) tient son compteur dans la mémoire du process — déjà
   documenté comme non valable au-delà d'une instance. Sur Vercel (plusieurs instances, jamais
   garanties d'être la même d'une requête à l'autre), **chaque politique de débit** de
   `RATE_LIMIT_POLICIES` en est affectée, pas seulement certaines.
3. `clientIpFrom` (`client-ip.ts`) lit déjà `x-forwarded-for`/`x-real-ip` sans savoir, jusqu'ici, si
   un proxy de confiance les écrase. Vercel est ce proxy : ses fonctions reçoivent ces en-têtes déjà
   nettoyés du bord (edge), le code actuel devient donc fiable tel qu'il est écrit — seul le
   commentaire qui doutait de la cible est à mettre à jour.
4. `GET /api/health` est une sonde de vivacité délibérément sans base de données ; une sonde de
   disponibilité (avec ping base) a été explicitement reportée à ce moment-là.
5. `BUSINESS_WRITES_ENABLED` (ADR 0005) reste le bon mécanisme au cutover — il ne s'agit pas de le
   retirer, mais de le faire passer à `true` en production, ce que son propre message d'erreur et
   son commentaire ne décrivent qu'à moitié (ils ne parlent que du refus, jamais du jour où la
   production devient une cible légitime).
6. Aucun `Dockerfile`/`output: 'standalone'`/job `deploy` n'existe — cohérent avec l'ADR 0004, et
   **pas nécessaire pour Vercel** : Vercel construit et déploie lui-même depuis le dépôt Git (une
   fois le projet connecté), sans passer par une étape dédiée de `ci.yml`. C'est une simplification
   par rapport au chemin Docker par défaut du skill, à documenter comme telle.
7. `tests/smoke/post-deploy.spec.ts` et `playwright.smoke.config.ts` existent déjà (faits par
   anticipation à l'ADR 0004) et sont indépendants de la cible — rien à changer là, seulement à les
   brancher dans un workflow qui se déclenche après un déploiement Vercel.
8. Le legacy (`ifumb/`) reste en lecture seule jusqu'ici ; la dépréciation dont parle `CLAUDE.md` est
   une décision opérationnelle (arrêter le service, rediriger son domaine) — aucune modification de
   code n'y est prévue ni nécessaire.

## Décisions proposées (à valider)

1. **Rate limiting sur Upstash Redis** (`@upstash/ratelimit` + `@upstash/redis`, HTTP, pensé pour le
   serverless, déjà cité par l'ADR 0004 comme piste). Nouvelle implémentation `UpstashRateLimiter`
   du port `RateLimiter` existant, sélectionnée dans `container.ts` uniquement quand
   `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` sont définies ; `InMemoryRateLimiter` reste le
   choix par défaut (dev local, CI, tests) — aucun test n'a besoin d'un compte Upstash.
2. **`POOL_MAX_CONNECTIONS` devient configurable** par une variable d'environnement optionnelle
   (`PRISMA_POOL_MAX_CONNECTIONS`), avec `5` comme valeur par défaut inchangée — pour pouvoir la
   recalculer en production (limite du pooler ÷ instances concurrentes maximales, comme l'ADR 0004
   le prévoyait) sans nouveau déploiement.
3. **Sonde de disponibilité** `GET /api/health/ready` : ping base minimal (`SELECT 1`), séparée de
   la sonde de vivacité existante — utile pour une supervision externe (aucun orchestrateur Vercel
   ne l'appelle lui-même, contrairement à Kubernetes/ECS, mais un moniteur externe ou une page de
   statut en a l'usage).
4. **Aucun job de déploiement dans `ci.yml`** : Vercel déploie depuis le dépôt Git une fois le projet
   connecté (opérationnel, ci-dessous) ; `ci.yml` continue de jouer son rôle de garde qualité sur
   chaque PR/push, sans lien avec le déploiement lui-même.
5. **Nouveau workflow `smoke.yml`**, déclenché sur l'évènement `deployment_status` (GitHub
   Deployments, que l'intégration Vercel crée automatiquement), qui lance `pnpm test:smoke` contre
   l'URL du déploiement réussi.
6. **`BUSINESS_WRITES_ENABLED`** : message d'erreur et commentaire de `business-writes.ts` réécrits
   pour refléter les deux cas légitimes (staging pendant la migration, production au cutover) plutôt
   que de ne décrire que le refus.
7. **Nouvelle ADR 0009** consignant ce qui précède (résout l'ADR 0004 ; l'ADR 0004 elle-même n'est
   pas modifiée, elle documente fidèlement la décision de report qui a eu lieu).
8. **Bascule en deux temps, jamais en un seul déploiement** (détaillé dans le runbook, point 14) :
   d'abord un déploiement Vercel avec `BUSINESS_WRITES_ENABLED` **absent** (donc `false`), pour
   vérifier tout le reste (lecture, sondes, en-têtes, rate limiting) sans risquer une écriture ; puis
   bascule de la variable à `true` une fois ce premier déploiement confirmé sain.

---

## 1. Fichiers — ce que je change

**À créer**
- `src/infrastructure/rate-limiting/upstash-rate-limiter.ts` (`UpstashRateLimiter`)
- `src/app/api/health/ready/route.ts`
- `.github/workflows/smoke.yml`
- `docs/adr/0009-cutover-vercel-upstash-et-bascule-des-ecritures.md`

**À modifier**
- `src/infrastructure/di/container.ts` : `buildRateLimiters()` choisit `UpstashRateLimiter` quand les
  deux variables Upstash sont définies, sinon `InMemoryRateLimiter` (inchangé).
- `src/infrastructure/persistence/prisma/client.ts` : `POOL_MAX_CONNECTIONS` lu depuis
  `PRISMA_POOL_MAX_CONNECTIONS`, `5` par défaut.
- `src/infrastructure/http/client-ip.ts` : commentaire mis à jour (la cible n'est plus « à décider »).
- `src/infrastructure/config/business-writes.ts` : message d'erreur et commentaire.
- `.env.example` : `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
  `PRISMA_POOL_MAX_CONNECTIONS` (documentées comme optionnelles).
- `package.json` : `@upstash/ratelimit`, `@upstash/redis`.
- `CLAUDE.md` : § Phase 4, une fois le code fait et gaté.

**Non modifiés, et pourquoi** : `next.config.ts` (aucun `output: 'standalone'` requis par Vercel) ;
`ci.yml` (aucun job de déploiement, décision 4) ; tout `ifumb/` (dépréciation opérationnelle, jamais
de code).

## 2. Sens des dépendances

`UpstashRateLimiter` implémente le port `RateLimiter` (`core/use-cases/ports/rate-limiter.ts`) déjà
existant, au même niveau que `InMemoryRateLimiter` — aucun appelant (`attempt-guard.ts`, les Server
Actions) ne change. Le choix entre les deux implémentations reste un détail de `container.ts`,
jamais visible plus haut dans les couches — même discipline que pour tout autre port de ce projet.

## 3. Base de données

Aucune migration. La base de production est déjà celle que `ifumb-next` cible depuis l'ADR 0001 —
le cutover change qui a le droit d'y écrire (`BUSINESS_WRITES_ENABLED`), pas où elle se trouve.

## 4. Checklist Clean Code par fichier

- `UpstashRateLimiter` : une seule responsabilité (traduire le port `RateLimiter` vers
  `@upstash/ratelimit`), la politique (`limit`/`windowMs`) reste un paramètre de construction comme
  pour `InMemoryRateLimiter` — même forme, autre backend.
- `GET /api/health/ready` : un seul aller-retour base, pas de logique métier.
- Tous les fichiers : moins de 200 lignes, 120 colonnes.

## 5. Stratégie de test

**Unitaire** : aucun nouveau test ne doit exiger un compte Upstash réel — `UpstashRateLimiter` est
testé soit avec un faux client HTTP injecté, soit laissé sans test unitaire dédié et couvert
uniquement par le contrat déjà testé du port (`InMemoryRateLimiter` porte déjà la sémantique fenêtre
fixe attendue ; `UpstashRateLimiter` n'ajoute qu'un adaptateur de transport, à vérifier à la marge —
détail à trancher en codant selon ce qui reste honnête sans taper un vrai Redis).

**Intégration/E2E** : inchangés, toujours contre le Postgres Docker jetable — aucun des deux ne doit
jamais dépendre d'Upstash ou d'un vrai projet Supabase.

**Smoke** (`tests/smoke/`, déjà écrits) : désormais réellement exécutés, contre le premier
déploiement Vercel, avant toute bascule de `BUSINESS_WRITES_ENABLED`.

**Vérification partagée, hors suite automatisée** : une fois `DATABASE_URL` pointée vers un vrai
pooler Supabase (staging ou production), confirmer à la main qu'une requête Prisma via
`@prisma/adapter-pg` réussit en mode transaction (pgbouncer) — point ouvert depuis l'ADR 0003, jamais
vérifié en réel. Si ça échoue, la piste de repli documentée par Prisma est `DATABASE_URL` avec
`?pgbouncer=true` ou le port de connexion directe pour les requêtes qui l'exigent — à ne creuser que
si le problème se présente.

## 6. Impact de version

`feat`/`chore` selon le détail des commits ; pas de rupture fonctionnelle, aucune migration.

## 7. Accessibilité

Sans objet : aucune interface nouvelle dans cette phase.

## 8. Design et UX

Sans objet.

## 9. Performance et SEO

`APP_URL` doit être la vraie URL de production dans les variables Vercel (build **et** runtime),
sinon `metadataBase`, le sitemap et les liens d'email pointent vers `localhost`. Rien d'autre ne
change côté SEO : les en-têtes de sécurité et le `robots.txt` existants s'appliquent tels quels sur
Vercel.

## 10. Sécurité et robustesse

- **Nouvelle dépendance** : `@upstash/ratelimit` + `@upstash/redis` — écart déclaré au « pas de
  nouvelle dépendance » habituel de ce projet, justifié par la décision d'hébergement elle-même
  (une seule instance ne suffit plus à garantir un compteur correct).
- **`BUSINESS_WRITES_ENABLED`** reste le seul interrupteur d'écriture métier ; le faire passer à
  `true` est un acte délibéré, décrit dans le runbook (point 14), jamais un effet de bord du
  déploiement lui-même.
- **IP cliente** : désormais fiable derrière Vercel, ce qui renforce (sans remplacer) les budgets
  déjà posés par email/utilisateur.
- Pas de nouvel email, pas de nouvelle saisie utilisateur.

## 11. Conventions d'API

`GET /api/health/ready` : JSON `{ status: 'ok' }` ou 503, sur le modèle de `/api/health`.

## 12. Déploiement et exploitation — runbook de la bascule

**Opérationnel, dans l'ordre, aucune étape sautée :**

1. Créer (ou confirmer l'existence d') un projet Vercel connecté au dépôt GitHub `ifumb-next`.
2. Créer un compte/une base Upstash Redis (offre gratuite suffisante pour démarrer), copier
   `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`.
3. Renseigner dans Vercel (Production **et** Preview séparément si les valeurs diffèrent) :
   `DATABASE_URL` (pooler Supabase, port 6543), `DIRECT_URL`, `AUTH_SECRET`, `APP_URL` (le vrai
   domaine), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`,
   `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. **`BUSINESS_WRITES_ENABLED` absent pour le
   premier déploiement.**
4. Premier déploiement de production. Lancer `pnpm test:smoke` (ou laisser `smoke.yml` le faire) :
   vivacité, disponibilité, page d'accueil sans erreur console.
5. Vérifier à la main la connexion pooler (point de vérification partagée ci-dessus, § 5).
6. Parcourir manuellement les parcours de lecture réels (arbres publics, connexion, graphe) sur le
   domaine de production.
7. Une fois ce premier déploiement confirmé sain : ajouter `BUSINESS_WRITES_ENABLED=true` dans
   Vercel (Production uniquement), redéployer.
8. Vérifier une écriture réelle de bout en bout (créer un arbre de test, le supprimer ensuite).
9. Rediriger le trafic réel vers ce déploiement (DNS du domaine de production).
10. Surveiller les sondes et les journaux pendant une période de rodage avant de couper le legacy.
11. Arrêter le service legacy (`ifumb/apps/api`, `ifumb/apps/web`) une fois la période de rodage
    jugée suffisante.
12. `ifumb-next/CLAUDE.md` : marquer la Phase 4 faite, noter les hash de commit réels et confirmer
    que `ifumb/` passe de « lecture seule pendant la migration » à « archivé ».

Aucune de ces douze étapes n'est du code — je ne peux les exécuter à ta place. Le plan ci-dessus
prépare le code pour qu'elles soient possibles ; c'est toi qui les déclenches, dans cet ordre.
