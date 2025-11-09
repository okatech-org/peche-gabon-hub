# Système de Notifications Toast Unifié - PÊCHE GABON

## Vue d'ensemble

Le système de notifications toast unifié fournit une interface cohérente pour afficher des alertes contextuelles dans tous les dashboards de l'application PÊCHE GABON.

## Caractéristiques

- ✅ **4 types de notifications** : Succès, Erreur, Info, Avertissement
- ✅ **Messages pré-configurés** pour les opérations courantes (CRUD, auth, paiements, etc.)
- ✅ **Animations fluides** avec transitions en douceur
- ✅ **Positionnement standardisé** en haut à droite
- ✅ **Support thème sombre/clair** avec couleurs adaptatives
- ✅ **Durées personnalisables** selon le type de notification
- ✅ **API simple et intuitive** pour tous les développeurs

## Installation

Le système est déjà intégré dans tous les dashboards via le `DashboardLayout`. Aucune configuration supplémentaire n'est nécessaire.

## Utilisation de base

### Import

```typescript
import { toast } from "@/lib/toast";
```

### Notifications simples

```typescript
// Succès
toast.success("Opération réussie", "Les données ont été enregistrées");

// Erreur
toast.error("Erreur", "Une erreur est survenue");

// Information
toast.info("Information", "Les données ont été mises à jour");

// Avertissement
toast.warning("Attention", "Cette action nécessite confirmation");
```

### Notifications avec titre uniquement

```typescript
toast.success("Enregistré !");
toast.error("Erreur réseau");
```

### Durée personnalisée

```typescript
// Par défaut :
// - Succès : 3000ms (3s)
// - Erreur : 5000ms (5s)
// - Info : 3000ms (3s)
// - Avertissement : 4000ms (4s)

// Personnaliser la durée
toast.success("Titre", "Description", 2000); // 2 secondes
toast.error("Titre", "Description", 10000); // 10 secondes
```

## Messages pré-configurés

Le système fournit des messages pré-configurés pour les actions courantes :

### Opérations CRUD

```typescript
// Enregistrement
toast.messages.saveSuccess();
toast.messages.saveError();

// Création
toast.messages.createSuccess();
toast.messages.createError();

// Mise à jour
toast.messages.updateSuccess();
toast.messages.updateError();

// Suppression
toast.messages.deleteSuccess();
toast.messages.deleteError();
```

### Authentification

```typescript
toast.messages.loginSuccess();
toast.messages.loginError();
toast.messages.logoutSuccess();
toast.messages.permissionDenied();
```

### Import/Export

```typescript
// Import avec nombre d'éléments
toast.messages.importSuccess(25); // "25 élément(s) importé(s)"
toast.messages.importSuccess(); // Message générique
toast.messages.importError();

// Export
toast.messages.exportSuccess();
toast.messages.exportError();

// Téléchargement
toast.messages.downloadSuccess();
toast.messages.downloadError();
```

### Paiements

```typescript
toast.messages.paymentSuccess();
toast.messages.paymentPending();
toast.messages.paymentError();
```

### Autres

```typescript
toast.messages.processing();
toast.messages.networkError();
toast.messages.comingSoon();
toast.messages.validationError("Le champ email est invalide");
```

## Exemples pratiques

### Formulaire de sauvegarde

```typescript
const handleSave = async (data: FormData) => {
  try {
    await saveData(data);
    toast.messages.saveSuccess();
  } catch (error) {
    toast.messages.saveError();
  }
};
```

### Import de fichier

```typescript
const handleImport = async (file: File) => {
  try {
    const result = await importFile(file);
    toast.messages.importSuccess(result.count);
  } catch (error) {
    toast.messages.importError();
  }
};
```

### Validation de formulaire

```typescript
const handleSubmit = (data: FormData) => {
  if (!data.email) {
    toast.messages.validationError("L'email est requis");
    return;
  }
  
  if (!data.password) {
    toast.messages.validationError("Le mot de passe est requis");
    return;
  }
  
  // Soumission du formulaire
};
```

### Opération asynchrone

```typescript
const handleProcess = async () => {
  toast.messages.processing();
  
  try {
    await longOperation();
    toast.success("Terminé", "L'opération s'est terminée avec succès");
  } catch (error) {
    toast.error("Échec", "L'opération a échoué");
  }
};
```

