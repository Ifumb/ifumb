# 0010 — Le legacy n'a jamais été déployé : l'ADR 0001 ne s'applique plus en pratique

## Status
Accepted — 2026-11-08.

## Context
L'ADR 0001 (2026-09-13) part du principe explicite que « ifumb-legacy reste en production pendant
toute la migration » et interdit `prisma migrate dev` sur la base Supabase partagée pour cette
raison.

Vérification du 2026-11-08 (historique git de `ifumb-legacy`, confirmée par l'utilisateur) : le
pipeline de déploiement du legacy (Docker + SSH via GitHub Actions) a échoué dès son premier run
réel (#8, 17 octobre 2026) — secrets SSH jamais configurés sur les environnements GitHub `staging`
et `production`. Une checklist de réparation a été écrite ce jour-là
(`ifumb-legacy/docs/deploy-fix-checklist.md`) mais jamais suivie d'un commit confirmant une
réparation. Aucune activité depuis. Le `.env` local du legacy pointe par ailleurs vers une base
Postgres locale distincte, pas vers le Supabase partagé.

Dans le même temps, `ifumb` (ex-`ifumb-next`) tourne en production sur `ifumb.app` depuis plus de
40 jours (vérifié via la CLI Vercel le 2026-11-07, voir `docs/legal/legal-register.md`).

## Decision
Le legacy n'ayant jamais été déployé nulle part, la prémisse de l'ADR 0001 ne tient plus : il n'y a
pas de second service écrivant en concurrence sur la base Supabase partagée. `ifumb` est le seul
système réellement en production sur cette base.

En conséquence :
- `prisma migrate dev`/`migrate deploy` contre la base Supabase partagée (celle de `.env.local` et
  de la production Vercel) redevient possible, avec les précautions standard de toute migration en
  production (pas de perte de données, colonnes additives ou valeur par défaut, testée localement
  d'abord).
- L'interdiction stricte de l'ADR 0001 (« `prisma migrate dev` y est interdit ») est levée. Les
  contraintes de rétro-compatibilité de schéma avec le legacy (ADR 0001, Consequences) n'ont plus
  d'objet.
- L'ADR 0005 (écritures de développement en staging) perd elle aussi sa justification première
  (protéger un legacy en production) — mais reste une bonne pratique générale de ne pas tester des
  écritures manuelles hasardeuses directement en production ; à réévaluer séparément si besoin.

## Consequences
- Avant toute migration : vérifier une dernière fois qu'aucune instance du legacy n'est vraiment
  accessible (l'absence de déploiement CI ne prouve pas formellement l'absence de tout déploiement
  manuel ailleurs) — confirmé par l'utilisateur à cette date, à revérifier si un doute survient.
- **Anomalie distincte, non résolue par cette ADR** : la variable `BUSINESS_WRITES_ENABLED`
  (ADR 0009), qui gate les écritures de `Tree`/`Member`/`Union` via `PrismaUnitOfWork`, n'est
  définie dans aucun environnement Vercel (production, preview, development) ni dans
  `.env.local`. Le code (`businessWritesEnabled()`) devrait donc renvoyer `false` partout,
  bloquant toute création d'arbre/membre — pourtant des arbres réels existent en production
  (ex. compte observé avec un arbre de 21 membres). Cause non investiguée ici (donnée antérieure à
  l'introduction du gate ? variable définie autrement que via `vercel env`? inscription utilisateur
  non couverte par ce gate, seul le contenu de l'arbre l'étant ?) — à clarifier avant de s'appuyer
  sur ce flag pour une décision de sécurité.
