# 0005 — Écritures de développement sur une base de staging, jamais en production

## Status

Accepted — 2026-09-13. Précise l'ADR 0001, sans la remplacer.

## Context

L'ADR 0001 a acté la réutilisation de la base Supabase de production, partagée avec l'application
legacy toujours en service. Jusqu'à la Phase 1, ifumb-next n'y fait que lire (et créer des comptes
lors d'essais d'inscription).

La Phase 2 porte les écritures : arbres, membres, unions, audit-log, pending-changes. Chaque essai
manuel en local écrirait alors de vraies données dans la base de production, visibles dans le
legacy et dans son historique, sans moyen propre de les retirer.

Options considérées : écrire aussi en production avec une discipline stricte ; écrire dans le
Postgres Docker local des tests ; écrire dans un projet Supabase de staging restauré depuis une
sauvegarde de la production.

## Decision

Pendant toute la migration, ifumb-next n'écrit **aucune donnée métier** dans la base de production.

- Développement et essais manuels comportant des écritures : un **projet Supabase de staging**,
  restauré depuis une sauvegarde de la production, avec son propre pooler.
- Tests d'intégration et E2E : inchangés, sur le Postgres Docker de `docker-compose.test.yml`.
- Base de production : lecture et comparaison uniquement, jusqu'au cutover.

## Consequences

- Les modules d'écriture de la Phase 2 exigent qu'un projet de staging existe et que `.env.local`
  pointe dessus avant tout essai manuel.
- Le staging permet enfin de vérifier le pooler Supabase (pgbouncer, mode transaction) avec
  `@prisma/adapter-pg`, point resté ouvert depuis l'ADR 0003.
- Les données de staging divergent de la production avec le temps : une restauration récente est à
  refaire avant les recettes importantes et avant le cutover.
- Une restauration de production contient des données personnelles : l'accès au staging est limité
  aux mêmes personnes que la production.