## Toast personnalisé avancé

Pour des cas d'usage avancés, utilisez l'API `toast.custom` :

```typescript
toast.custom({
  title: "Titre personnalisé",
  description: "Description détaillée",
  duration: 5000,
  className: "border-purple-500 bg-purple-50 dark:bg-purple-950/50",
  // Autres options de ToastProps
});
```

## Couleurs par type

Le système utilise des couleurs sémantiques cohérentes :

| Type | Couleur | Usage |
|------|---------|-------|
| **Succès** | Vert | Opérations réussies, confirmations |
| **Erreur** | Rouge | Erreurs, échecs, problèmes critiques |
| **Info** | Bleu | Informations neutres, mises à jour |
| **Avertissement** | Ambre/Orange | Alertes, confirmations nécessaires |

## Composant de démonstration

Un composant `ToastDemo` est disponible pour tester tous les types de notifications :

```typescript
import { ToastDemo } from "@/components/ToastDemo";

// Dans votre page de paramètres ou documentation
<ToastDemo />
```

## Bonnes pratiques

### ✅ À faire

- Utiliser des titres courts et explicites
- Fournir des descriptions claires pour les erreurs
- Choisir la durée appropriée selon l'importance
- Utiliser les messages pré-configurés quand possible
- Adapter la durée pour les messages importants (erreurs : plus long)

### ❌ À éviter

- Messages trop longs ou techniques
- Afficher plusieurs toasts simultanément (limite: 1)
- Durées trop courtes pour les erreurs (<3s)
- Utiliser le mauvais type de notification
- Messages génériques sans contexte

## Exemples par Dashboard

### Dashboard Pêcheur

```typescript
// Déclaration de capture
const declareCapture = async (data: CaptureData) => {
  try {
    await supabase.from('captures_pa').insert(data);
    toast.messages.saveSuccess();
  } catch (error) {
    toast.messages.saveError();
  }
};
```

### Dashboard Admin

```typescript
// Création d'utilisateur
const createUser = async (userData: UserData) => {
  try {
    await supabase.from('users').insert(userData);
    toast.success("Utilisateur créé", `${userData.email} a été ajouté avec succès`);
  } catch (error) {
    toast.error("Erreur de création", "Impossible de créer l'utilisateur");
  }
};
```

### Dashboard Coopérative

```typescript
// Paiement groupé
const processGroupPayment = async (payments: Payment[]) => {
  toast.messages.processing();
  
  try {
    await processPayments(payments);
    toast.messages.paymentSuccess();
  } catch (error) {
    toast.messages.paymentError();
  }
};
```

## Architecture technique

### Fichiers concernés

- `src/lib/toast.ts` - Système toast unifié et helpers
- `src/hooks/use-toast.ts` - Hook React pour gestion des toasts
- `src/components/ui/toast.tsx` - Composant Toast shadcn/ui
- `src/components/ui/toaster.tsx` - Provider et viewport
- `src/components/layouts/DashboardLayout.tsx` - Intégration dans tous les dashboards
- `src/components/ToastDemo.tsx` - Composant de démonstration

### Configuration

Le système utilise les variables CSS du thème pour s'adapter automatiquement au mode clair/sombre :

```css
/* Les classes sont appliquées automatiquement selon le type */
.border-green-500 /* Succès */
.border-red-500   /* Erreur */
.border-blue-500  /* Info */
.border-amber-500 /* Avertissement */
```

## Accessibilité

- ✅ Support clavier complet (ESC pour fermer)
- ✅ Annonces ARIA pour lecteurs d'écran
- ✅ Contraste de couleurs conforme WCAG 2.1
- ✅ Animations respectueuses de `prefers-reduced-motion`

## Compatibilité

- ✅ Tous les navigateurs modernes
- ✅ Mobile responsive
- ✅ Mode sombre/clair
- ✅ Tous les rôles utilisateurs

## Support

Pour toute question ou suggestion d'amélioration du système toast, consultez :
- Ce document
- Le code source dans `src/lib/toast.ts`
- Le composant de démonstration `ToastDemo`
