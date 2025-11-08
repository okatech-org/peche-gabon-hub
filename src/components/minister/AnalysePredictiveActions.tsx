import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Award, MapPin, Lightbulb, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface ActionStats {
  indicateur: string;
  region: string | null;
  total: number;
  terminees: number;
  efficacite_moyenne: number;
  actions_top: {
    description: string;
    efficacite: number;
  }[];
}

interface AnalysisInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
  recommendations: string[];
}

export function AnalysePredictiveActions() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [stats, setStats] = useState<ActionStats[]>([]);
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [globalMetrics, setGlobalMetrics] = useState({
    total_actions: 0,
    taux_completion: 0,
    efficacite_moyenne: 0,
    meilleures_regions: [] as { region: string; efficacite: number }[]
  });

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      // Charger toutes les actions avec leurs alertes associées
      const { data: actions, error: actionsError } = await supabase
        .from("actions_correctives")
        .select(`
          *,
          alerte:alertes_rapports!alerte_id (
            indicateur,
            rapport_nouveau:rapports_zones!rapport_nouveau_id (
              region
            )
          )
        `);

      if (actionsError) throw actionsError;

      if (!actions || actions.length === 0) {
        toast.info("Aucune donnée disponible pour l'analyse");
        setLoading(false);
        return;
      }

      // Calculer les statistiques globales
      const totalActions = actions.length;
      const actionsTerminees = actions.filter(a => a.statut === 'terminee').length;
      const tauxCompletion = (actionsTerminees / totalActions) * 100;
      
      const actionsAvecEfficacite = actions.filter(a => a.efficacite !== null && a.efficacite > 0);
      const efficaciteMoyenne = actionsAvecEfficacite.length > 0
        ? actionsAvecEfficacite.reduce((sum, a) => sum + (a.efficacite || 0), 0) / actionsAvecEfficacite.length
        : 0;

      // Analyser par région
      const regionStats = new Map<string, { total: number; efficacite_sum: number; count: number }>();
      actions.forEach(action => {
        const region = (action.alerte as any)?.rapport_nouveau?.region || 'Non spécifiée';
        if (action.efficacite) {
          const current = regionStats.get(region) || { total: 0, efficacite_sum: 0, count: 0 };
          current.total++;
          current.efficacite_sum += action.efficacite;
          current.count++;
          regionStats.set(region, current);
        }
      });

      const meilleuresRegions = Array.from(regionStats.entries())
        .map(([region, data]) => ({
          region,
          efficacite: data.count > 0 ? data.efficacite_sum / data.count : 0
        }))
        .sort((a, b) => b.efficacite - a.efficacite)
        .slice(0, 5);

      setGlobalMetrics({
        total_actions: totalActions,
        taux_completion: tauxCompletion,
        efficacite_moyenne: efficaciteMoyenne,
        meilleures_regions: meilleuresRegions
      });

      // Grouper par indicateur et région
      const statsMap = new Map<string, ActionStats>();
      
      actions.forEach(action => {
        const indicateur = (action.alerte as any)?.indicateur || 'Inconnu';
        const region = (action.alerte as any)?.rapport_nouveau?.region || null;
        const key = `${indicateur}-${region}`;
        
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            indicateur,
            region,
            total: 0,
            terminees: 0,
            efficacite_moyenne: 0,
            actions_top: []
          });
        }
        
        const stat = statsMap.get(key)!;
        stat.total++;
        if (action.statut === 'terminee') {
          stat.terminees++;
          if (action.efficacite && action.efficacite >= 4) {
            stat.actions_top.push({
              description: action.action_description.substring(0, 100),
              efficacite: action.efficacite
            });
          }
        }
      });

      // Calculer l'efficacité moyenne par groupe
      for (const [key, stat] of statsMap.entries()) {
        const actionsGroupe = actions.filter(a => {
          const ind = (a.alerte as any)?.indicateur || 'Inconnu';
          const reg = (a.alerte as any)?.rapport_nouveau?.region || null;
          return `${ind}-${reg}` === key && a.efficacite !== null;
        });
        
        if (actionsGroupe.length > 0) {
          stat.efficacite_moyenne = actionsGroupe.reduce((sum, a) => sum + (a.efficacite || 0), 0) / actionsGroupe.length;
        }
        
        stat.actions_top.sort((a, b) => b.efficacite - a.efficacite);
        stat.actions_top = stat.actions_top.slice(0, 3);
      }

      const statsArray = Array.from(statsMap.values())
        .sort((a, b) => b.efficacite_moyenne - a.efficacite_moyenne);

      setStats(statsArray);
    } catch (error: any) {
      console.error("Error loading analysis:", error);
      toast.error("Erreur lors du chargement de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    if (stats.length === 0) {
      toast.error("Aucune donnée à analyser");
      return;
    }

    setAnalyzing(true);
    try {
      // Préparer un résumé des données pour l'IA
      const summary = stats.map(s => ({
        indicateur: s.indicateur,
        region: s.region || 'Toutes régions',
        total_actions: s.total,
        taux_completion: s.terminees / s.total * 100,
        efficacite_moyenne: s.efficacite_moyenne,
        meilleures_actions: s.actions_top.length
      }));

      const prompt = `En tant qu'expert en analyse de données halieutiques, analysez ces statistiques sur les actions correctives au Gabon et générez des insights actionnables:

Métriques globales:
- Total d'actions: ${globalMetrics.total_actions}
- Taux de complétion: ${globalMetrics.taux_completion.toFixed(1)}%
- Efficacité moyenne: ${globalMetrics.efficacite_moyenne.toFixed(2)}/5

Statistiques par indicateur et région:
${summary.map(s => `
- ${s.indicateur} (${s.region}):
  * ${s.total_actions} actions (${s.taux_completion.toFixed(0)}% terminées)
  * Efficacité moyenne: ${s.efficacite_moyenne.toFixed(2)}/5
  * ${s.meilleures_actions} actions hautement efficaces
`).join('')}

Meilleures régions:
${globalMetrics.meilleures_regions.map(r => `- ${r.region}: ${r.efficacite.toFixed(2)}/5`).join('\n')}

Générez 3-4 insights clés avec:
1. Titre court et percutant
2. Description (1-2 phrases)
3. Type (success/warning/info)
4. 2-3 recommandations concrètes

Format de réponse attendu (JSON):
[
  {
    "title": "...",
    "description": "...",
    "type": "success",
    "recommendations": ["...", "...", "..."]
  }
]

Soyez concis et orienté action.`;

      const { data: functionData, error: functionError } = await supabase.functions.invoke('analyze-insights', {
        body: { prompt }
      });

      if (functionError) throw functionError;

      if (functionData?.insights) {
        setInsights(functionData.insights);
        toast.success("Analyse IA générée avec succès");
      }
    } catch (error: any) {
      console.error("Error generating AI insights:", error);
      toast.error("Erreur lors de la génération des insights IA");
    } finally {
      setAnalyzing(false);
    }
  };

  const getIndicateurLabel = (indicateur: string) => {
    switch (indicateur) {
      case 'captures_totales': return 'Captures Totales';
      case 'cpue_moyen': return 'CPUE Moyen';
      case 'nombre_sites': return 'Nombre de Sites';
      default: return indicateur;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'warning': return <Award className="h-5 w-5 text-yellow-500" />;
      default: return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques Globales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analyse Prédictive des Actions Correctives
              </CardTitle>
              <CardDescription>
                Identification des stratégies les plus efficaces par type et région
              </CardDescription>
            </div>
            <Button onClick={generateAIInsights} disabled={analyzing || stats.length === 0}>
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Générer Insights IA
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{globalMetrics.total_actions}</div>
                <p className="text-xs text-muted-foreground">Actions totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{globalMetrics.taux_completion.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Taux de complétion</p>
                <Progress value={globalMetrics.taux_completion} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold flex items-center gap-1">
                  {globalMetrics.efficacite_moyenne.toFixed(2)}
                  <span className="text-base text-muted-foreground">/5</span>
                </div>
                <p className="text-xs text-muted-foreground">Efficacité moyenne</p>
                <Progress value={globalMetrics.efficacite_moyenne * 20} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{globalMetrics.meilleures_regions.length}</div>
                <p className="text-xs text-muted-foreground">Régions analysées</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Insights IA */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Insights & Recommandations IA</h3>
          {insights.map((insight, index) => (
            <Card key={index} className="border-l-4" style={{
              borderLeftColor: insight.type === 'success' ? '#10b981' : insight.type === 'warning' ? '#f59e0b' : '#3b82f6'
            }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  {insight.title}
                </CardTitle>
                <CardDescription>{insight.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recommandations:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {insight.recommendations.map((rec, i) => (
                      <li key={i} className="text-muted-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Meilleures Régions */}
      {globalMetrics.meilleures_regions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Régions avec les Actions les Plus Efficaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {globalMetrics.meilleures_regions.map((region, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{region.region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={region.efficacite * 20} className="w-24" />
                    <span className="text-sm font-semibold">{region.efficacite.toFixed(2)}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques Détaillées */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Analyse par Indicateur et Région</h3>
        {stats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucune donnée disponible pour l'analyse
            </CardContent>
          </Card>
        ) : (
          stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {getIndicateurLabel(stat.indicateur)}
                      {stat.region && ` - ${stat.region}`}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {stat.total} action{stat.total > 1 ? 's' : ''} • {stat.terminees} terminée{stat.terminees > 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stat.efficacite_moyenne.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Efficacité moyenne</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Taux de complétion</p>
                      <Progress value={(stat.terminees / stat.total) * 100} />
                    </div>
                    <span className="text-sm font-medium">
                      {((stat.terminees / stat.total) * 100).toFixed(0)}%
                    </span>
                  </div>

                  {stat.actions_top.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        Actions les plus efficaces
                      </p>
                      <div className="space-y-2">
                        {stat.actions_top.map((action, i) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-2 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <p className="flex-1">{action.description}</p>
                              <Badge variant="outline" className="shrink-0">
                                {action.efficacite}/5
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
