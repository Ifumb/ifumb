# 0004 — Choix de la cible d'hébergement reporté au cutover

## Status
Accepted — 2026-09-13

## Context
Le skill d'architecture fait d'un serveur Node autonome conteneurisé (`output: 'standalone'`,
`Dockerfile` multi-stage, job `deploy`) le chemin par défaut et une exigence de toute migration.
L'audit de migration recommandait au contraire Vercel, où le frontend legacy est déjà déployé. Les
deux cibles n'ont pas les mêmes contraintes : un process long partage sa mémoire entre requêtes,
une plateforme serverless multiplie les instances.

La décision a peu de valeur tant qu'aucun module fonctionnel n'est prêt à être déployé, et beaucoup
de conséquences si elle est prise trop tôt.

## Decision
La cible (Docker autonome ou Vercel) est tranchée au cutover (Phase 4). D'ici là :

- ne sont **pas** créés : `Dockerfile`, `.dockerignore`, `output: 'standalone'` (incompatible avec
  le `next start` utilisé par les E2E) et le job `deploy` de release-please ;
- sont faits dès maintenant, car indépendants de la cible : sonde `GET /api/health`, tests de smoke
  post-déploiement, en-têtes de sécurité, CI ;
- le code reste compatible avec les deux cibles.

## Consequences
Points à trancher au cutover, qui dépendent directement de cette décision :

- **Rate limiting** : l'adapter en mémoire ne vaut que pour une instance unique. En serverless ou en
  multi-instance, il faut une implémentation du port `RateLimiter` adossée à un store partagé
  (Redis/Upstash), sans changer les appelants.
- **IP cliente** : `x-forwarded-for` n'est fiable que derrière un proxy qui l'écrase. Tant que ce
  proxy n'est pas connu, un client peut le falsifier ; les budgets par email et par utilisateur
  limitent l'impact (vérifié par les E2E, qui simulent justement des IP différentes).
- **Pool Prisma** : `POOL_MAX_CONNECTIONS` est à recalculer (limite du pooler / instances
  concurrentes maximales).
- **Sonde de santé** : ajouter une sonde *readiness* avec ping de la base selon ce que l'hébergeur
  interroge.
- **`APP_URL`** : doit être définie au build et au runtime du déploiement, sinon `metadataBase`, le
  sitemap et les liens des emails pointent vers `http://localhost:3000`.
- **CI** : aligner la version de Node de la CI sur celle de l'environnement d'exécution retenu.
