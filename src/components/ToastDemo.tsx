import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";

/**
 * Composant de démonstration du système de notifications toast unifié
 * Peut être intégré dans les pages de paramètres ou de documentation
 */
export const ToastDemo = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Système de Notifications Toast</CardTitle>
        <CardDescription>
          Testez les différents types de notifications disponibles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notifications de base */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Notifications de base</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => toast.success("Opération réussie", "Les données ont été enregistrées")}
              className="border-green-500 text-green-700 hover:bg-green-50"
            >
              Succès
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast.error("Une erreur est survenue", "Veuillez réessayer plus tard")}
              className="border-red-500 text-red-700 hover:bg-red-50"
            >
              Erreur
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast.info("Nouvelle information", "Les données ont été mises à jour")}
              className="border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              Info
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast.warning("Attention", "Cette action nécessite une confirmation")}
              className="border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              Avertissement
            </Button>
          </div>
        </div>

        {/* Messages pré-configurés - Opérations CRUD */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Opérations CRUD</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.saveSuccess()}
            >
              Sauvegarde
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.createSuccess()}
            >
              Création
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.updateSuccess()}
            >
              Mise à jour
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.deleteSuccess()}
            >
              Suppression
            </Button>
          </div>
        </div>

        {/* Messages pré-configurés - Authentification */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Authentification</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.loginSuccess()}
            >
              Connexion
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.logoutSuccess()}
            >
              Déconnexion
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.permissionDenied()}
            >
              Accès refusé
            </Button>
          </div>
        </div>

        {/* Messages pré-configurés - Import/Export */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Import/Export</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.importSuccess(25)}
            >
              Import
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.exportSuccess()}
            >
              Export
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.downloadSuccess()}
            >
              Téléchargement
            </Button>
          </div>
        </div>

        {/* Messages pré-configurés - Paiements */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Paiements</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.paymentSuccess()}
            >
              Paiement validé
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.paymentPending()}
            >
              En attente
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.paymentError()}
            >
              Échec
            </Button>
          </div>
        </div>

        {/* Messages pré-configurés - Autres */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Autres</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.processing()}
            >
              Traitement
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.networkError()}
            >
              Erreur réseau
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.comingSoon()}
            >
              Bientôt disponible
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => toast.messages.validationError("Le champ email est invalide")}
            >
              Validation
            </Button>
          </div>
        </div>

        {/* Guide d'utilisation */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Guide d'utilisation</h4>
          <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`// Import du système toast unifié
import { toast } from "@/lib/toast";

// Notifications de base
toast.success("Titre", "Description");
toast.error("Titre", "Description");
toast.info("Titre", "Description");
toast.warning("Titre", "Description");

// Messages pré-configurés
toast.messages.saveSuccess();
toast.messages.loginError();
toast.messages.importSuccess(count);

// Toast personnalisé avancé
toast.custom({
  title: "Titre personnalisé",
  description: "Description",
  duration: 5000,
  className: "custom-class"
});`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
