# 0001 — Réutilisation de la base Supabase partagée avec l'application legacy

## Status
Accepted — 2026-09-13

## Context
ifumb-next remplace progressivement l'application legacy (React/Vite + NestJS), qui reste en
production pendant toute la migration et écrit dans une base PostgreSQL hébergée sur Supabase
(10 migrations, données réelles). Deux options ont été considérées : réutiliser cette base, ou
repartir sur une base de développement dédiée alimentée par un jeu de données de seed.

Une base dédiée isole totalement la nouvelle application, mais interdit de comparer les deux
applications sur les mêmes données et reporte au cutover tout le risque de reprise des données.

## Decision
ifumb-next se connecte à la base Supabase existante. Le `schema.prisma` et les 10 migrations du
legacy sont copiés à l'identique (empreintes git identiques, fins de ligne LF forcées par
`.gitattributes`), et seuls `prisma generate` et `prisma migrate status` sont autorisés sur cette
base. `prisma migrate dev` y est interdit.

Les tests d'intégration et E2E n'utilisent jamais cette base : ils rejouent les migrations sur le
Postgres jetable de `docker-compose.test.yml`, avec des URL forcées dans leur configuration.

## Consequences
- Les deux applications se comparent sur les mêmes données, module par module.
- Toute évolution de schéma devient une décision commune aux deux applications : une nouvelle
  migration doit rester rétro-compatible avec le legacy tant qu'il tourne.
- Les écritures de ifumb-next ne doivent jamais casser les invariants attendus par le legacy
  (par exemple, les colonnes gérées par `@default(cuid())` restent inchangées dans le schéma, même si
  ifumb-next génère ses propres identifiants).
- Le pool de connexions de chaque instance est borné (`POOL_MAX_CONNECTIONS`), car le pooler
  Supabase est partagé avec l'API legacy.
