# 0009 — Cutover : Vercel, Upstash Redis et bascule des écritures

## Status
Accepted — 2026-09-18. Résout la décision reportée par l'ADR 0004 ; ne la remplace pas.

## Context
L'ADR 0004 a reporté le choix de la cible d'hébergement (Docker autonome ou Vercel) au cutover,
tant qu'aucun module fonctionnel n'était prêt à être déployé. La Phase 3 est maintenant terminée
dans son intégralité (modules 3.1 à 3.3) : c'est le moment prévu par cette ADR pour trancher.

## Decision
La cible d'hébergement est **Vercel** (décision utilisateur du 2026-09-17). Conséquences directement
tranchées par ce choix, reprenant chacun des points laissés ouverts par l'ADR 0004 :

- **Rate limiting** : `InMemoryRateLimiter` ne vaut que pour une seule instance ; Vercel en fait
  tourner plusieurs en parallèle, chacune avec sa propre mémoire — un compteur par instance ne
  protège plus rien à l'échelle réelle. Nouvelle implémentation `UpstashRateLimiter` du même port
  `RateLimiter`, sur Upstash Redis (API HTTP, pensée pour le serverless). Sélectionnée dans
  `container.ts` uniquement quand `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` sont définies ;
  `InMemoryRateLimiter` reste le comportement par défaut partout ailleurs (dev local, CI, tests),
  aucun des deux n'exigeant de compte Upstash.
- **Pool Prisma** : `POOL_MAX_CONNECTIONS` devient configurable
  (`PRISMA_POOL_MAX_CONNECTIONS`, `5` par défaut, inchangé) — chaque instance serverless ouvre son
  propre pool, la limite réelle devenant `PRISMA_POOL_MAX_CONNECTIONS × instances concurrentes`
  contre la limite du pooler Supabase ; ce produit se retune sans redéploiement.
- **IP cliente** : Vercel est le proxy de confiance qui écrase `x-forwarded-for`/`x-real-ip` sur
  chaque requête atteignant une fonction — le code déjà écrit (`client-ip.ts`) devient fiable tel
  qu'il est, sans modification, seul son commentaire est mis à jour.
- **Sonde de santé** : nouvelle sonde de disponibilité `GET /api/health/ready` (ping base), en plus
  de la sonde de vivacité existante — utile pour une supervision externe (Vercel lui-même n'a pas
  d'orchestrateur qui l'appellerait, contrairement à Kubernetes/ECS).
- **`APP_URL`** : à définir dans les variables d'environnement Vercel (Production et Preview), sinon
  `metadataBase`, le sitemap et les liens d'email pointent vers `localhost`.
- **CI** : `pnpm/setup` cible déjà `node@22`, aligné avec le runtime Node de Vercel — rien à changer.
- **Aucun `Dockerfile`/`output: 'standalone'`/job `deploy`** : Vercel construit et déploie lui-même
  depuis le dépôt Git une fois le projet connecté, sans étape dédiée dans `ci.yml` — une
  simplification par rapport au chemin Docker par défaut du skill, qui ne s'applique pas ici.
- **Tests de smoke post-déploiement** (`tests/smoke/`, déjà écrits par anticipation) : désormais
  déclenchés par un nouveau workflow (`smoke.yml`) sur l'évènement `deployment_status` que
  l'intégration GitHub de Vercel crée automatiquement.
- **`BUSINESS_WRITES_ENABLED`** (ADR 0005) reste le seul interrupteur d'écriture métier ; son message
  d'erreur et son commentaire sont mis à jour pour décrire les deux cas légitimes (staging pendant
  la migration, production au cutover) plutôt que le seul refus. La bascule à `true` en production
  reste un acte délibéré, distinct du déploiement lui-même (runbook, voir
  `docs/plans/4-cutover.md`).

## Consequences
- Nouvelle dépendance : `@upstash/ratelimit` + `@upstash/redis` — écart déclaré à la préférence
  habituelle de ce projet pour « pas de nouvelle dépendance », justifié par le choix d'hébergement
  lui-même.
- Point resté ouvert depuis l'ADR 0003, toujours **non vérifié en réel** : la compatibilité du
  pooler Supabase en mode transaction (pgbouncer) avec `@prisma/adapter-pg`. Aucun projet Supabase
  de staging n'a jamais existé (ADR 0005) ; à confirmer dès qu'un projet Supabase (staging ou
  production) est joignable, avant la bascule des écritures.
- La dépréciation de `ifumb/` (arrêt du service legacy) reste une décision et une action
  opérationnelles, sans code correspondant dans `ifumb-next` — détaillée dans le runbook du plan de
  cutover, pas dans cette ADR.
