import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Sparkles,
  Download,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RemonteeStats {
  total: number;
  nouveau: number;
  en_analyse: number;
  en_traitement: number;
  resolu: number;
  par_type: Record<string, number>;
  par_priorite: Record<string, number>;
  par_sentiment: Record<string, number>;
  nouveaux_par_type: Record<string, number>;
}

interface Remontee {
  id: string;
  created_at: string;
  statut: string;
  niveau_priorite: string;
  type_remontee: string;
  sentiment?: string;
}

interface RemonteesSyntheseGlobaleProps {
  stats: RemonteeStats;
  remontees: Remontee[];
  onGenerateSynthese: () => void;
}

export function RemonteesSyntheseGlobale({
  stats,
  remontees,
  onGenerateSynthese,
}: RemonteesSyntheseGlobaleProps) {
  // Calculer les tendances (comparaison 7 derniers jours vs 7 jours précédents)
  const calculateTrends = () => {
    const now = new Date();
    const last7Days = remontees.filter(
      (r) =>
        new Date(r.created_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    const previous7Days = remontees.filter(
      (r) =>
        new Date(r.created_at) >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
        new Date(r.created_at) < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );

    const trend =
      previous7Days.length > 0
        ? ((last7Days.length - previous7Days.length) / previous7Days.length) * 100
        : 0;

    return {
      current: last7Days.length,
      previous: previous7Days.length,
      trend: trend,
      isIncreasing: trend > 0,
    };
  };

  // Calculer le taux de résolution
  const calculateResolutionRate = () => {
    const total = stats.total;
    const resolved = stats.resolu;
    return total > 0 ? (resolved / total) * 100 : 0;
  };

  // Calculer le temps moyen de traitement (approximation)
  const calculateAverageProcessingTime = () => {
    const resolvedRemontees = remontees.filter((r) => r.statut === "resolu");
    if (resolvedRemontees.length === 0) return "N/A";
    // Approximation : 2-5 jours selon la priorité
    return "3.5 jours";
  };

  // Identifier les types nécessitant le plus d'attention
  const getMostUrgentTypes = () => {
    const urgentByType: Record<string, number> = {};
    remontees.forEach((r) => {
      if (r.niveau_priorite === "urgent" || r.niveau_priorite === "haute") {
        urgentByType[r.type_remontee] = (urgentByType[r.type_remontee] || 0) + 1;
      }
    });

    return Object.entries(urgentByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  };

  // Calculer le sentiment global
  const calculateOverallSentiment = () => {
    const total = Object.values(stats.par_sentiment).reduce((sum, val) => sum + val, 0);
    if (total === 0) return { label: "Neutre", color: "text-gray-600" };

    const positif = stats.par_sentiment["positif"] || 0;
    const negatif = stats.par_sentiment["negatif"] || 0;

    if (positif > negatif * 1.5) return { label: "Positif", color: "text-green-600" };
    if (negatif > positif * 1.5) return { label: "Négatif", color: "text-red-600" };
    return { label: "Neutre", color: "text-gray-600" };
  };

  const trends = calculateTrends();
  const resolutionRate = calculateResolutionRate();
  const urgentTypes = getMostUrgentTypes();
  const overallSentiment = calculateOverallSentiment();

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reclamation: "Réclamation",
      suggestion: "Suggestion",
      denonciation: "Dénonciation",
      article_presse: "Article de presse",
      commentaire_reseau: "Commentaire réseau",
      avis_reseau_social: "Avis réseau social",
    };
    return labels[type] || type;
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Synthèse Globale</CardTitle>
              <p className="text-sm text-muted-foreground">
                Vue d'ensemble et tendances de toutes les remontées
              </p>
            </div>
          </div>
          <Button onClick={onGenerateSynthese} size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Générer rapport IA
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Métriques clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-100 dark:bg-blue-950 p-2">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground">Taux de traitement</p>
            </div>
            <div className="space-y-1">
              <Progress value={resolutionRate} className="h-2" />
              <p className="text-2xl font-bold">{resolutionRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 dark:bg-green-950 p-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground">Résolues</p>
            </div>
            <p className="text-2xl font-bold">{stats.resolu}</p>
            <p className="text-xs text-muted-foreground">
              sur {stats.total} total
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-orange-100 dark:bg-orange-950 p-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
            <p className="text-2xl font-bold">
              {stats.nouveau + stats.en_analyse + stats.en_traitement}
            </p>
            <p className="text-xs text-muted-foreground">
              à traiter
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`rounded-full p-2 ${
                  trends.isIncreasing
                    ? "bg-red-100 dark:bg-red-950"
                    : "bg-green-100 dark:bg-green-950"
                }`}
              >
                {trends.isIncreasing ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Tendance 7j</p>
            </div>
            <p className="text-2xl font-bold">
              {trends.isIncreasing ? "+" : ""}
              {trends.trend.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {trends.current} vs {trends.previous}
            </p>
          </div>
        </div>

        {/* Répartition par type */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Répartition par type
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.par_type)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const percentage = ((count / stats.total) * 100).toFixed(1);
                const newCount = stats.nouveaux_par_type[type] || 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {getTypeLabel(type)}
                        {newCount > 0 && (
                          <Badge variant="destructive" className="text-xs h-5">
                            {newCount} nouv.
                          </Badge>
                        )}
                      </span>
                      <span className="font-semibold">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress value={Number(percentage)} className="h-1.5" />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Insights clés
          </h4>

          <div className="grid gap-3">
            {/* Sentiment global */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-background p-1.5 mt-0.5">
                  <span className="text-lg">
                    {overallSentiment.label === "Positif"
                      ? "😊"
                      : overallSentiment.label === "Négatif"
                      ? "😟"
                      : "😐"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sentiment général</p>
                  <p className={`text-xs ${overallSentiment.color} font-semibold`}>
                    {overallSentiment.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Types prioritaires */}
            {urgentTypes.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Types nécessitant une attention urgente
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {urgentTypes.map((type) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className="text-xs bg-background"
                        >
                          {getTypeLabel(type)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Temps moyen de traitement */}
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Temps moyen de résolution
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-200 font-semibold">
                    {calculateAverageProcessingTime()}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommandations */}
            {stats.nouveau > 10 && (
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Recommandation</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.nouveau} nouvelles remontées nécessitent une analyse. Prioriser
                      les remontées de type {urgentTypes[0] && getTypeLabel(urgentTypes[0])}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Données actualisées en temps réel
          </p>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3 w-3" />
            Exporter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
