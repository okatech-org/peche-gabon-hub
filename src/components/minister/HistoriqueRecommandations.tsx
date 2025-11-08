import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, History, TrendingUp, CheckCircle2, XCircle, Award, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";

interface HistoriqueItem {
  id: string;
  type_formation: string;
  specialites_requises: string[];
  date_debut: string;
  date_fin: string;
  lieu: string | null;
  total_formateurs_analyses: number;
  analyse_globale: string | null;
  created_at: string;
}

interface FormateurRecommande {
  id: string;
  formateur_id: string;
  rang: number;
  score: number;
  justification: string;
  points_forts: string[];
  choisi: boolean;
  date_choix: string | null;
  formateurs: {
    nom: string;
    prenom: string;
    specialites: string[];
  };
}

interface Metriques {
  total_recommandations: number;
  recommandations_suivies: number;
  taux_precision: number;
  rang_moyen_choisi: number;
  score_moyen_choisis: number;
  score_moyen_non_choisis: number;
}

export function HistoriqueRecommandations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [historique, setHistorique] = useState<HistoriqueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [formateursRecommandes, setFormateursRecommandes] = useState<FormateurRecommande[]>([]);
  const [metriques, setMetriques] = useState<Metriques | null>(null);
  const [loadingMetriques, setLoadingMetriques] = useState(false);

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("recommandations_historique")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setHistorique(data || []);
    } catch (error) {
      console.error("Erreur chargement historique:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadFormateursRecommandes = async (recommandationId: string) => {
    try {
      const { data, error } = await supabase
        .from("recommandations_formateurs")
        .select(`
          *,
          formateurs (
            nom,
            prenom,
            specialites
          )
        `)
        .eq("recommandation_id", recommandationId)
        .order("rang");

      if (error) throw error;

      setFormateursRecommandes(data || []);
    } catch (error) {
      console.error("Erreur chargement formateurs:", error);
      toast.error("Erreur lors du chargement des formateurs");
    }
  };

  const marquerChoisi = async (formateurRecoId: string, choisi: boolean) => {
    try {
      const { error } = await supabase
        .from("recommandations_formateurs")
        .update({
          choisi,
          date_choix: choisi ? new Date().toISOString() : null,
          choisi_par: choisi ? user?.id : null,
        })
        .eq("id", formateurRecoId);

      if (error) throw error;

      toast.success(choisi ? "Formateur marqué comme choisi" : "Choix annulé");
      
      if (selectedItem) {
        loadFormateursRecommandes(selectedItem);
      }
      loadMetriques();
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const loadMetriques = async () => {
    try {
      setLoadingMetriques(true);

      // Calculer les métriques des 30 derniers jours
      const dateDebut = new Date();
      dateDebut.setDate(dateDebut.getDate() - 30);
      
      const { data, error } = await supabase.rpc("calculer_metriques_precision", {
        p_date_debut: dateDebut.toISOString().split("T")[0],
        p_date_fin: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      if (data && typeof data === 'object') {
        setMetriques(data as unknown as Metriques);
      }
    } catch (error) {
      console.error("Erreur calcul métriques:", error);
      toast.error("Erreur lors du calcul des métriques");
    } finally {
      setLoadingMetriques(false);
    }
  };

  const handleOpenDialog = (item: HistoriqueItem) => {
    setSelectedItem(item.id);
    loadFormateursRecommandes(item.id);
  };

  useEffect(() => {
    loadMetriques();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="historique">
        <TabsList>
          <TabsTrigger value="historique">
            <History className="mr-2 h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="metriques">
            <BarChart3 className="mr-2 h-4 w-4" />
            Métriques de Précision
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Recommandations IA</CardTitle>
            </CardHeader>
            <CardContent>
              {historique.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune recommandation dans l'historique
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Formation</TableHead>
                      <TableHead>Spécialités</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Analyses</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historique.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.type_formation}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.specialites_requises.slice(0, 2).map((spec, i) => (
                              <Badge key={i} variant="secondary">
                                {spec}
                              </Badge>
                            ))}
                            {item.specialites_requises.length > 2 && (
                              <Badge variant="outline">
                                +{item.specialites_requises.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(item.date_debut), "dd/MM", { locale: fr })} -{" "}
                          {format(new Date(item.date_fin), "dd/MM", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.total_formateurs_analyses} formateurs
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(item)}
                              >
                                Détails
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>{item.type_formation}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {item.analyse_globale && (
                                  <Card>
                                    <CardContent className="pt-6">
                                      <p className="text-sm">{item.analyse_globale}</p>
                                    </CardContent>
                                  </Card>
                                )}

                                <div className="space-y-3">
                                  {formateursRecommandes.map((fr) => (
                                    <Card key={fr.id} className={fr.choisi ? "border-green-600" : ""}>
                                      <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Badge>#{fr.rang}</Badge>
                                              <span className="font-medium">
                                                {fr.formateurs.prenom} {fr.formateurs.nom}
                                              </span>
                                              {fr.choisi && (
                                                <Badge variant="default" className="gap-1">
                                                  <CheckCircle2 className="h-3 w-3" />
                                                  Choisi
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-2xl font-bold text-primary mb-2">
                                              {fr.score}/100
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                              {fr.justification}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                              {fr.points_forts.map((pf, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                  {pf}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            {!fr.choisi ? (
                                              <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => marquerChoisi(fr.id, true)}
                                              >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Marquer choisi
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => marquerChoisi(fr.id, false)}
                                              >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Annuler
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metriques" className="space-y-4">
          {loadingMetriques ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : metriques ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Taux de Précision
                    </CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metriques.taux_precision?.toFixed(1) || 0}%
                    </div>
                    <Progress value={metriques.taux_precision || 0} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {metriques.recommandations_suivies} / {metriques.total_recommandations} recommandations suivies
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Rang Moyen Choisi
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metriques.rang_moyen_choisi?.toFixed(1) || "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {metriques.rang_moyen_choisi && metriques.rang_moyen_choisi <= 1.5
                        ? "Excellent - IA très précise"
                        : metriques.rang_moyen_choisi && metriques.rang_moyen_choisi <= 2.5
                        ? "Bon - Recommandations fiables"
                        : "À améliorer"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Score Différentiel
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metriques.score_moyen_choisis && metriques.score_moyen_non_choisis
                        ? (metriques.score_moyen_choisis - metriques.score_moyen_non_choisis).toFixed(1)
                        : "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Choisis: {metriques.score_moyen_choisis?.toFixed(1) || "N/A"} vs Non-choisis: {metriques.score_moyen_non_choisis?.toFixed(1) || "N/A"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Analyse de Performance (30 derniers jours)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Interprétation</h4>
                    <div className="space-y-2 text-sm">
                      {metriques.taux_precision >= 70 ? (
                        <div className="flex items-start gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4 mt-0.5" />
                          <p>
                            Le modèle IA est très performant avec un taux de précision de{" "}
                            {metriques.taux_precision.toFixed(1)}%. Les recommandations sont hautement fiables.
                          </p>
                        </div>
                      ) : metriques.taux_precision >= 50 ? (
                        <div className="flex items-start gap-2 text-orange-600">
                          <TrendingUp className="h-4 w-4 mt-0.5" />
                          <p>
                            Performance acceptable avec {metriques.taux_precision.toFixed(1)}% de précision.
                            Il y a une marge d'amélioration possible.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-red-600">
                          <XCircle className="h-4 w-4 mt-0.5" />
                          <p>
                            Précision faible ({metriques.taux_precision.toFixed(1)}%).
                            Révision des critères de recommandation nécessaire.
                          </p>
                        </div>
                      )}

                      {metriques.rang_moyen_choisi && metriques.rang_moyen_choisi <= 1.5 && (
                        <div className="flex items-start gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4 mt-0.5" />
                          <p>
                            Les formateurs choisis sont principalement en position #{metriques.rang_moyen_choisi.toFixed(1)}, 
                            ce qui indique une excellente capacité de classement.
                          </p>
                        </div>
                      )}

                      {metriques.score_moyen_choisis && metriques.score_moyen_non_choisis && 
                       (metriques.score_moyen_choisis - metriques.score_moyen_non_choisis) > 10 && (
                        <div className="flex items-start gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4 mt-0.5" />
                          <p>
                            Bonne différenciation : les formateurs choisis ont un score moyen supérieur de{" "}
                            {(metriques.score_moyen_choisis - metriques.score_moyen_non_choisis).toFixed(1)} points.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune donnée disponible pour calculer les métriques
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
