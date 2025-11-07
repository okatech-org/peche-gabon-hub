import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Activity, History, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PerformanceData {
  evaluation_date: string;
  mape: number;
  bias: number;
  precision: number;
  periode_analyse: number;
  nb_predictions: number;
}

interface PrevisionComparison {
  date: string;
  periode: string;
  montant_prevu: number;
  montant_reel: number | null;
  ecart: number | null;
  ecart_pourcentage: number | null;
}

export const PrevisionsHistoryDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>("mape");

  useEffect(() => {
    loadPerformanceHistory();
  }, []);

  const loadPerformanceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('model_performance')
        .select('*')
        .order('evaluation_date', { ascending: true })
        .limit(50);

      if (error) throw error;

      setPerformanceHistory(data || []);
    } catch (error: any) {
      console.error('Error loading performance history:', error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (performanceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des Prévisions
          </CardTitle>
          <CardDescription>Aucune donnée d'historique disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Les performances du modèle seront enregistrées automatiquement lors de chaque analyse comparative.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculer les statistiques globales
  const avgMape = performanceHistory.reduce((sum, item) => sum + item.mape, 0) / performanceHistory.length;
  const avgBias = performanceHistory.reduce((sum, item) => sum + item.bias, 0) / performanceHistory.length;
  const avgPrecision = performanceHistory.reduce((sum, item) => sum + item.precision, 0) / performanceHistory.length;

  // Détecter la tendance
  const recentPerformance = performanceHistory.slice(-3);
  const olderPerformance = performanceHistory.slice(-6, -3);
  const recentAvgMape = recentPerformance.reduce((sum, item) => sum + item.mape, 0) / recentPerformance.length;
  const olderAvgMape = olderPerformance.length > 0 
    ? olderPerformance.reduce((sum, item) => sum + item.mape, 0) / olderPerformance.length 
    : recentAvgMape;
  const tendance = recentAvgMape < olderAvgMape ? 'amélioration' : recentAvgMape > olderAvgMape ? 'dégradation' : 'stable';

  // Préparer les données pour les graphiques
  const chartData = performanceHistory.map(item => ({
    date: new Date(item.evaluation_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
    mape: item.mape,
    bias: item.bias,
    precision: item.precision,
    periode: item.periode_analyse,
  }));

  // Identifier les meilleures et pires performances
  const bestMape = Math.min(...performanceHistory.map(p => p.mape));
  const worstMape = Math.max(...performanceHistory.map(p => p.mape));
  const bestPerformance = performanceHistory.find(p => p.mape === bestMape);
  const worstPerformance = performanceHistory.find(p => p.mape === worstMape);

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'mape': return 'MAPE (%)';
      case 'bias': return 'Biais (%)';
      case 'precision': return 'Précision (%)';
      default: return '';
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'mape': return '#ef4444';
      case 'bias': return '#f97316';
      case 'precision': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <History className="h-8 w-8" />
          Historique des Prévisions
        </h2>
        <p className="text-muted-foreground">
          Évolution de la précision du modèle sur {performanceHistory.length} évaluations
        </p>
      </div>

      {/* Indicateurs de performance globale */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MAPE Moyen</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              avgMape <= 10 ? 'text-green-600' : 
              avgMape <= 20 ? 'text-orange-600' : 
              'text-destructive'
            }`}>
              {avgMape.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sur toutes les évaluations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Biais Moyen</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              Math.abs(avgBias) <= 5 ? 'text-green-600' : 
              Math.abs(avgBias) <= 15 ? 'text-orange-600' : 
              'text-destructive'
            }`}>
              {avgBias > 0 ? '+' : ''}{avgBias.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {avgBias > 5 ? 'Surestimation' : avgBias < -5 ? 'Sous-estimation' : 'Équilibré'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Précision Moyenne</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              avgPrecision >= 80 ? 'text-green-600' : 
              avgPrecision >= 60 ? 'text-orange-600' : 
              'text-destructive'
            }`}>
              {avgPrecision.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Dans intervalle ±10%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendance</CardTitle>
            {tendance === 'amélioration' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : tendance === 'dégradation' ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <Activity className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              tendance === 'amélioration' ? 'text-green-600' : 
              tendance === 'dégradation' ? 'text-destructive' : ''
            }`}>
              {tendance === 'amélioration' ? 'En amélioration' : 
               tendance === 'dégradation' ? 'En dégradation' : 'Stable'}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur les 3 dernières évaluations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes sur la performance */}
      {tendance === 'dégradation' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dégradation de la Performance Détectée</AlertTitle>
          <AlertDescription>
            La précision du modèle s'est détériorée récemment (MAPE: {olderAvgMape.toFixed(1)}% → {recentAvgMape.toFixed(1)}%). 
            Considérer une recalibration ou l'ajout de nouvelles variables explicatives.
          </AlertDescription>
        </Alert>
      )}

      {tendance === 'amélioration' && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Amélioration Continue</AlertTitle>
          <AlertDescription>
            Le modèle montre une amélioration constante (MAPE: {olderAvgMape.toFixed(1)}% → {recentAvgMape.toFixed(1)}%). 
            Les ajustements récents sont efficaces.
          </AlertDescription>
        </Alert>
      )}

      {/* Graphique d'évolution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Évolution de la Performance du Modèle</CardTitle>
              <CardDescription>Suivi des métriques de précision au fil du temps</CardDescription>
            </div>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mape">MAPE</SelectItem>
                <SelectItem value="bias">Biais</SelectItem>
                <SelectItem value="precision">Précision</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: getMetricLabel(selectedMetric), angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={getMetricColor(selectedMetric)}
                strokeWidth={2}
                name={getMetricLabel(selectedMetric)}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Meilleures et pires performances */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Meilleure Performance
            </CardTitle>
            <CardDescription>
              {bestPerformance && new Date(bestPerformance.evaluation_date).toLocaleDateString('fr-FR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bestPerformance && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">MAPE:</span>
                  <Badge variant="default">{bestPerformance.mape.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Biais:</span>
                  <Badge variant="secondary">
                    {bestPerformance.bias > 0 ? '+' : ''}{bestPerformance.bias.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Précision:</span>
                  <Badge variant="default">{bestPerformance.precision.toFixed(0)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Période d'analyse:</span>
                  <span className="text-sm font-medium">{bestPerformance.periode_analyse} mois</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Performance à Améliorer
            </CardTitle>
            <CardDescription>
              {worstPerformance && new Date(worstPerformance.evaluation_date).toLocaleDateString('fr-FR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {worstPerformance && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">MAPE:</span>
                  <Badge variant="destructive">{worstPerformance.mape.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Biais:</span>
                  <Badge variant="secondary">
                    {worstPerformance.bias > 0 ? '+' : ''}{worstPerformance.bias.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Précision:</span>
                  <Badge variant="destructive">{worstPerformance.precision.toFixed(0)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Période d'analyse:</span>
                  <span className="text-sm font-medium">{worstPerformance.periode_analyse} mois</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Historique Détaillé des Évaluations</CardTitle>
          <CardDescription>Liste complète des performances du modèle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-right py-3 px-4 font-medium">MAPE</th>
                  <th className="text-right py-3 px-4 font-medium">Biais</th>
                  <th className="text-right py-3 px-4 font-medium">Précision</th>
                  <th className="text-right py-3 px-4 font-medium">Période</th>
                  <th className="text-right py-3 px-4 font-medium">Nb Prévisions</th>
                </tr>
              </thead>
              <tbody>
                {performanceHistory.slice().reverse().map((perf, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      {new Date(perf.evaluation_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge variant={
                        perf.mape <= 10 ? "default" : 
                        perf.mape <= 20 ? "secondary" : 
                        "destructive"
                      }>
                        {perf.mape.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`font-medium ${
                        Math.abs(perf.bias) <= 5 ? 'text-green-600' : 
                        Math.abs(perf.bias) <= 15 ? 'text-orange-600' : 
                        'text-destructive'
                      }`}>
                        {perf.bias > 0 ? '+' : ''}{perf.bias.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge variant={
                        perf.precision >= 80 ? "default" : 
                        perf.precision >= 60 ? "secondary" : 
                        "destructive"
                      }>
                        {perf.precision.toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4">
                      {perf.periode_analyse} mois
                    </td>
                    <td className="text-right py-3 px-4">
                      {perf.nb_predictions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
