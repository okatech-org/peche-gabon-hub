import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, TrendingUp, AlertCircle, Target, Award, Calendar, CheckCircle2, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { addDays, format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";

interface FormateurRecommande {
  formateur_id: string;
  formateur_nom: string;
  score_adequation: number;
  specialites_matching: string[];
  historique_succes: number;
  disponibilite_estimee: boolean;
  justification: string;
}

interface BesoinFormation {
  indicateur: string;
  type_formation: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  urgence: number;
  raison: string;
  formateurs_recommandes: FormateurRecommande[];
}

interface Prediction {
  periode_analyse: string;
  tendances_identifiees: string[];
  besoins_prioritaires: BesoinFormation[];
  recommandations_strategiques: string[];
  score_confiance: number;
}

interface FormationCreee {
  titre: string;
  type: string;
  formateur: string;
  date_debut: string;
  date_fin: string;
  priorite: string;
}

export function PredictionsFormations() {
  const [loading, setLoading] = useState(false);
  const [horizonMois, setHorizonMois] = useState("6");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [nbEvaluations, setNbEvaluations] = useState(0);
  const [nbFormateurs, setNbFormateurs] = useState(0);
  const [planning, setPlanning] = useState(false);
  const [formationsCreees, setFormationsCreees] = useState<FormationCreee[]>([]);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);

  const handleGeneratePrediction = async () => {
    try {
      setLoading(true);
      toast.info("Analyse prédictive en cours...");

      const { data, error } = await supabase.functions.invoke('predict-training-needs', {
        body: {
          horizon_mois: parseInt(horizonMois),
        },
      });

      if (error) throw error;

      if (data.success && data.prediction) {
        setPrediction(data.prediction);
        setNbEvaluations(data.nb_evaluations_analysees);
        setNbFormateurs(data.nb_formateurs_disponibles);
        toast.success("Prédiction générée avec succès");
      } else {
        toast.error("Erreur lors de la génération");
      }
    } catch (error) {
      console.error("Erreur prédiction:", error);
      toast.error("Erreur lors de l'analyse prédictive");
    } finally {
      setLoading(false);
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'haute':
        return 'destructive';
      case 'moyenne':
        return 'secondary';
      case 'basse':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPrioriteIcon = (priorite: string) => {
    switch (priorite) {
      case 'haute':
        return <AlertCircle className="h-4 w-4" />;
      case 'moyenne':
        return <Target className="h-4 w-4" />;
      case 'basse':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handlePlanifierAutomatiquement = async () => {
    if (!prediction) return;

    try {
      setPlanning(true);
      toast.info("Planification automatique en cours...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Récupérer les disponibilités futures
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + parseInt(horizonMois));

      const { data: disponibilites } = await supabase
        .from("formateurs_disponibilites")
        .select("*")
        .eq("disponible", true)
        .lte("date_debut", futureDate.toISOString().split('T')[0]);

      const nouvellesFormations: FormationCreee[] = [];
      let currentDate = new Date();

      // Trier les besoins par priorité et urgence
      const besoinsTries = [...prediction.besoins_prioritaires].sort((a, b) => {
        const priorityOrder = { haute: 3, moyenne: 2, basse: 1 };
        const priorityDiff = priorityOrder[b.priorite] - priorityOrder[a.priorite];
        if (priorityDiff !== 0) return priorityDiff;
        return b.urgence - a.urgence;
      });

      for (const besoin of besoinsTries) {
        // Prendre le meilleur formateur disponible
        const meilleurFormateur = besoin.formateurs_recommandes
          .filter((f) => f.disponibilite_estimee)
          .sort((a, b) => b.score_adequation - a.score_adequation)[0];

        if (!meilleurFormateur) continue;

        // Trouver une date disponible pour le formateur
        const formateurDispo = disponibilites?.find(
          (d: any) =>
            d.formateur_id === meilleurFormateur.formateur_id &&
            new Date(d.date_debut) >= currentDate
        );

        let dateDebut: Date;
        let dateFin: Date;

        if (formateurDispo) {
          dateDebut = new Date(formateurDispo.date_debut);
          // Durée de formation: 5 jours par défaut
          dateFin = addDays(dateDebut, 4);
        } else {
          // Planifier dans 2 semaines si pas de disponibilité spécifique
          dateDebut = addDays(currentDate, 14);
          dateFin = addDays(dateDebut, 4);
        }

        // Créer la formation
        const formationData = {
          titre: `${besoin.type_formation.charAt(0).toUpperCase() + besoin.type_formation.slice(1)} - ${besoin.indicateur}`,
          description: besoin.raison,
          type_formation: besoin.type_formation,
          date_debut: formatDate(dateDebut, "yyyy-MM-dd"),
          date_fin: formatDate(dateFin, "yyyy-MM-dd"),
          formateur_id: meilleurFormateur.formateur_id,
          statut: "planifiee",
          priorite: besoin.priorite,
          objectifs: [
            `Améliorer ${besoin.indicateur}`,
            ...meilleurFormateur.specialites_matching.map((s) => `Formation en ${s}`),
          ],
          participants_cibles: ["pecheur", "agent_collecte", "gestionnaire_coop"],
          indicateurs_cibles: [besoin.indicateur],
          created_by: user.id,
          nb_participants_max: 20,
        };

        const { data: formation, error } = await supabase
          .from("formations_planifiees")
          .insert(formationData)
          .select()
          .single();

        if (error) {
          console.error("Erreur création formation:", error);
          continue;
        }

        nouvellesFormations.push({
          titre: formationData.titre,
          type: besoin.type_formation,
          formateur: meilleurFormateur.formateur_nom,
          date_debut: formationData.date_debut,
          date_fin: formationData.date_fin,
          priorite: besoin.priorite,
        });

        // Décaler la date pour la prochaine formation
        currentDate = addDays(dateFin, 3);
      }

      setFormationsCreees(nouvellesFormations);
      setShowPlanningDialog(true);
      toast.success(`${nouvellesFormations.length} formation(s) planifiée(s) automatiquement`);
    } catch (error) {
      console.error("Erreur planification:", error);
      toast.error("Erreur lors de la planification automatique");
    } finally {
      setPlanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Prédictions IA - Besoins Futurs en Formation
            </CardTitle>
            <CardDescription>
              Identification intelligente des besoins et recommandations de formateurs
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={horizonMois} onValueChange={setHorizonMois}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 prochains mois</SelectItem>
                <SelectItem value="6">6 prochains mois</SelectItem>
                <SelectItem value="12">12 prochains mois</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleGeneratePrediction} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Générer prédiction
            </Button>
            {prediction && (
              <Button
                onClick={handlePlanifierAutomatiquement}
                disabled={planning}
                variant="default"
              >
                {planning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CalendarPlus className="h-4 w-4 mr-2" />
                )}
                Planifier automatiquement
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!prediction && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Cliquez sur "Générer prédiction" pour analyser les besoins futurs</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Analyse des données historiques et prédiction en cours...</p>
            </div>
          </div>
        )}

        {prediction && (
          <div className="space-y-6">
            {/* Score de confiance et métadonnées */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground mb-1">Score de confiance</div>
                  <div className="flex items-center gap-2">
                    <Progress value={prediction.score_confiance} className="flex-1" />
                    <span className="text-lg font-bold">{prediction.score_confiance}%</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground mb-1">Période</div>
                  <div className="text-lg font-bold">{prediction.periode_analyse}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground mb-1">Données analysées</div>
                  <div className="text-lg font-bold">{nbEvaluations} évaluations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground mb-1">Formateurs disponibles</div>
                  <div className="text-lg font-bold">{nbFormateurs}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tendances identifiées */}
            {prediction.tendances_identifiees.length > 0 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Tendances identifiées</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1">
                    {prediction.tendances_identifiees.map((tendance, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{tendance}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Besoins prioritaires */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Besoins prioritaires ({prediction.besoins_prioritaires.length})
              </h3>

              {prediction.besoins_prioritaires.map((besoin, idx) => (
                <Card key={idx} className={besoin.priorite === 'haute' ? 'border-red-500' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getPrioriteColor(besoin.priorite)} className="gap-1">
                            {getPrioriteIcon(besoin.priorite)}
                            Priorité {besoin.priorite}
                          </Badge>
                          <Badge variant="outline">{besoin.type_formation}</Badge>
                          <div className="flex items-center gap-1 text-sm">
                            <AlertCircle className="h-3 w-3" />
                            <span>Urgence: {besoin.urgence}/100</span>
                          </div>
                        </div>
                        <CardTitle className="text-base">{besoin.indicateur}</CardTitle>
                        <CardDescription className="mt-1">{besoin.raison}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Formateurs recommandés
                      </h4>

                      {besoin.formateurs_recommandes.map((formateur, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formateur.formateur_nom}</span>
                              {formateur.disponibilite_estimee && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Disponible
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {formateur.specialites_matching.map((spec, sIdx) => (
                                <Badge key={sIdx} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>

                            <p className="text-sm text-muted-foreground">{formateur.justification}</p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                Historique: <strong className="text-green-600">+{formateur.historique_succes.toFixed(1)}%</strong>
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {formateur.score_adequation}
                            </div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommandations stratégiques */}
            {prediction.recommandations_strategiques.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Recommandations stratégiques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {prediction.recommandations_strategiques.map((reco, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{reco}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialog des formations créées */}
      <Dialog open={showPlanningDialog} onOpenChange={setShowPlanningDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              Planification Automatique Réussie
            </DialogTitle>
            <DialogDescription>
              {formationsCreees.length} formation(s) ont été créées et ajoutées au calendrier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {formationsCreees.map((formation, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getPrioriteColor(formation.priorite)}>
                          {formation.priorite}
                        </Badge>
                        <Badge variant="outline">{formation.type}</Badge>
                      </div>
                      <div className="font-medium">{formation.titre}</div>
                      <div className="text-sm text-muted-foreground">
                        Formateur: {formation.formateur}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Du {formatDate(new Date(formation.date_debut), "dd MMM yyyy", { locale: fr })} au{" "}
                          {formatDate(new Date(formation.date_fin), "dd MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPlanningDialog(false)}>
              Fermer
            </Button>
            <Button onClick={() => window.location.reload()}>
              <Calendar className="h-4 w-4 mr-2" />
              Voir le calendrier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
