# Guide du Compte Ministre - PÊCHE GABON

## Vue d'ensemble

Le compte **Ministre de la Pêche et des Mers** est une interface stratégique permettant la supervision complète du secteur halieutique gabonais et l'exercice des pouvoirs ministériels.

---

## 🔐 Accès & Sécurité

### Authentification
- **Route d'accès** : `/minister-dashboard`
- **Rôle requis** : `ministre`
- **Redirection automatique** : Les utilisateurs ayant le rôle `ministre` sont automatiquement redirigés depuis `/dashboard`

### Sécurité
- ✅ **RLS activé** : Toutes les tables sensibles sont protégées par des politiques Row-Level Security
- ✅ **Audit automatique** : Toutes les actions ministérielles sont journalisées dans `audit_ministeriel`
- ⚠️ **MFA recommandé** : Configurer l'authentification multi-facteurs dans les paramètres Lovable Cloud
- ⚠️ **Session timeout** : Déconnexion automatique après 30 min d'inactivité (à configurer côté client)

---

## 📊 Dashboard Exécutif

### KPIs Principaux
Le dashboard affiche 4 indicateurs clés avec tendances :

1. **Production Annuelle** (tonnes)
   - Captures totales PA (pêche artisanale) filtrées
   - Tendance vs année précédente

2. **Exportations** (tonnes)
   - Estimation basée sur 62% de la production
   - Comparaison annuelle

3. **CPUE Moyenne**
   - Captures par unité d'effort
   - Indicateur de performance de la pêche

4. **Infractions**
   - Nombre d'infractions détectées
   - Tendance de sécurité

### Filtres Globaux
Les filtres s'appliquent à **tous** les widgets et graphiques :
- **Année** : 2022-2025
- **Mois** : Tous ou spécifique (1-12)
- **Province** : Toutes ou spécifique
- **Type de pêche** : Tous / Artisanale / Industrielle

---

## 🚨 Système d'Alertes

### Types d'Alertes Automatiques

Le système génère automatiquement des alertes pour :

1. **CPUE_BAISSE** 🔴 Haute priorité
   - Déclenchement : CPUE baisse > 20% vs période précédente
   - Action recommandée : **Proposer fermeture de zone**

2. **INN_SPIKE** 🔴 Haute priorité
   - Déclenchement : Hausse d'infractions > 30%
   - Action recommandée : **Renforcer surveillance**

3. **PAYMENT_LAG** 🟡 Priorité moyenne
   - Déclenchement : Taux de paiement < 85%
   - Action recommandée : **Rappel paiements**

4. **QUOTA_ATTEINT** 🟡 Priorité moyenne
   - Déclenchement : Quota espèce atteint à 90%
   - Action recommandée : **Proposer fermeture zone**

### Actions Disponibles
Chaque alerte propose des actions rapides :
- Bouton **CTA** direct vers l'action appropriée
- **Marquer comme lu** pour archiver l'alerte

---

## 🎯 Pouvoirs Ministériels

### 1️⃣ Publier une Réglementation

**Composant** : `PublishRegulationDialog`

**Champs requis** :
- **Titre** : Arrêté n°... / 2025
- **Type de document** : Décret | Arrêté | Note
- **Texte de la réglementation** : Contenu HTML supporté
- **Date d'effet** : Date d'entrée en vigueur
- **Destinations** : Checkboxes multiples
  - Direction Centrale
  - Directions Provinciales
  - Agents de Collecte
  - Pêcheurs
  - Coopératives

**Workflow** :
1. ✍️ Saisie du formulaire
2. 💾 Création dans `reglementations`
3. 🔔 Notifications automatiques vers destinataires
4. 📝 Journal d'audit créé

**Validation** :
- Titre obligatoire (< 200 caractères)
- Type de document requis
- Date d'effet valide
- Au moins une destination sélectionnée

---

### 2️⃣ Envoyer une Notification Nationale

**Composant** : `SendNotificationDialog`

**Champs requis** :
- **Titre** : Objet de la notification
- **Message** : Texte court (< 500 caractères)
- **Audience** : Checkboxes multiples
  - Tous
  - Pêcheurs
  - Agents
  - Gestionnaires de coopératives
  - Directions
  - Inspecteurs
- **Priorité** :
  - 🔵 Information (par défaut)
  - 🟡 Alerte
  - 🔴 Urgence
