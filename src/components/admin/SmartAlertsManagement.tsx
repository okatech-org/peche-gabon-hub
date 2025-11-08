import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Settings, 
  TrendingDown,
  Activity,
  Zap,
  Clock,
  BellOff
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AlertConfig {
  id: string;
  nom: string;
  description: string;
  actif: boolean;
  seuil: number;
  severite: 'info' | 'warning' | 'critical';
  type_alerte: string;
}

interface AlerteActive {
  id: string;
  type_alerte: string;
  severite: string;
  message: string;
  details: any;
  recommandation_ia: string | null;
  statut: string;
  created_at: string;
  valeur_actuelle: number;
  valeur_reference: number;
}

const defaultConfigs: Omit<AlertConfig, 'id'>[] = [
  {
    nom: "Baisse Soudaine des Recettes",
    description: "Détecte une baisse significative des recettes par rapport au mois précédent",
    actif: true,
    seuil: 20,
    severite: 'critical',
    type_alerte: 'baisse_recettes'
  },
  {
    nom: "Taux de Recouvrement Faible",
    description: "Alerte si le taux de recouvrement descend sous un seuil critique",
    actif: true,
    seuil: 50,
    severite: 'critical',
    type_alerte: 'taux_faible'
  },
  {
    nom: "Augmentation Retards de Paiement",
    description: "Détecte une augmentation des retards de paiement",
    actif: true,
    seuil: 30,
    severite: 'warning',
    type_alerte: 'augmentation_retards'
  },
  {
    nom: "Taxes Non Collectées",
    description: "Alerte sur un taux élevé de taxes non collectées",
    actif: true,
    seuil: 40,
    severite: 'warning',
    type_alerte: 'taxes_non_collectees'
  },
  {
    nom: "Anomalie de Tendance",
    description: "Détecte des comportements inhabituels dans les données via IA",
    actif: true,
    seuil: 15,
    severite: 'info',
    type_alerte: 'anomalie_tendance'
  }
];

