# Système de Design Unifié - PÊCHE GABON

## Vue d'ensemble

Le système de design unifié standardise l'apparence et le comportement de tous les espaces utilisateurs tout en permettant une personnalisation par rôle. Tous les dashboards partagent la même charte graphique, les mêmes espacements, typographie et animations.

## Architecture

### Composants Principaux

1. **DashboardLayout** (`src/components/layouts/DashboardLayout.tsx`)
   - Layout principal unifié pour tous les dashboards
   - Gère le header, sidebar, footer et contenu principal
   - S'adapte automatiquement au rôle de l'utilisateur

2. **DashboardHeader** (`src/components/layouts/DashboardHeader.tsx`)
   - Header standardisé avec logo, badge de rôle, et actions
   - Intègre: toggle sidebar, sélecteur de langue, toggle thème, paramètres, déconnexion

3. **DashboardSidebar** (`src/components/layouts/DashboardSidebar.tsx`)
   - Navigation latérale adaptative par rôle
   - Collapsible avec icônes uniquement en mode réduit
   - Items de navigation configurables par rôle

4. **RoleConfig** (`src/lib/roleConfig.ts`)
   - Configuration centralisée des rôles
   - Définit: label, icône, couleurs, route, catégorie pour chaque rôle
   - Fonction `getUserPrimaryRole()` pour obtenir le rôle principal

## Charte Graphique

### Couleurs par Rôle

Chaque rôle a une couleur d'accent unique définie dans `roleConfig.ts`:

| Rôle | Gradient | Accent |
|------|----------|--------|
| ministre | purple-500 to indigo-600 | purple |
| admin | red-500 to rose-600 | red |
| super_admin | slate-900 to zinc-900 | slate |
| dgpa | blue-500 to cyan-600 | blue |
| anpa | green-500 to emerald-600 | green |
| agasa | orange-500 to red-600 | orange |
| pecheur | cyan-500 to blue-500 | cyan |
| cooperative | indigo-500 to purple-500 | indigo |
| armateur_pi | slate-600 to gray-700 | slate |

### Espacements Standards

```css
/* Container padding */
padding: 1.5rem (p-6)

/* Spacing entre sections */
gap: 1.5rem (space-y-6)

/* Card padding */
padding: 1rem (p-4)

/* Header height */
height: 4rem (h-16)
```

### Typographie

```css
/* Titre principal */
h1: text-3xl font-bold

/* Sous-titre */
p: text-muted-foreground

/* Badge rôle */
Badge: text-xs mt-0.5
```

### Animations

- **fade-in**: Apparition du contenu (0.3s ease-out)
- **hover**: Transitions sur boutons et liens (0.2s)
- **sidebar**: Collapse/expand fluide

## Migration des Dashboards

### Template de Migration

Pour migrer un dashboard existant vers le système unifié:

**AVANT:**
```tsx
export default function MonDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mon Dashboard</h1>
        <p className="text-muted-foreground">Description</p>
      </div>
      
      {/* Contenu du dashboard */}
    </div>
  );
}
```

**APRÈS:**
```tsx
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function MonDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mon Dashboard</h1>
          <p className="text-muted-foreground">Description</p>
        </div>
        
        {/* Contenu du dashboard - IDENTIQUE */}
      </div>
    </DashboardLayout>
  );
}
```

### Étapes de Migration

1. **Importer DashboardLayout**
   ```tsx
   import { DashboardLayout } from "@/components/layouts/DashboardLayout";
   ```

2. **Wrapper le contenu**
   - Remplacer `<div className="container mx-auto p-6 space-y-6">` par `<DashboardLayout>`
   - Garder `<div className="space-y-6">` pour l'espacement interne

3. **Supprimer le header custom** (si présent)
   - Le DashboardLayout fournit déjà un header unifié
   - Supprimer les anciens composants de navigation

4. **Vérifier la navigation**
   - Ajouter les routes dans `DashboardSidebar.tsx` via `getNavigationItems()`

## Dashboards à Migrer

### ✅ Migrés
- [x] ArmeurDashboard.tsx
- [x] CooperativeDashboard.tsx
- [x] Dashboard.tsx (Pêcheur)
- [x] DGPADashboard.tsx
- [x] ANPADashboard.tsx
- [x] AGASADashboard.tsx
- [x] DGMMDashboard.tsx
- [x] OPRAGDashboard.tsx
- [x] ANPNDashboard.tsx
- [x] DGDDIDashboard.tsx
- [x] COREPDashboard.tsx

### 🚫 Exceptions
- MinisterLayout - A déjà son propre layout sophistiqué
- Admin - A déjà son propre layout
- SuperAdminDashboard - A déjà son propre layout

## Personnalisation par Rôle

### Navigation Personnalisée

Pour ajouter/modifier les items de navigation d'un rôle, éditer `getNavigationItems()` dans `DashboardSidebar.tsx`:

```tsx
const roleNavigation: Record<string, Array<{ title: string; url: string; icon: any }>> = {
  mon_role: [
    { title: "Accueil", url: "/", icon: Home },
    { title: "Mon Item", url: "/ma-route", icon: MonIcone },
    // ...
  ],
};
```

### Couleurs Personnalisées

Pour modifier les couleurs d'un rôle, éditer `roleConfigs` dans `roleConfig.ts`:

```tsx
mon_role: {
  role: 'mon_role',
  label: 'Mon Rôle',
  icon: MonIcone,
  color: 'from-ma-couleur-500 to-ma-couleur-600', // Gradient
  accentColor: 'ma-couleur', // Couleur d'accent
  dashboardRoute: '/ma-route',
  category: 'ma-categorie',
}
```

## Avantages du Système Unifié

### Pour les Utilisateurs
- **Cohérence**: Même expérience sur tous les dashboards
- **Familiarité**: Navigation identique facilite l'apprentissage
- **Accessibilité**: Thème sombre/clair, langues multiples
- **Performance**: Animations fluides, chargement optimisé

### Pour les Développeurs
- **DRY**: Pas de duplication de code
- **Maintenabilité**: Modifications centralisées
- **Extensibilité**: Ajout facile de nouveaux rôles
- **Testabilité**: Composants réutilisables

## Bonnes Pratiques

### DO ✅
- Utiliser DashboardLayout pour tous les nouveaux dashboards
- Suivre la hiérarchie typographique (h1, h2, etc.)
- Utiliser les couleurs sémantiques (primary, muted, etc.)
- Respecter les espacements standards (p-6, space-y-6)
- Tester en mode clair ET sombre

### DON'T ❌
- Créer des layouts custom pour chaque dashboard
- Utiliser des couleurs hardcodées (white, black)
- Dupliquer le code de navigation
- Ignorer les animations (rend l'UI moins fluide)
- Oublier les traductions multilingues

## Support

Pour toute question sur le système de design unifié, consulter:
- Ce document
- Le code source des composants de layout
- Les exemples migrés (ArmeurDashboard, CooperativeDashboard)