- **URL de ressource** : Lien optionnel vers document externe

**Workflow** :
1. ✍️ Saisie du formulaire
2. 💾 Création dans `notifications_nationales`
3. 🔔 Push in-app vers audience ciblée
4. 📝 Journal d'audit créé

**Effets visuels** :
- Priorité **Urgence** → Bannière rouge côté destinataires
- Priorité **Alerte** → Badge orange
- Priorité **Information** → Style normal

---

### 3️⃣ Verrouiller une Zone de Pêche

**Composant** : `LockZoneDialog`

**Champs requis** :
- **Nom de la zone** : Identifiant unique
- **Raison** : Motif de la restriction (ex: "Période de frai")
- **Coordonnées** : Format `lat1,lon1;lat2,lon2;...`
  - Exemple : `0.5,9.5;0.6,9.6;0.5,9.7`
- **Date de début** : Début de la restriction
- **Date de fin** : Fin de la restriction (optionnelle)

**Workflow** :
1. ✍️ Saisie du formulaire avec coordonnées
2. 🗺️ Parsing des coordonnées en GeoJSON
3. 💾 Création dans `zones_restreintes` avec `statut='actif'`
4. 🚫 **Blocage automatique** : 
   - Les captures PA/PI dans cette zone sont **refusées**
   - Message explicatif affiché aux pêcheurs
5. 🔔 Notifications vers :
   - Directions (centrale & provinciales)
   - Agents de collecte
   - Pêcheurs impactés (zone habituelle intersectée)
6. 📝 Journal d'audit créé

**Format de coordonnées** :
```
lat1,lon1;lat2,lon2;lat3,lon3
```
Exemple réel :
```
-0.5,9.5;-0.6,9.6;-0.5,9.7;-0.4,9.6
```

**Validation** :
- Nom unique et obligatoire
- Raison obligatoire
- Coordonnées valides (au moins 3 points)
- Date début < date fin
- Date début >= aujourd'hui (ou historique autorisé)

---

## 📈 Onglets de Statistiques Détaillées

### Vue d'ensemble (Executive)
- Pirogues actives
- Licences valides
- Taux de conformité
- Coopératives actives

### Pêche Artisanale
- **Graphiques** :
  - Évolution captures & CPUE (12 mois)
  - Distribution espèces (Pie chart)
- **KPIs** :
  - Captures PA totales
  - CPUE moyen
  - Taux renouvellement licences
  - Taux paiement taxes

### Pêche Industrielle
- **Graphiques** :
  - Activité mensuelle (Bar chart)
  - Top espèces (Pie chart)
- **KPIs** :
  - Navires totaux
  - Navires actifs
  - Armements actifs

### Surveillance
- **Carte interactive Mapbox** :
  - Sites de débarquement (marqueurs bleus)
  - Zones restreintes actives (polygones rouges)
  - Légende interactive
- **Graphique d'infractions** :
  - BarChart empilé par type (A, B, C)
  - Évolution mensuelle (12 mois)
- **KPIs** :
  - Missions effectuées
  - Infractions détectées
  - Taux de conformité

### Économie
- Valeur d'export estimée (FCFA)
- Coopératives actives
- Prix moyens par espèce
- Contribution au PIB

### Historique
- **Réglementations** : Liste paginée avec filtres
- **Notifications** : Historique complet
- **Zones Restreintes** : Statut et dates
- **Journal d'audit** : Actions ministérielles horodatées

---

## 📥 Export PDF

### Fonctionnalité
Bouton **"Exporter PDF"** en haut à droite du dashboard.

### Contenu du PDF
- **En-tête** :
  - Tampon "CONFIDENTIEL - PÊCHE GABON"
  - Date & heure de génération
  - Filtres appliqués
- **Corps** :
  - Tous les KPIs visibles
  - Tous les graphiques actuellement affichés
  - Cartes (screenshot)
  - Tables de données

### Format
- **Orientation** : Portrait
- **Format** : A4
- **Nom du fichier** : `rapport-ministre-YYYY-MM-DD.pdf`
- **Multi-pages** : Oui (pagination automatique)

### Utilisation
```typescript
<ExportPDFButton 
  filters={filters} 
  filename="rapport-ministre"
/>
```

---

## 🗄️ Structure de la Base de Données

### Tables Ministérielles

