import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, Award, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Recommendation {
  formateur_id: string;
  score: number;
  justification: string;
  points_forts: string[];
  points_attention?: string[];
  adequation_specialites: number;
  adequation_experience: number;
  adequation_performance: number;
  formateur: {
    id: string;
    nom: string;
    prenom: string;
    specialites: string[];
    note_moyenne: number | null;
    nb_formations_donnees: number;
  } | null;
}

interface RecommendationResponse {
  recommendations: Recommendation[];
  analyse_globale: string;
  total_formateurs_analyses: number;
}

export function RecommandationFormateurs() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRecommendation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const specialites = formData
      .get("specialites")
      ?.toString()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) || [];

    if (specialites.length === 0) {
      toast.error("Veuillez spécifier au moins une spécialité requise");
      return;
    }

    try {
      setLoading(true);
      toast.info("Analyse en cours avec l'IA...");

      const { data, error } = await supabase.functions.invoke("recommend-formateurs", {
        body: {
          typeFormation: formData.get("type_formation")?.toString(),
          specialitesRequises: specialites,
          dateDebut: formData.get("date_debut")?.toString(),
          dateFin: formData.get("date_fin")?.toString(),
          lieu: formData.get("lieu")?.toString(),
          nombreParticipants: formData.get("nb_participants")?.toString(),
        },
      });

      if (error) {
        console.error("Erreur fonction:", error);
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.recommendations.length === 0) {
        toast.warning("Aucune recommandation trouvée pour ces critères");
        return;
      }

      setRecommendations(data);
      toast.success(`${data.recommendations.length} formateurs recommandés`);
    } catch (error) {
      console.error("Erreur recommandation:", error);
      toast.error("Erreur lors de la génération des recommandations");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommandation Intelligente de Formateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Obtenir des Recommandations IA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Recherche de Formateurs par IA</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRecommendation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type_formation">Type de Formation *</Label>
                  <Input
                    id="type_formation"
                    name="type_formation"
                    placeholder="Ex: Gestion durable des ressources"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialites">
                    Spécialités Requises * (séparées par des virgules)
                  </Label>
                  <Input
                    id="specialites"
                    name="specialites"
                    placeholder="Ex: Gestion, Qualité, Durabilité"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_debut">Date Début *</Label>
                    <Input id="date_debut" name="date_debut" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_fin">Date Fin *</Label>
                    <Input id="date_fin" name="date_fin" type="date" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lieu">Lieu</Label>
                    <Input id="lieu" name="lieu" placeholder="Ex: Libreville" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nb_participants">Nombre de Participants</Label>
                    <Input
                      id="nb_participants"
                      name="nb_participants"
                      type="number"
                      placeholder="Ex: 20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Obtenir Recommandations
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {recommendations && (
        <>
          {/* Analyse Globale */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Award className="h-5 w-5" />
                Analyse Globale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {recommendations.total_formateurs_analyses} formateurs analysés
              </p>
              <p className="text-sm">{recommendations.analyse_globale}</p>
            </CardContent>
          </Card>

          {/* Recommandations */}
          <div className="space-y-4">
            {recommendations.recommendations.map((rec, index) => (
              <Card
                key={rec.formateur_id}
                className={index === 0 ? "border-2 border-primary" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {index === 0 && (
                          <Badge variant="default" className="gap-1">
                            <Award className="h-3 w-3" />
                            Meilleur Match
                          </Badge>
                        )}
                        <Badge>#{index + 1}</Badge>
                      </div>
                      {rec.formateur && (
                        <CardTitle className="text-xl">
                          {rec.formateur.prenom} {rec.formateur.nom}
                        </CardTitle>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(rec.score)}`}>
                        {rec.score}
                      </div>
                      <div className="text-sm text-muted-foreground">/ 100</div>
                      <Badge variant={getScoreBadge(rec.score)} className="mt-2">
                        {rec.score >= 80
                          ? "Excellent"
                          : rec.score >= 60
                          ? "Bon"
                          : "Acceptable"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informations du formateur */}
                  {rec.formateur && (
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                      <div>
                        <div className="text-xs text-muted-foreground">Note moyenne</div>
                        <div className="font-medium">
                          {rec.formateur.note_moyenne?.toFixed(1) || "N/A"} / 5
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Formations</div>
                        <div className="font-medium">
                          {rec.formateur.nb_formations_donnees}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Spécialités</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.formateur.specialites.slice(0, 2).map((spec, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {rec.formateur.specialites.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{rec.formateur.specialites.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barres d'adéquation */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Spécialités</span>
                        <span className="font-medium">{rec.adequation_specialites}%</span>
                      </div>
                      <Progress value={rec.adequation_specialites} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Performance</span>
                        <span className="font-medium">{rec.adequation_performance}%</span>
                      </div>
                      <Progress value={rec.adequation_performance} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Expérience</span>
                        <span className="font-medium">{rec.adequation_experience}%</span>
                      </div>
                      <Progress value={rec.adequation_experience} className="h-2" />
                    </div>
                  </div>

                  {/* Justification */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">Justification</div>
                    <p className="text-sm text-muted-foreground">{rec.justification}</p>
                  </div>

                  {/* Points forts */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Points Forts
                    </div>
                    <ul className="space-y-1">
                      {rec.points_forts.map((point, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Points d'attention */}
                  {rec.points_attention && rec.points_attention.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-2 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        Points d'Attention
                      </div>
                      <ul className="space-y-1">
                        {rec.points_attention.map((point, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