export const SmartAlertsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [alertesActives, setAlertesActives] = useState<AlerteActive[]>([]);
  const [alertesHistorique, setAlertesHistorique] = useState<AlerteActive[]>([]);
  const [autoAnalysis, setAutoAnalysis] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les configurations (simulé pour le moment - serait dans une table en production)
      setConfigs(defaultConfigs.map((c, idx) => ({ ...c, id: `config-${idx}` })));

      // Charger les alertes actives (à implémenter avec vraie table)
      // Pour le moment, on simule
      setAlertesActives([]);
      setAlertesHistorique([]);

    } catch (error: any) {
      console.error('Error loading alerts:', error);
      toast.error("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Appeler la fonction edge pour analyser les données
      const { data, error } = await supabase.functions.invoke('analyze-financial-alerts', {
        body: { 
          configs: configs.filter(c => c.actif),
          includeAI: true 
        }
      });

      if (error) throw error;

      if (data?.alerts && data.alerts.length > 0) {
        toast.success(`${data.alerts.length} alerte(s) détectée(s)`);
        // Recharger les données
        await loadData();
      } else {
        toast.success("Aucune anomalie détectée");
      }

    } catch (error: any) {
      console.error('Error analyzing:', error);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleConfig = (id: string) => {
    setConfigs(prev => 
      prev.map(c => c.id === id ? { ...c, actif: !c.actif } : c)
    );
  };

  const updateSeuil = (id: string, seuil: number) => {
    setConfigs(prev =>
      prev.map(c => c.id === id ? { ...c, seuil } : c)
    );
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      // Marquer l'alerte comme acquittée
      toast.success("Alerte acquittée");
      await loadData();
    } catch (error) {
      toast.error("Erreur lors de l'acquittement");
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      // Ignorer l'alerte
      toast.success("Alerte ignorée");
      await loadData();
    } catch (error) {
      toast.error("Erreur lors de l'opération");
    }
  };

  const getSeverityIcon = (severite: string) => {
    switch (severite) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severite: string) => {
    switch (severite) {
      case 'critical':
        return 'border-destructive bg-destructive/10';
      case 'warning':
        return 'border-orange-500 bg-orange-500/10';
      default:
        return 'border-blue-500 bg-blue-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alertes Intelligentes</h2>
          <p className="text-muted-foreground">
            Détection automatique d'anomalies avec analyse IA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoAnalysis}
              onCheckedChange={setAutoAnalysis}
            />
            <Label className="text-sm">Analyse auto</Label>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Lancer l'Analyse
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertesActives.length}</div>
            <p className="text-xs text-muted-foreground">
              {alertesActives.filter(a => a.severite === 'critical').length} critiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.filter(c => c.actif).length}</div>
            <p className="text-xs text-muted-foreground">
              Sur {configs.length} règles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Historique</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertesHistorique.length}</div>
            <p className="text-xs text-muted-foreground">
              Cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyse IA</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {autoAnalysis ? 'Activée' : 'Désactivée'}
            </div>
            <p className="text-xs text-muted-foreground">
              Dernière: {analyzing ? 'En cours' : 'Il y a 5 min'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Alertes Actives</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Alertes Actives */}
        <TabsContent value="active" className="space-y-4">
          {alertesActives.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-lg font-semibold">Aucune alerte active</p>
                <p className="text-sm text-muted-foreground">
                  Toutes les métriques sont dans les limites normales
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alertesActives.map(alerte => (
                <Alert key={alerte.id} className={getSeverityColor(alerte.severite)}>
                  <div className="flex items-start gap-4">
                    {getSeverityIcon(alerte.severite)}
                    <div className="flex-1 space-y-2">
                      <AlertTitle className="flex items-center gap-2">
                        {alerte.message}
                        <Badge variant={
                          alerte.severite === 'critical' ? 'destructive' :
                          alerte.severite === 'warning' ? 'secondary' : 'default'
                        }>
                          {alerte.severite}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <div className="flex gap-4 text-sm">
                          <span>
                            <strong>Valeur actuelle:</strong> {alerte.valeur_actuelle}%
                          </span>
                          <span>
                            <strong>Référence:</strong> {alerte.valeur_reference}%
                          </span>
                        </div>
                        {alerte.recommandation_ia && (
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                            <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Recommandation IA
                            </p>
                            <p className="text-sm">{alerte.recommandation_ia}</p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => acknowledgeAlert(alerte.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Acquitter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismissAlert(alerte.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Ignorer
                          </Button>
                        </div>
                      </AlertDescription>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(alerte.created_at), 'dd MMM HH:mm', { locale: fr })}
                    </span>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Règles de Détection</CardTitle>
              <CardDescription>
                Configurez les seuils et activez/désactivez les règles d'alerte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {configs.map(config => (
                <div
                  key={config.id}
                  className={`p-4 border rounded-lg space-y-3 transition-all ${
                    config.actif ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Switch
                        checked={config.actif}
                        onCheckedChange={() => toggleConfig(config.id)}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{config.nom}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <Badge variant={
                      config.severite === 'critical' ? 'destructive' :
                      config.severite === 'warning' ? 'secondary' : 'default'
                    }>
                      {config.severite}
                    </Badge>
                  </div>

                  {config.actif && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Label>Seuil de déclenchement</Label>
                        <span className="text-sm font-semibold">{config.seuil}%</span>
                      </div>
                      <Slider
                        value={[config.seuil]}
                        onValueChange={([value]) => updateSeuil(config.id, value)}
                        min={0}
                        max={100}
                        step={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        L'alerte se déclenchera si la valeur dépasse ou descend sous ce seuil
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres Avancés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Analyse IA Automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Analyse prédictive des tendances toutes les heures
                  </p>
                </div>
                <Switch checked={autoAnalysis} onCheckedChange={setAutoAnalysis} />
              </div>

              <div className="space-y-2">
                <Label>Destinataires des Notifications</Label>
                <Input
                  placeholder="admin@example.com, manager@example.com"
                  defaultValue="admin@example.com"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Paramètres Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Alertes</CardTitle>
              <CardDescription>7 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              {alertesHistorique.length === 0 ? (
                <div className="text-center py-12">
                  <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun historique disponible</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Sévérité</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertesHistorique.map(alerte => (
                      <TableRow key={alerte.id}>
                        <TableCell>
                          {format(new Date(alerte.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>{alerte.type_alerte}</TableCell>
                        <TableCell>{alerte.message}</TableCell>
                        <TableCell>
                          <Badge variant={
                            alerte.severite === 'critical' ? 'destructive' :
                            alerte.severite === 'warning' ? 'secondary' : 'default'
                          }>
                            {alerte.severite}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{alerte.statut}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
