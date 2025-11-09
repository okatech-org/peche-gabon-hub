import { toast as baseToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";

/**
 * Système de notifications toast unifié pour PÊCHE GABON
 * Fournit des méthodes standardisées pour afficher des notifications cohérentes
 */

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

/**
 * Affiche une notification de succès
 * @param title - Titre de la notification (optionnel)
 * @param description - Description détaillée (optionnel)
 * @param duration - Durée d'affichage en ms (défaut: 3000)
 */
export const showSuccess = (title?: string, description?: string, duration = 3000) => {
  return baseToast({
    title: title || "Succès",
    description,
    duration,
    className: "border-green-500 bg-green-50 dark:bg-green-950/50 text-green-900 dark:text-green-100",
  });
};

/**
 * Affiche une notification d'erreur
 * @param title - Titre de la notification (optionnel)
 * @param description - Description détaillée (optionnel)
 * @param duration - Durée d'affichage en ms (défaut: 5000)
 */
export const showError = (title?: string, description?: string, duration = 5000) => {
  return baseToast({
    title: title || "Erreur",
    description,
    duration,
    className: "border-red-500 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-100",
  });
};

/**
 * Affiche une notification d'information
 * @param title - Titre de la notification (optionnel)
 * @param description - Description détaillée (optionnel)
 * @param duration - Durée d'affichage en ms (défaut: 3000)
 */
export const showInfo = (title?: string, description?: string, duration = 3000) => {
  return baseToast({
    title: title || "Information",
    description,
    duration,
    className: "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100",
  });
};

/**
 * Affiche une notification d'avertissement
 * @param title - Titre de la notification (optionnel)
 * @param description - Description détaillée (optionnel)
 * @param duration - Durée d'affichage en ms (défaut: 4000)
 */
export const showWarning = (title?: string, description?: string, duration = 4000) => {
  return baseToast({
    title: title || "Attention",
    description,
    duration,
    className: "border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-100",
  });
};

/**
 * Notifications pré-configurées pour actions courantes
 */
export const toastMessages = {
  // Opérations CRUD
  saveSuccess: () => showSuccess("Enregistré", "Les modifications ont été enregistrées avec succès"),
  saveError: () => showError("Erreur d'enregistrement", "Impossible d'enregistrer les modifications"),
  
  deleteSuccess: () => showSuccess("Supprimé", "L'élément a été supprimé avec succès"),
  deleteError: () => showError("Erreur de suppression", "Impossible de supprimer l'élément"),
  
  createSuccess: () => showSuccess("Créé", "L'élément a été créé avec succès"),
  createError: () => showError("Erreur de création", "Impossible de créer l'élément"),
  
  updateSuccess: () => showSuccess("Mis à jour", "Les données ont été mises à jour avec succès"),
  updateError: () => showError("Erreur de mise à jour", "Impossible de mettre à jour les données"),
  
  // Authentification
  loginSuccess: () => showSuccess("Connexion réussie", "Bienvenue sur PÊCHE GABON"),
  loginError: () => showError("Erreur de connexion", "Identifiants incorrects"),
  logoutSuccess: () => showInfo("Déconnexion", "À bientôt !"),
  
  // Téléchargements
  downloadSuccess: () => showSuccess("Téléchargement réussi", "Le fichier a été téléchargé"),
  downloadError: () => showError("Erreur de téléchargement", "Impossible de télécharger le fichier"),
  
  // Imports/Exports
  importSuccess: (count?: number) => showSuccess(
    "Import réussi", 
    count ? `${count} élément(s) importé(s) avec succès` : "Les données ont été importées"
  ),
  importError: () => showError("Erreur d'import", "Impossible d'importer les données"),
  
  exportSuccess: () => showSuccess("Export réussi", "Le fichier a été généré"),
  exportError: () => showError("Erreur d'export", "Impossible de générer le fichier"),
  
  // Permissions
  permissionDenied: () => showError("Accès refusé", "Vous n'avez pas les permissions nécessaires"),
  
  // Réseau
  networkError: () => showError("Erreur réseau", "Vérifiez votre connexion internet"),
  
  // Validation
  validationError: (message?: string) => showWarning(
    "Erreur de validation", 
    message || "Veuillez vérifier les champs du formulaire"
  ),
  
  // Paiements
  paymentSuccess: () => showSuccess("Paiement validé", "Le paiement a été enregistré avec succès"),
  paymentPending: () => showInfo("Paiement en attente", "Le paiement est en cours de traitement"),
  paymentError: () => showError("Erreur de paiement", "Le paiement a échoué"),
  
  // Notifications génériques
  processing: () => showInfo("Traitement en cours", "Veuillez patienter..."),
  comingSoon: () => showInfo("Bientôt disponible", "Cette fonctionnalité sera bientôt disponible"),
};

/**
 * Toast unifié avec toutes les méthodes
 */
export const toast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  messages: toastMessages,
  // Expose la fonction toast de base pour des cas avancés
  custom: baseToast,
};
