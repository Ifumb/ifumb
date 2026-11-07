# Refonte de la page d’accueil

Branche : `feat/landing-page-redesign`.

## Périmètre et décisions

- FACT : une première landing, son image et ses tests étaient déjà présents sans commit.
  La refonte conserve cette base et l’image réelle de l’arbre.
- FACT : l’état de connexion vient de `currentUserOrNull`, appelé par la page serveur.
  Les vues ne reçoivent qu’un booléen. Les comptes et arbres restent gérés par les cas d’usage existants.
- DECISION : navigation, promesse de transmission, aperçu du produit, quatre bénéfices,
  trois étapes, questions fréquentes et appel à l’action final.
- DECISION : palette ivoire/terracotta complétée par des verts sobres ; titres en Georgia
  disponible localement, sans téléchargement de police ou dépendance supplémentaire.
- DECISION : FAQ native `details/summary` et sections rendues sur le serveur.
- DECISION : toutes les entrées de compte affichent les arbres pour une personne connectée.
- Aucun invariant métier, état persistant, schéma de base ou contrat d’API modifié.
  Il n’y a pas de nouvelle commande ni de question de rejeu à résoudre.
- Aucun témoignage, compteur d’utilisateurs ou résultat de conversion inventé.
  L’amélioration de conversion reste une hypothèse à mesurer après livraison.

## Revue par fichier

Les vues ci-dessous sont dans `src/presentation/views/landing/`.

| Fichier                                       | Responsabilité et revue Clean Code                                       | Vérification                     |
| --------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------- |
| `src/app/page.tsx`                            | Composition serveur, métadonnées, état de connexion transmis par props   | Types, E2E invité/connecté       |
| `src/app/globals.css`                         | Tokens nommés et imports CSS, sans modification des tokens existants     | Compilation, revue visuelle      |
| `src/presentation/styles/landing.css`         | Styles préfixés, responsive, réutilisation des tokens et du focus global | Revue desktop/mobile, axe        |
| `src/presentation/styles/landing-preview.css` | Styles isolés de la figure, dimensions d’image réservées                 | Revue desktop/mobile             |
| `landing-header-view.tsx`                     | Navigation nommée, liens natifs, props readonly                          | Navigation, connexion            |
| `landing-hero-view.tsx`                       | Un seul h1, promesse et actions, aucune logique métier                   | E2E, axe, revue visuelle         |
| `landing-primary-action.tsx`                  | Destination et libellés partagés entre les deux appels à l’action        | E2E invité/connecté              |
| `landing-preview-view.tsx`                    | Figure légendée, texte alternatif, image préchargée avec sizes           | Chargement réel de l’image       |
| `landing-features-view.tsx`                   | Liste typée readonly, composant d’item sans effets                       | Axe, revue visuelle              |
| `landing-how-it-works-view.tsx`               | Liste ordonnée, données readonly, numérotation décorative                | Navigation par ancre, axe        |
| `landing-questions-view.tsx`                  | Interaction native au clavier sans état client                           | Ouverture/fermeture clavier, axe |
| `landing-invitation-view.tsx`                 | Appel final réutilisant l’action commune                                 | E2E invité/connecté              |
| `landing-footer-view.tsx`                     | Navigation distincte et état de connexion cohérent                       | E2E invité/connecté              |
| `tests/e2e/landing.spec.ts`                   | Cinq scénarios ciblés sur le comportement observable                     | Playwright                       |

Dérogation documentée par `reason` : certains blocs JSX et scénarios E2E dépassent
20 lignes pour garder une section sémantique ou un parcours complet lisible ensemble.
Chaque fichier source reste sous 200 lignes ; imports TypeScript inter-dossiers via alias.
Les imports relatifs CSS suivent la convention Tailwind existante.

## Validation

- ESLint : réussi.
- TypeScript : réussi.
- Tests unitaires : 111 fichiers, 885 tests réussis.
- Couverture domaine : lignes 98,22 %, branches 92,89 %.
- Build de production : réussi, puis utilisé par les tests E2E.
- Revue visuelle : captures desktop 1440 px et mobile 390 px inspectées.
- Contrôle direct responsive et axe : aucun débordement ni violation détectée aux largeurs
  320, 360, 390, 768 et 1440 px.
- Clavier : lien d’évitement avec focus sur le contenu et ouverture/fermeture de la FAQ validés.
- Tests E2E : 5 réussis (invité, connecté, image, clavier/ancres, inscription sur mobile).
  La base utilisée est exclusivement le PostgreSQL Docker jetable sur le port 55432.
- Premier lancement E2E interrompu en environnement restreint : accès Docker refusé.
  Relance avec accès local autorisé : build et cinq tests réussis sur le port 3933.
- Prettier et `git diff --check` : réussis.

Tranche de présentation vérifiée ; aucun comportement métier découvert ni décision métier ouverte.
Les dérogations de longueur JSX/E2E ci-dessus sont les seules dérogations de cette refonte.

Commit proposé : `feat: redesign the family heritage landing page`.
Pas de rupture ; version laissée au mécanisme de release du dépôt (feat en 0.x : patch).

## Correctifs après revue utilisateur

- La capture `public/landing/graph-preview.png` ne comportait que des identités
  d'Afrique de l'Ouest/australe (Wolof, Akan, Chewa), sans aucune représentation
  gabonaise — alors que le marché de lancement réel du produit est le Gabon.
  Régénérée à partir d'un arbre de démonstration gabonais (Fang, Myéné, Nzébi),
  toujours via la base de test Docker jetable. Texte alternatif mis à jour.
- Le header de la landing (`landing-header-view.tsx`) et le `SiteHeader` global
  (toutes les autres pages) étaient deux composants visuellement indépendants :
  logo, hauteur et style de bouton différents — rupture de cohérence perçue à la
  connexion. Le logo est extrait dans un composant partagé `BrandLogo`
  (`src/presentation/components/ui/brand-logo.tsx`), repris par `SiteHeader`,
  `landing-header-view.tsx` et `landing-footer-view.tsx` ; le header de la landing
  reprend la classe `site-header` (hauteur, bordure, couleurs) et les mêmes
  classes de bouton que le header de l'app. CSS mort correspondant supprimé de
  `landing.css`.
- Revalidation complète après ces deux correctifs : ESLint, TypeScript, 885 tests
  unitaires, build de production, puis deux passages de la suite E2E complète
  (avant et après le correctif de header) — tous verts.