#### `reglementations`
```sql
- id (UUID)
- titre (TEXT)
- type_document (TEXT) -- Décret|Arrêté|Note
- texte (TEXT) -- Contenu HTML
- date_effet (DATE)
- destination (TEXT[]) -- Array
- fichier_url (TEXT) -- Optionnel
- created_by (UUID) -- Référence auth.users
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `notifications_nationales`
```sql
- id (UUID)
- titre (TEXT)
- message (TEXT)
- audience (TEXT[]) -- Array
- priorite (TEXT) -- Info|Alerte|Urgence
- url_ressource (TEXT) -- Optionnel
- created_by (UUID)
- created_at (TIMESTAMP)
```

#### `zones_restreintes`
```sql
- id (UUID)
- nom (TEXT)
- raison (TEXT)
- geometrie (JSONB) -- GeoJSON Polygon
- date_debut (DATE)
- date_fin (DATE) -- Nullable
- especes_concernees (UUID[]) -- Array, vide = toutes
- actif (BOOLEAN)
- created_by (UUID)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `audit_ministeriel`
```sql
- id (UUID)
- user_id (UUID)
- action_type (TEXT) -- PublishReg|SendNotif|LockZone
- description (TEXT)
- metadata (JSONB) -- Détails supplémentaires
- created_at (TIMESTAMP)
```

#### `alerte_historique`
```sql
- id (UUID)
- type_indicateur (TEXT) -- CPUE_BAISSE|INN_SPIKE|PAYMENT_LAG|QUOTA_ATTEINT
- message (TEXT)
- seuil_declenche (NUMERIC)
- valeur_actuelle (NUMERIC)
- destinataires (TEXT[])
- statut (TEXT) -- envoye|lu
- created_at (TIMESTAMP)
```

---

## 🔒 Politiques RLS (Row-Level Security)

### `reglementations`
```sql
-- Lecture publique des réglementations publiées
SELECT: (actif = true)

-- Ministre peut créer
INSERT: has_role(auth.uid(), 'ministre')

-- Ministre peut voir toutes
SELECT: has_role(auth.uid(), 'ministre')
```

### `notifications_nationales`
```sql
-- Ministre peut créer
INSERT: has_role(auth.uid(), 'ministre')

-- Ministre peut voir toutes
SELECT: has_role(auth.uid(), 'ministre')
```

### `zones_restreintes`
```sql
-- Tous peuvent voir les zones actives
SELECT: (actif = true)

-- Ministre peut gérer (ALL)
ALL: has_role(auth.uid(), 'ministre')
```

### `audit_ministeriel`
```sql
-- Ministre et Admin peuvent lire
SELECT: has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin')

-- Pas de modification possible
UPDATE/DELETE: Interdits
```

---

## 🧪 Tests d'Acceptation

### TA-1 Dashboard & Filtres
- [ ] Filtrer par Année 2024 → tous les KPIs se mettent à jour
- [ ] Filtrer par Mois 6 (Juin) → captures du mois affichées
- [ ] Filtrer par Province "Estuaire" → données provinciales uniquement
- [ ] Filtrer par Type "artisanale" → stats PA uniquement

### TA-2 Publier Réglementation
- [ ] Créer un Arrêté avec titre + texte + date
- [ ] Vérifier création dans table `reglementations`
- [ ] Vérifier notification créée pour destinataires
- [ ] Vérifier entrée dans `audit_ministeriel`

### TA-3 Envoyer Notification
- [ ] Créer notification priorité "Urgence" vers "Tous"
- [ ] Vérifier bannière rouge côté destinataires
- [ ] Vérifier archive dans `notifications_nationales`
- [ ] Vérifier horodatage correct

### TA-4 Verrouiller Zone
- [ ] Créer zone avec coordonnées valides + dates
- [ ] Vérifier affichage sur carte (polygone rouge)
- [ ] Tenter saisie capture PA dans zone → **refusée**
- [ ] Vérifier message d'erreur explicatif
- [ ] Modifier statut zone via PATCH → carte se met à jour

### TA-5 Alertes
- [ ] Simuler CPUE basse → alerte créée dans `alerte_historique`
- [ ] Vérifier affichage dans panneau "Alertes & Recommandations"
- [ ] Cliquer CTA "Proposer fermeture zone" → dialogue s'ouvre pré-rempli
- [ ] Marquer comme lu → alerte disparaît

