# 0002 — Auth.js v5 (Credentials, sessions JWT) et bcryptjs à la place de l'auth maison

## Status
Accepted — 2026-09-13

## Context
Le legacy authentifie avec un JWT d'accès de 15 minutes stocké en `localStorage` côté navigateur
(exposé au XSS) et un refresh token UUID en base, avec rotation, en cookie httpOnly de 7 jours. Les
mots de passe sont hachés avec `bcrypt` natif, coût 12.

Deux options ont été considérées : porter ce modèle maison en cookies httpOnly lus côté serveur, ou
adopter Auth.js v5, que le skill d'architecture prévoit par défaut.

## Decision
- Auth.js v5 (`next-auth@5.0.0-beta.32`, version épinglée car encore en bêta), provider
  Credentials qui délègue au use case `AuthenticateUserUseCase`.
- Sessions en JWT (seule stratégie supportée par Credentials), durée de 7 jours pour garder la durée
  effective d'une session legacy.
- `bcryptjs` coût 12 à la place de `bcrypt` natif : aucune compilation native, et compatibilité
  vérifiée dans les deux sens avec des hachages `$2b$12$` produits par `bcrypt` natif.

## Consequences
- Le JWT disparaît du navigateur ; la session est lue côté serveur.
- La table `RefreshToken` n'est plus alimentée par ifumb-next. Elle reste dans le schéma tant que le
  legacy tourne, et sera supprimée au cutover.
- Une session JWT n'est pas révocable côté serveur avant expiration : après un changement ou une
  réinitialisation du mot de passe, les sessions déjà ouvertes restent valides jusqu'à 7 jours
  (même comportement que le legacy, qui ne révoquait pas ses refresh tokens).
- Auth.js expose aussi `POST /api/auth/callback/credentials` : toute protection de la connexion
  (limitation de débit) vit dans `authorize`, jamais seulement dans le formulaire.
- Passage à la version stable d'Auth.js v5 à planifier dès sa sortie.
