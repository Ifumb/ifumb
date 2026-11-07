<!-- BROUILLON À FAIRE VALIDER PAR UN JURISTE/DPO — conventions : assets/templates/README.md (skill `legal`) -->
<!-- Documents INTERNES du responsable de traitement (non publiés sur le site). Source : RGPD art. 28, 30, 33-35. -->

# A. Registre des activités de traitement (RGPD art. 30)

## A.1 Registre du responsable (art. 30(1))

| Traitement | a) Responsable / DPO | b) Finalités | c) Catégories de personnes et de données | d) Catégories de destinataires | e) Transferts hors UE | f) Délais d'effacement prévus | g) Mesures de sécurité |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Comptes utilisateurs | [À COMPLÉTER] | Authentification, gestion du compte | Utilisateurs : nom, e-mail, mot de passe haché | Supabase, Vercel | Aucun hors UE identifié pour ce traitement | [À COMPLÉTER] | Mot de passe haché (bcrypt, coût 12) ; cookie de session Auth.js |
| Fiches de membres de l'arbre (`Member`) | [À COMPLÉTER] | Construction et consultation de l'arbre généalogique | Utilisateurs **et tiers non-utilisateurs** (y compris mineurs, personnes décédées) : prénom, nom, genre, dates, tribu/clan/ethnicité (sensible), photo | Autres collaborateurs de l'arbre ; public si l'arbre est public | Vers le Gabon si l'utilisateur y est situé (voir `africa-prior-formalities.md`) | [À COMPLÉTER] | Accès par rôle (propriétaire/éditeur) ; photos ré-encodées côté serveur sans métadonnées |
| Invitations et collaboration | [À COMPLÉTER] | Inviter un collaborateur sur un arbre | E-mail du destinataire, rôle, jeton | Resend (envoi) | — | [À COMPLÉTER : durée de validité du jeton] | Jeton à usage unique |
| Journal d'audit / modifications en attente | [À COMPLÉTER] | Traçabilité des modifications, revue avant application | Historique des changements, auteur, date | — | — | [À COMPLÉTER] | — |
| Notifications | [À COMPLÉTER] | Informer l'utilisateur d'un événement le concernant | Contenu et statut lu/non lu | — | — | [À COMPLÉTER] | — |
| Recherche publique et limitation de débit | [À COMPLÉTER] | Anti-abus sur `/explore` | Adresse IP, horodatage | Upstash (si activé) | [À COMPLÉTER : région Upstash] | [À COMPLÉTER — court terme attendu] | — |

## A.2 Registre du sous-traitant (art. 30(2))
Sans objet : IFUMB agit comme responsable de traitement vis-à-vis de ses utilisateurs, pas comme sous-traitant d'un tiers.

# B. Contrats de sous-traitance (art. 28(3)) — liste de contrôle

Sous-traitants détectés dans le projet : **Supabase** (hébergement base de données), **Vercel** (hébergement application), **Resend** (envoi d'e-mails transactionnels), **Upstash** (limitation de débit, si activé en production).

Pour chacun, vérifier :
- [ ] Contrat de sous-traitance (DPA) signé, couvrant : objet, durée, nature et finalité du traitement, type de données, catégories de personnes, droits et obligations du responsable.
- [ ] Traitement sur instructions documentées uniquement (y compris pour les transferts).
- [ ] Engagement de confidentialité du personnel du sous-traitant.
- [ ] Mesures de sécurité (art. 32).
- [ ] Conditions de recours à un sous-traitant ultérieur (sous-traitance en cascade).
- [ ] Assistance pour les demandes de droits des personnes concernées.
- [ ] Assistance en cas de violation de données et d'AIPD.
- [ ] Suppression ou restitution des données en fin de contrat.
- [ ] Droit d'information et d'audit.
- [ ] Mécanisme de transfert hors UE documenté (le cas échéant).

[À COMPLÉTER : pour chaque sous-traitant, vérifier que son DPA standard (Supabase, Vercel et Resend publient chacun un Data Processing Agreement standard) a bien été accepté/signé, et conserver la preuve.]

# C. Procédure d'exercice des droits (RGPD art. 12, 15-22)

**État actuel : aucun mécanisme d'export ou de suppression de compte n'existe dans le produit à la date de cet audit.** Cette procédure décrit ce qui doit exister avant que la politique de confidentialité § 6 puisse être publiée sans mention d'écart.

- Point de contact et formulaire : [À COMPLÉTER].
- Vérification d'identité avant traitement d'une demande : [À COMPLÉTER : proportionnée — a priori la vérification de session suffit pour un compte déjà authentifié].
- Délai : un mois, prolongeable de deux mois si complexité (information du demandeur dans le premier mois).
- Contenu de l'export (art. 15) : au minimum les données du compte et des fiches `Member` dont l'utilisateur est l'auteur ou qu'il a revendiquées (`claimedByUserId`).
- Suppression de compte : [À COMPLÉTER — décision produit à prendre : que deviennent les arbres dont l'utilisateur est seul propriétaire ? les fiches qu'il a saisies sur des tiers ? anonymisation plutôt que suppression dans certains cas (préserver la structure de l'arbre pour les autres membres) ?].
- Gratuité, sauf demande manifestement infondée ou excessive.
- Journal des demandes reçues et traitées : [À COMPLÉTER].

# D. Procédure en cas de violation de données (RGPD art. 33-34)

- Détection et signalement interne : [À COMPLÉTER].
- Notification à l'autorité compétente sous 72 heures sauf absence de risque pour les personnes : APD/GBA (Belgique) et/ou APDPVP (Gabon), selon la localisation des personnes concernées — **l'obligation gabonaise est formulée « sans délai »** (loi 025/2023 art. 142), plus stricte que les 72 heures du RGPD.
- Contenu de la notification : nature de la violation, catégories et nombre approximatif de personnes et d'enregistrements concernés ; contact du point de contact vie privée ; conséquences probables ; mesures prises ou proposées.
- Communication aux personnes concernées si risque élevé pour leurs droits et libertés (art. 34 RGPD ; art. 145 loi gabonaise).
- Registre des violations (même celles non notifiées) : [À COMPLÉTER].

# E. Analyse d'impact relative à la protection des données (AIPD, RGPD art. 35)

**Déclencheurs détectés dans le projet** justifiant une AIPD avant toute mise en production élargie :
- Traitement à grande échelle de données sensibles (origine ethnique : tribu/clan/ethnicité).
- Données concernant des mineurs, saisies par un tiers (sans action directe du mineur).
- Arbres publics exposant potentiellement ces données à un public non authentifié (`/explore`).

Décision : [À COMPLÉTER — une AIPD devrait être réalisée avant l'ouverture publique du service, compte tenu du cumul « données sensibles + mineurs + exposition publique possible »]. Contenu attendu : description systématique des traitements et finalités ; nécessité et proportionnalité ; risques pour les droits et libertés des personnes concernées (y compris les tiers non-utilisateurs) ; mesures envisagées pour les réduire ; avis du DPO si désigné ; décision motivée, date et version.