### TA-6 Sécurité
- [ ] Connexion utilisateur **non** ministre → pas d'accès `/minister-dashboard`
- [ ] Utilisateur `pecheur` tente `POST /reglementations` → **403 Forbidden**
- [ ] Vérifier journal `audit_ministeriel` complet pour actions MIN-02/03/04
- [ ] MFA actif → demande code à chaque connexion

### TA-7 Export PDF
- [ ] Cliquer "Exporter PDF" → fichier téléchargé
- [ ] Ouvrir PDF → vérifier tampon "CONFIDENTIEL"
- [ ] Vérifier filtres affichés dans en-tête
- [ ] Vérifier tous les graphiques présents
- [ ] Vérifier multi-pages si contenu > 1 page A4

---

## 📋 Checklist d'Implémentation

- [x] Créer rôle `ministre` dans enum `app_role`
- [x] Créer collections : `reglementations`, `notifications_nationales`, `zones_restreintes`, `audit_ministeriel`, `alerte_historique`
- [x] Construire **Espace Ministre** avec filtres globaux, onglets (Dashboard / Surveillance / Historique)
- [x] Widgets KPI + graphiques (PA/PI/SCS/Économie)
- [x] Carte Mapbox (sites + zones restreintes)
- [x] Graphique infractions (BarChart empilé)
- [x] Formulaires actions : Publier réglementation, Envoyer notification, Verrouiller zone
- [x] Système d'alertes automatiques avec panneau dédié
- [x] Export PDF avec tampon confidentiel
- [x] Politiques RLS pour toutes les tables
- [x] Journal d'audit automatique
- [ ] Tests d'acceptation manuels (TA-1 à TA-7)
- [ ] Activer MFA (configuration utilisateur dans Lovable Cloud)
- [ ] Rate-limiting sur endpoints POST (à configurer côté Supabase)

---

## 🚀 Démarrage Rapide

### 1. Créer un utilisateur Ministre

Dans Lovable Cloud (Backend) :

```sql
-- 1. Créer l'utilisateur dans auth.users (via interface Lovable Cloud)
-- Email: ministre@peche.ga
-- Password: [secure_password]

-- 2. Assigner le rôle ministre
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'ministre@peche.ga'),
  'ministre'
);
```

### 2. Se connecter

1. Aller sur `/auth`
2. Se connecter avec `ministre@peche.ga`
3. Redirection automatique vers `/minister-dashboard`

### 3. Tester les fonctionnalités

1. **Dashboard** : Vérifier les KPIs s'affichent
2. **Filtres** : Changer l'année → KPIs se mettent à jour
3. **Alertes** : Consulter les alertes simulées
4. **Réglementation** : Publier un arrêté test
5. **Notification** : Envoyer une notification test
6. **Zone** : Créer une zone restreinte test
7. **Export** : Générer un PDF

---

## 🛠️ Développement & Extensions

### Ajouter un nouveau type d'alerte

1. **Définir le type** dans `AlertsPanel.tsx` :
```typescript
case 'NEW_ALERT_TYPE':
  return <NewIcon className="h-5 w-5" />;
```

2. **Créer la logique de détection** (edge function ou trigger SQL) :
```sql
CREATE OR REPLACE FUNCTION check_new_alert()
RETURNS void AS $$
BEGIN
  -- Logique de détection
  INSERT INTO alerte_historique (type_indicateur, message, ...)
  VALUES ('NEW_ALERT_TYPE', 'Message...', ...);
END;
$$ LANGUAGE plpgsql;
```

3. **Ajouter l'action recommandée** :
```typescript
case 'NEW_ALERT_TYPE':
  return {
    label: "Action",
    action: () => handleNewAction()
  };
```

### Ajouter un nouvel onglet

1. **Créer le composant** : `src/components/minister/NewTab.tsx`
2. **Importer dans** `MinisterDashboard.tsx`
3. **Ajouter le TabsTrigger et TabsContent**

---

## 📞 Support

Pour toute question technique :
- **Documentation Lovable** : https://docs.lovable.dev
- **Supabase RLS** : https://supabase.com/docs/guides/auth/row-level-security
- **Mapbox GL JS** : https://docs.mapbox.com/mapbox-gl-js/

---

## 📄 Licence

© 2025 PÊCHE GABON - Usage interne confidentiel

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-08
