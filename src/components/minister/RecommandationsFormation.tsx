import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, TrendingDown, AlertTriangle, Users, Target, BookOpen, Award, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ActionWithAlerte {
  id: string;
  action_description: string;
  statut: string;
  efficacite: number | null;
  alerte_id: string;
  alertes_rapports: {
    indicateur: string;
    severite: string;
  };
}

interface BesoinsFormation {
  indicateur: string;
  moyenne_efficacite: number;
  nb_actions: number;
  priorite: "haute" | "moyenne" | "basse";
}

interface Recommendation {
  titre: string;
  description: string;
  objectifs: string[];
  cible: string;
  duree: string;
  priorite: "haute" | "moyenne" | "basse";
}

export function RecommandationsFormation() {
  const [actions, setActions] = useState<ActionWithAlerte[]>([]);
  const [besoins, setBesoins] = useState<BesoinsFormation[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedReco, setExpandedReco] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les actions correctives avec leurs alertes
      const { data: actionsData, error: actionsError } = await supabase
        .from("actions_correctives")
        .select(`
          id,
          action_description,
          statut,
          efficacite,
          alerte_id,
          alertes_rapports (
            indicateur,
            severite
          )
        `)
        .not("efficacite", "is", null)
        .order("created_at", { ascending: false });

      if (actionsError) throw actionsError;

      setActions(actionsData as ActionWithAlerte[]);
      analyserBesoins(actionsData as ActionWithAlerte[]);
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const analyserBesoins = (actionsData: ActionWithAlerte[]) => {
    // Grouper par indicateur et calculer l'efficacité moyenne
    const groupes: Record<string, { total: number; count: number }> = {};

    actionsData.forEach((action) => {
      const indicateur = action.alertes_rapports.indicateur;
      if (!groupes[indicateur]) {
        groupes[indicateur] = { total: 0, count: 0 };
      }
      if (action.efficacite !== null) {
        groupes[indicateur].total += action.efficacite;
        groupes[indicateur].count += 1;
      }
    });

    // Créer la liste des besoins avec priorité
    const besoinsListe: BesoinsFormation[] = Object.entries(groupes).map(
      ([indicateur, stats]) => {
        const moyenne = stats.total / stats.count;
        let priorite: "haute" | "moyenne" | "basse" = "basse";

        if (moyenne < 50) priorite = "haute";
        else if (moyenne < 70) priorite = "moyenne";

        return {
          indicateur,
          moyenne_efficacite: Math.round(moyenne),
          nb_actions: stats.count,
          priorite,
        };
      }
    );

    // Trier par priorité puis par efficacité
    besoinsListe.sort((a, b) => {
      const prioriteOrder = { haute: 0, moyenne: 1, basse: 2 };
      if (prioriteOrder[a.priorite] !== prioriteOrder[b.priorite]) {
        return prioriteOrder[a.priorite] - prioriteOrder[b.priorite];
      }
      return a.moyenne_efficacite - b.moyenne_efficacite;
    });

    setBesoins(besoinsListe);
  };

  const genererRecommandations = async () => {
    try {
      setAnalyzing(true);

      // Préparer le prompt pour l'IA
      const prompt = `En tant qu'expert en formation et développement des compétences pour la gestion des pêches, analyse les données suivantes et génère des recommandations de formation concrètes :

Besoins identifiés :
${besoins
  .filter((b) => b.priorite === "haute" || b.priorite === "moyenne")
  .map(
    (b) =>
      `- ${b.indicateur}: efficacité moyenne ${b.moyenne_efficacite}% (${b.nb_actions} actions)`
  )
  .join("\n")}

Actions correctives analysées : ${actions.length}

Génère 5 recommandations de formation prioritaires au format JSON suivant :
{
  "recommendations": [
    {
      "titre": "Titre clair de la formation",
      "description": "Description détaillée du contenu et des méthodes",
      "objectifs": ["Objectif 1", "Objectif 2", "Objectif 3"],
      "cible": "Public cible (ex: agents de terrain, gestionnaires, inspecteurs)",
      "duree": "Durée suggérée (ex: 2 jours, 1 semaine)",
      "priorite": "haute|moyenne|basse"
    }
  ]
}

Focus sur :
- Formations pratiques et opérationnelles
- Adaptation aux contextes locaux
- Renforcement des capacités d'analyse
- Amélioration de la prise de décision
- Utilisation des outils numériques`;

      const { data, error } = await supabase.functions.invoke("analyze-insights", {
        body: { prompt },
      });

      if (error) throw error;

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
        toast.success("Recommandations générées avec succès");
      } else {
        throw new Error("Format de réponse invalide");
      }
    } catch (error: any) {
      console.error("Erreur lors de la génération:", error);
      toast.error("Erreur lors de la génération des recommandations");
    } finally {
      setAnalyzing(false);
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case "haute":
        return "destructive";
      case "moyenne":
        return "default";
      default:
        return "secondary";
    }
  };

  const getPrioriteIcon = (priorite: string) => {
    switch (priorite) {
      case "haute":
        return <AlertTriangle className="h-4 w-4" />;
      case "moyenne":
        return <Target className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Recommandations de Formation</h2>
              <p className="text-sm text-muted-foreground">
                Basées sur l'analyse de {actions.length} actions correctives
              </p>
            </div>
          </div>
          <Button
            onClick={genererRecommandations}
            disabled={analyzing || besoins.length === 0}
            className="gap-2"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyse en cours...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Générer Recommandations IA
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="besoins" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="besoins">Besoins Identifiés</TabsTrigger>
            <TabsTrigger value="formations">
              Formations Recommandées
              {recommendations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {recommendations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="besoins" className="space-y-4">
            {besoins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée disponible pour l'analyse</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {besoins.map((besoin, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getPrioriteColor(besoin.priorite)}>
                            {besoin.priorite.toUpperCase()}
                          </Badge>
                          <h3 className="font-semibold">{besoin.indicateur}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-4 w-4" />
                            Efficacité moyenne: {besoin.moyenne_efficacite}%
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {besoin.nb_actions} actions analysées
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="formations" className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Cliquez sur "Générer Recommandations IA" pour obtenir des suggestions</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {recommendations.map((reco, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPrioriteIcon(reco.priorite)}
                            <h3 className="font-semibold text-lg">{reco.titre}</h3>
                            <Badge variant={getPrioriteColor(reco.priorite)}>
                              {reco.priorite}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {reco.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedReco(
                              expandedReco === reco.titre ? null : reco.titre
                            )
                          }
                        >
                          {expandedReco === reco.titre ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {expandedReco === reco.titre && (
                        <div className="space-y-3 pt-3 border-t">
                          <div>
                            <h4 className="font-medium text-sm mb-2">Objectifs:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {reco.objectifs.map((obj, i) => (
                                <li key={i}>{obj}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>
                                <strong>Public:</strong> {reco.cible}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span>
                                <strong>Durée:</strong> {reco.duree}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
