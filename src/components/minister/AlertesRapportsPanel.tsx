import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, TrendingUp, TrendingDown, AlertTriangle, Eye, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Alerte {
  id: string;
  created_at: string;
  indicateur: string;
  valeur_precedente: number;
  valeur_actuelle: number;
  variation_pourcentage: number;
  type_variation: string;
  severite: string;
  statut: string;
  recommandations_ia: string | null;
  rapport_nouveau: {
    id: string;
    titre: string;
    region: string;
    created_at: string;
  };
  rapport_reference: {
    id: string;
    titre: string;
    created_at: string;
  };
  seuil: {
    nom: string;
    description: string;
  };
}

const AlertesRapportsPanel = () => {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadAlertes();
  }, []);

  const loadAlertes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("alertes_rapports")
        .select(`
          *,
          rapport_nouveau:rapports_zones!rapport_nouveau_id (
            id,
            titre,
            region,
            created_at
          ),
          rapport_reference:rapports_zones!rapport_reference_id (
            id,
            titre,
            created_at
          ),
          seuil:seuils_alertes_rapports!seuil_id (
            nom,
            description
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlertes(data || []);
    } catch (error) {
      console.error("Error loading alertes:", error);
      toast.error("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (alerteId: string, newStatut: string) => {
    setUpdatingStatus(alerteId);
    try {
      const updateData: any = {
        statut: newStatut,
      };

      if (newStatut === "vue") {
        updateData.vue_par = (await supabase.auth.getUser()).data.user?.id;
        updateData.vue_le = new Date().toISOString();
      } else if (newStatut === "traitee") {
        updateData.traitee_par = (await supabase.auth.getUser()).data.user?.id;
        updateData.traitee_le = new Date().toISOString();
      }

      const { error } = await supabase
        .from("alertes_rapports")
        .update(updateData)
        .eq("id", alerteId);

      if (error) throw error;

      setAlertes((prev) =>
        prev.map((a) =>
          a.id === alerteId ? { ...a, statut: newStatut } : a
        )
      );
      toast.success("Statut mis à jour");
    } catch (error) {
      console.error("Error updating statut:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getIndicateurLabel = (indicateur: string) => {
    switch (indicateur) {
      case "captures_totales":
        return "Captures totales";
      case "cpue_moyen":
        return "CPUE moyen";
      case "nombre_sites":
        return "Nombre de sites";
      default:
        return indicateur;
    }
  };

  const getSeverityColor = (severite: string) => {
    switch (severite) {
      case "elevee":
        return "destructive";
      case "moyenne":
        return "default";
      case "faible":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getSeverityLabel = (severite: string) => {
    switch (severite) {
      case "elevee":
        return "Élevée";
      case "moyenne":
        return "Moyenne";
      case "faible":
        return "Faible";
      default:
        return severite;
    }
  };

  const filteredAlertes = (statut: string) => {
    if (statut === "toutes") return alertes;
    return alertes.filter((a) => a.statut === statut);
  };

  const AlerteCard = ({ alerte }: { alerte: Alerte }) => (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
      setSelectedAlerte(alerte);
      setShowDetails(true);
      if (alerte.statut === "nouvelle") {
        updateStatut(alerte.id, "vue");
      }
    }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {alerte.type_variation === "hausse" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <CardTitle className="text-base">{alerte.seuil.nom}</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {alerte.rapport_nouveau.region} - {format(new Date(alerte.created_at), "PPP", { locale: fr })}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={getSeverityColor(alerte.severite as any)}>
              {getSeverityLabel(alerte.severite)}
            </Badge>
            {alerte.statut === "nouvelle" && (
              <Badge variant="outline" className="text-xs">
                <Bell className="h-3 w-3 mr-1" />
                Nouvelle
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getIndicateurLabel(alerte.indicateur)}</span>
            <span className={`font-semibold ${alerte.type_variation === "hausse" ? "text-green-600" : "text-red-600"}`}>
              {alerte.variation_pourcentage > 0 ? "+" : ""}{alerte.variation_pourcentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {alerte.valeur_precedente.toFixed(2)} → {alerte.valeur_actuelle.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes Automatiques
              </CardTitle>
              <CardDescription>
                Variations significatives détectées dans les rapports
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadAlertes} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="nouvelles">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="nouvelles">
                Nouvelles ({filteredAlertes("nouvelle").length})
              </TabsTrigger>
              <TabsTrigger value="vues">
                Vues ({filteredAlertes("vue").length})
              </TabsTrigger>
              <TabsTrigger value="traitees">
                Traitées ({filteredAlertes("traitee").length})
              </TabsTrigger>
              <TabsTrigger value="toutes">
                Toutes ({alertes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nouvelles" className="space-y-3 mt-4">
              {filteredAlertes("nouvelle").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune nouvelle alerte</p>
              ) : (
                filteredAlertes("nouvelle").map((alerte) => (
                  <AlerteCard key={alerte.id} alerte={alerte} />
                ))
              )}
            </TabsContent>

            <TabsContent value="vues" className="space-y-3 mt-4">
              {filteredAlertes("vue").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune alerte vue</p>
              ) : (
                filteredAlertes("vue").map((alerte) => (
                  <AlerteCard key={alerte.id} alerte={alerte} />
                ))
              )}
            </TabsContent>

            <TabsContent value="traitees" className="space-y-3 mt-4">
              {filteredAlertes("traitee").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune alerte traitée</p>
              ) : (
                filteredAlertes("traitee").map((alerte) => (
                  <AlerteCard key={alerte.id} alerte={alerte} />
                ))
              )}
            </TabsContent>

            <TabsContent value="toutes" className="space-y-3 mt-4">
              {alertes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune alerte pour le moment</p>
              ) : (
                alertes.map((alerte) => (
                  <AlerteCard key={alerte.id} alerte={alerte} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog des détails */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlerte?.type_variation === "hausse" ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              {selectedAlerte?.seuil.nom}
            </DialogTitle>
            <DialogDescription>
              {selectedAlerte?.seuil.description}
            </DialogDescription>
          </DialogHeader>

          {selectedAlerte && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Région</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{selectedAlerte.rapport_nouveau.region}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Variation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-lg font-semibold ${selectedAlerte.type_variation === "hausse" ? "text-green-600" : "text-red-600"}`}>
                      {selectedAlerte.variation_pourcentage > 0 ? "+" : ""}{selectedAlerte.variation_pourcentage.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{getIndicateurLabel(selectedAlerte.indicateur)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Rapport précédent</p>
                      <p className="text-lg font-semibold">{selectedAlerte.valeur_precedente.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedAlerte.rapport_reference.created_at), "PP", { locale: fr })}
                      </p>
                    </div>
                    <div className="text-center px-4">
                      →
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nouveau rapport</p>
                      <p className="text-lg font-semibold">{selectedAlerte.valeur_actuelle.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedAlerte.rapport_nouveau.created_at), "PP", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedAlerte.recommandations_ia && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        🤖
                      </span>
                      Recommandations IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {selectedAlerte.recommandations_ia}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedAlerte.statut === "nouvelle" || selectedAlerte.statut === "vue" ? (
                  <Button
                    onClick={() => {
                      updateStatut(selectedAlerte.id, "traitee");
                      setShowDetails(false);
                    }}
                    disabled={updatingStatus === selectedAlerte.id}
                    className="gap-2"
                  >
                    {updatingStatus === selectedAlerte.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Marquer comme traitée
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Fermer
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AlertesRapportsPanel;
