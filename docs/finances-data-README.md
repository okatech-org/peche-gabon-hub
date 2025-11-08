# Livrable Lovable – PÊCHE GABON (Finances & Statistiques)
Date de génération : 2025-11-08 20:57 UTC

Ce pack contient :
- `/analytics` : jeux de données **nettoyés et agrégés** (CSV) prêts à être **importés dans Lovable** pour construire des tableaux de bord.
- `/raw` : exports bruts (CSV) des feuilles sources du classeur `peche_gabon.xlsm`.
- `/docs/lovable_prompt.txt` : un prompt prêt à copier-coller dans Lovable pour générer automatiquement une application **dashboard** (pages, graphiques, filtres).
- Ce `README` (conseils d’import et prise en main).

## Comment l'utiliser dans Lovable (méthode simple)
1. Allez sur Lovable et créez un nouveau projet.
2. **Glissez-déposez** le dossier `/analytics` (ou les CSV clés) dans l’interface Lovable pour que la plateforme génère une base de dashboard.
3. Copiez-collez le contenu de `docs/lovable_prompt.txt` dans le chat Lovable pour structurer l'appli (pages, KPIs, graphiques).
4. Personnalisez titres, couleurs et logos si besoin.
5. Déployez.

## Jeux de données principaux
- `analytics/finances_quittances_mensuel.csv` : total des quittances **par mois**.
- `analytics/quittances_sommes_par_colonne.csv` : vérifications de cohérence des colonnes montants.
- `analytics/exportation_resume_numerique.csv`, `analytics/valeur_resume_numerique.csv`, `analytics/demandes_resume_numerique.csv` : agrégats par colonne numérique (sommes, min, max, moyennes).
- `analytics/previsions_scenarios_synthese.csv` : synthèse des feuilles de **prévisions** et **scénarios** (somme des colonnes numériques).
- `analytics/indicateurs_cles.csv` : KPI globaux calculés (ex. total quittances).

> Remarque : certaines feuilles sources utilisent des entêtes ou plages complexes (ex. colonnes “Unnamed”). Les CSV agrégés évitent ces artefacts et sont prêts pour une utilisation dans un outil de visualisation.

## Conseils
- Si vous avez des **champions** (taxes spécifiques, catégories d’autorisations, espèces), indiquez-les à Lovable dans le prompt pour créer des vues dédiées.
- En cas d’évolution du classeur (nouveaux mois/années), régénérez ce pack pour garder le dashboard synchrone.
