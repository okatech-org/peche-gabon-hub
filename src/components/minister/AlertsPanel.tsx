import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  TrendingDown, 
  Shield, 
  DollarSign,
  Target,
  MapPin,
  Bell
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LockZoneDialog from "./LockZoneDialog";

interface AlertItem {
  id: string;
  type_indicateur: string;
  message: string;
  seuil_declenche: number;
  valeur_actuelle: number;
  statut: string;
  created_at: string;
  severity: 'high' | 'medium' | 'low';
}

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLockZoneDialog, setShowLockZoneDialog] = useState(false);

  useEffect(() => {
    loadAlerts();
    
    // Refresh alerts every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("alerte_historique")
        .select("*")
        .eq("statut", "envoye")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Ajouter des alertes simulées pour démonstration
      const alertsWithSeverity: AlertItem[] = (data || []).map(alert => ({
        ...alert,
        severity: getSeverity(alert.type_indicateur, alert.valeur_actuelle, alert.seuil_declenche)
      }));

      // Ajouter des alertes prédéfinies si pas assez de données
      if (alertsWithSeverity.length < 3) {
        const simulatedAlerts: AlertItem[] = [
          {
            id: "sim-1",
            type_indicateur: "CPUE_BAISSE",
            message: "CPUE en baisse de 23% pour les sardinelles dans la zone d'Owendo",
            seuil_declenche: 15.0,
            valeur_actuelle: 11.5,
            statut: "envoye",
            created_at: new Date().toISOString(),
            severity: "high"
          },
          {
            id: "sim-2",
            type_indicateur: "INN_SPIKE",
            message: "Augmentation de 35% des infractions INN détectées ce mois",
            seuil_declenche: 20,
            valeur_actuelle: 27,
            statut: "envoye",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            severity: "high"
          },
          {
            id: "sim-3",
            type_indicateur: "PAYMENT_LAG",
            message: "Taux de paiement des licences à 72% (objectif: 85%)",
            seuil_declenche: 85,
            valeur_actuelle: 72,
            statut: "envoye",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            severity: "medium"
          }
        ];
        alertsWithSeverity.push(...simulatedAlerts);
      }

      setAlerts(alertsWithSeverity);
    } catch (error) {
      console.error("Erreur lors du chargement des alertes:", error);
      toast.error("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (type: string, valeur: number, seuil: number): 'high' | 'medium' | 'low' => {
    const diff = Math.abs(valeur - seuil);
    const percentDiff = (diff / seuil) * 100;

    if (percentDiff > 30 || type.includes('INN')) return 'high';
    if (percentDiff > 15) return 'medium';
    return 'low';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'CPUE_BAISSE':
        return <TrendingDown className="h-5 w-5" />;
      case 'INN_SPIKE':
        return <Shield className="h-5 w-5" />;
      case 'PAYMENT_LAG':
        return <DollarSign className="h-5 w-5" />;
      case 'QUOTA_ATTEINT':
        return <Target className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getAlertAction = (type: string) => {
    switch (type) {
      case 'CPUE_BAISSE':
      case 'QUOTA_ATTEINT':
        return {
          label: "Proposer fermeture zone",
          action: () => setShowLockZoneDialog(true)
        };
      case 'INN_SPIKE':
        return {
          label: "Renforcer surveillance",
          action: () => toast.info("Fonction en développement")
        };
      case 'PAYMENT_LAG':
        return {
          label: "Rappel paiements",
          action: () => toast.info("Fonction en développement")
        };
      default:
        return null;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("alerte_historique")
        .update({ statut: "lu" })
        .eq("id", id);

      if (error) throw error;
      
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success("Alerte marquée comme lue");
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertes & Recommandations
              </CardTitle>
              <CardDescription>
                Notifications automatiques nécessitant une attention
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {alerts.length} active{alerts.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des alertes...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune alerte active
            </div>
          ) : (
            alerts.map((alert) => {
              const action = getAlertAction(alert.type_indicateur);
              return (
                <Alert
                  key={alert.id}
                  variant={getAlertVariant(alert.severity) as any}
                  className="relative"
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type_indicateur)}
                    <div className="flex-1">
                      <AlertTitle className="mb-1">
                        {alert.type_indicateur.replace(/_/g, ' ')}
                      </AlertTitle>
                      <AlertDescription className="mb-3">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          Seuil: {alert.seuil_declenche}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Actuel: {alert.valeur_actuelle}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {action && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={action.action}
                          >
                            {action.label}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(alert.id)}
                          >
                            Marquer comme lu
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              );
            })
          )}
        </CardContent>
      </Card>

      {showLockZoneDialog && (
        <LockZoneDialog />
      )}
    </>
  );
};

export default AlertsPanel;
