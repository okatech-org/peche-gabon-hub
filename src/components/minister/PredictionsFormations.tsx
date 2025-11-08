import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, TrendingUp, AlertCircle, Target, Award, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export function PredictionsFormations() {
  const [loading, setLoading] = useState(false);
  const [horizonMois, setHorizonMois] = useState("6");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [nbEvaluations, setNbEvaluations] = useState(0);
  const [nbFormateurs, setNbFormateurs] = useState(0);

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
    </Card>
  );
}
