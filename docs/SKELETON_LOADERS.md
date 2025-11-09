# Skeleton Loaders - Guide d'Utilisation

Ce guide explique comment utiliser les skeleton loaders dans les dashboards pour améliorer l'expérience utilisateur pendant le chargement des données.

## Composants Disponibles

### 1. TableSkeleton
Pour les tableaux de données.

```tsx
import { TableSkeleton } from "@/components/skeletons";

<TableSkeleton 
  rows={5}           // Nombre de lignes (défaut: 5)
  columns={4}        // Nombre de colonnes (défaut: 4)
  showHeader={true}  // Afficher l'en-tête de la card (défaut: true)
/>
```

### 2. CardSkeleton
Pour les cartes de statistiques individuelles.

```tsx
import { CardSkeleton } from "@/components/skeletons";

<CardSkeleton 
  showIcon={true}  // Afficher l'icône (défaut: true)
  lines={2}        // Nombre de lignes de texte (défaut: 2)
/>
```

### 3. ChartSkeleton
Pour les graphiques.

```tsx
import { ChartSkeleton } from "@/components/skeletons";

<ChartSkeleton 
  type="bar"         // "bar", "line", ou "pie" (défaut: "bar")
  showLegend={true}  // Afficher la légende (défaut: true)
/>
```

### 4. StatCardsSkeleton
Pour une grille de cartes de statistiques.

```tsx
import { StatCardsSkeleton } from "@/components/skeletons";

<StatCardsSkeleton count={4} />  // Nombre de cartes (défaut: 4)
```

### 5. ListSkeleton
Pour les listes d'éléments.

```tsx
import { ListSkeleton } from "@/components/skeletons";

<ListSkeleton 
  items={5}          // Nombre d'items (défaut: 5)
  showAvatar={false} // Afficher les avatars (défaut: false)
/>
```

### 6. DashboardSkeleton
Skeleton complet pour un dashboard.

```tsx
import { DashboardSkeleton } from "@/components/skeletons";

<DashboardSkeleton layout="default" />  // "default", "minister", ou "admin"
```

## Exemples d'Utilisation

### Exemple 1: Dashboard avec Chargement Conditionnel

```tsx
import { useState, useEffect } from "react";
import { DashboardSkeleton } from "@/components/skeletons";

function MyDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <DashboardSkeleton layout="default" />;
  }

  return (
    <div>
      {/* Votre contenu réel */}
    </div>
  );
}
```

### Exemple 2: Composants Individuels

```tsx
import { StatCardsSkeleton, TableSkeleton, ChartSkeleton } from "@/components/skeletons";

function Dashboard() {
  const { isLoading: statsLoading } = useQuery('stats', fetchStats);
  const { isLoading: tableLoading } = useQuery('table', fetchTableData);
  const { isLoading: chartLoading } = useQuery('chart', fetchChartData);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {statsLoading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {/* Vos cartes de stats */}
        </div>
      )}

      {/* Chart */}
      {chartLoading ? (
        <ChartSkeleton type="bar" />
      ) : (
        <YourChart data={chartData} />
      )}

      {/* Table */}
      {tableLoading ? (
        <TableSkeleton rows={10} columns={5} />
      ) : (
        <YourTable data={tableData} />
      )}
    </div>
  );
}
```

### Exemple 3: Hook Personnalisé pour Temps de Chargement Minimal

```tsx
import { useLoadingState } from "@/hooks/useLoadingState";
import { DashboardSkeleton } from "@/components/skeletons";

function Dashboard() {
  const { isLoading, setIsLoading } = useLoadingState({ 
    minimumLoadingTime: 500  // ms
  });

  useEffect(() => {
    fetchData().then(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return <div>{/* Contenu */}</div>;
}
```

### Exemple 4: React Query Integration

```tsx
import { useQuery } from "@tanstack/react-query";
import { TableSkeleton, ChartSkeleton } from "@/components/skeletons";

function AnalyticsDashboard() {
  const { data: tableData, isLoading: tableLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['charts'],
    queryFn: fetchCharts
  });

  return (
    <div className="space-y-6">
      {chartLoading ? (
        <ChartSkeleton type="line" />
      ) : (
        <LineChart data={chartData} />
      )}

      {tableLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
        <DataTable data={tableData} />
      )}
    </div>
  );
}
```

## Bonnes Pratiques

1. **Temps de chargement minimal**: Utilisez le hook `useLoadingState` pour garantir un temps minimal d'affichage du skeleton, évitant les flashs d'interface.

2. **Correspondance visuelle**: Assurez-vous que le skeleton correspond à la structure réelle du contenu pour une transition fluide.

3. **Paramètres adaptés**: Ajustez le nombre de lignes/colonnes pour correspondre à vos données réelles.

4. **Chargement progressif**: Chargez les différentes sections indépendamment au lieu d'un seul gros skeleton pour tout le dashboard.

5. **Animation**: Les skeletons incluent déjà des animations pulse. Ne les superposez pas avec d'autres animations.

## Personnalisation

Pour personnaliser l'apparence des skeletons, vous pouvez:

1. Modifier les classes Tailwind dans les composants skeleton
2. Ajuster les durées d'animation dans `tailwind.config.ts`
3. Créer vos propres variantes en étendant les composants existants

## Accessibilité

Les skeletons utilisent les bonnes pratiques d'accessibilité:
- Aria-labels appropriés
- Animations respectant `prefers-reduced-motion`
- Contraste suffisant avec le fond

## Performance

Les skeletons sont légers et optimisés:
- Pas de dépendances externes
- Rendu rapide
- CSS minimal avec Tailwind
