import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Target, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GABON_PROVINCES } from "@/lib/constants";

interface ProvinceStats {
  province: string;
  nb_formations: number;
  budget_prevu: number;
  budget_reel: number;
  variance: number;
  roi_moyen: number;
  nb_participants: number;
  cout_par_participant: number;
  efficacite_moyenne: number;
}

export function ComparaisonRegionaleFormations() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProvinceStats[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Charger toutes les formations
      const { data: formations, error: formError } = await supabase
        .from("formations_planifiees")
        .select("*");

      if (formError) throw formError;

      // Charger les participants
      const { data: participants, error: partError } = await supabase
        .from("formations_participants")
        .select("formation_id, user_id");

      if (partError) throw partError;

      // Charger les évaluations
      const { data: evaluations, error: evalError } = await supabase
        .from("formations_evaluations")
        .select("formation_id, amelioration_pct");

      if (evalError) throw evalError;

      // Créer un map des provinces à partir des lieux
      const provinceStats = new Map<string, ProvinceStats>();

      // Initialiser toutes les provinces
      GABON_PROVINCES.forEach((province) => {
        provinceStats.set(province, {
          province,
          nb_formations: 0,
          budget_prevu: 0,
          budget_reel: 0,
          variance: 0,
          roi_moyen: 0,
          nb_participants: 0,
          cout_par_participant: 0,
          efficacite_moyenne: 0,
        });
      });

      // Traiter chaque formation
      formations?.forEach((formation) => {
        // Essayer d'extraire la province du lieu
        let province = "Non spécifié";
        if (formation.lieu) {
          const lieu = formation.lieu.toLowerCase();
          const foundProvince = GABON_PROVINCES.find((p) =>
            lieu.includes(p.toLowerCase())
          );
          if (foundProvince) {
            province = foundProvince;
          }
        }

        const stats = provinceStats.get(province);
        if (stats) {
          stats.nb_formations++;
          stats.budget_prevu += Number(formation.budget_prevu || 0);
          stats.budget_reel += Number(formation.budget_reel || 0);

          // Compter les participants
          const formationParticipants = participants?.filter(
            (p) => p.formation_id === formation.id
          ).length || 0;
          stats.nb_participants += formationParticipants;

          // Récupérer l'évaluation
          const evaluation = evaluations?.find(
            (e) => e.formation_id === formation.id
          );
          if (evaluation && evaluation.amelioration_pct) {
            stats.efficacite_moyenne += Number(evaluation.amelioration_pct);
          }
        }
      });

      // Calculer les moyennes et métriques finales
      const finalStats: ProvinceStats[] = [];
      provinceStats.forEach((stats) => {
        if (stats.nb_formations > 0) {
          stats.variance = stats.budget_reel - stats.budget_prevu;
          stats.efficacite_moyenne = stats.efficacite_moyenne / stats.nb_formations;
          stats.roi_moyen = stats.efficacite_moyenne * 1000; // 1000 FCFA par point d'amélioration
          stats.cout_par_participant =
            stats.nb_participants > 0
              ? stats.budget_reel / stats.nb_participants
              : 0;
          finalStats.push(stats);
        }
      });

      // Trier par ROI décroissant
      finalStats.sort((a, b) => b.roi_moyen - a.roi_moyen);

      setStats(finalStats);
    } catch (error) {
      console.error("Erreur chargement stats régionales:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + " FCFA";
  };

  const chartData = stats.map((s) => ({
    province: s.province,
    "Budget Prévu": s.budget_prevu,
    "Budget Réel": s.budget_reel,
    ROI: s.roi_moyen,
    "Coût/Participant": s.cout_par_participant,
    Efficacité: s.efficacite_moyenne,
  }));

  const radarData = stats.slice(0, 5).map((s) => ({
    province: s.province.substring(0, 10),
    Formations: s.nb_formations,
    Participants: s.nb_participants / 10, // Normalisé
    ROI: s.roi_moyen / 1000, // Normalisé
    Efficacité: s.efficacite_moyenne,
  }));

  const meilleurROI = stats.length > 0 ? stats[0] : null;
  const plusEfficace = [...stats].sort(
    (a, b) => b.efficacite_moyenne - a.efficacite_moyenne
  )[0];
  const plusEconomique = [...stats].sort(
    (a, b) => a.cout_par_participant - b.cout_par_participant
  )[0];

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
      {/* Indicateurs Clés */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Meilleur ROI
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {meilleurROI ? (
              <>
                <div className="text-2xl font-bold">{meilleurROI.province}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(meilleurROI.roi_moyen)} par formation
                </p>
                <Badge variant="default" className="mt-2">
                  {meilleurROI.efficacite_moyenne.toFixed(1)}% d'amélioration
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plus Efficace
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {plusEfficace ? (
              <>
                <div className="text-2xl font-bold">{plusEfficace.province}</div>
                <p className="text-xs text-muted-foreground">
                  {plusEfficace.efficacite_moyenne.toFixed(1)}% d'amélioration moyenne
                </p>
                <Badge variant="secondary" className="mt-2">
                  {plusEfficace.nb_formations} formations
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plus Économique
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {plusEconomique ? (
              <>
                <div className="text-2xl font-bold">
                  {plusEconomique.province}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(plusEconomique.cout_par_participant)}/participant
                </p>
                <Badge variant="outline" className="mt-2">
                  {plusEconomique.nb_participants} participants
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison Inter-Régionale</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="budget" className="space-y-4">
            <TabsList>
              <TabsTrigger value="budget">Budgets</TabsTrigger>
              <TabsTrigger value="roi">ROI</TabsTrigger>
              <TabsTrigger value="efficacite">Efficacité</TabsTrigger>
              <TabsTrigger value="radar">Vue Globale</TabsTrigger>
            </TabsList>

            <TabsContent value="budget" className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="province"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="Budget Prévu" fill="hsl(var(--primary))" />
                  <Bar dataKey="Budget Réel" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="roi" className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="province"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="ROI" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="efficacite" className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="province"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toFixed(2) + "%"} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Efficacité"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Coût/Participant"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="radar" className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="province" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Performance"
                    dataKey="ROI"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Efficacité"
                    dataKey="Efficacité"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tableau Détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par Province</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Province</th>
                  <th className="text-right py-2">Formations</th>
                  <th className="text-right py-2">Participants</th>
                  <th className="text-right py-2">Budget Prévu</th>
                  <th className="text-right py-2">Budget Réel</th>
                  <th className="text-right py-2">Variance</th>
                  <th className="text-right py-2">ROI</th>
                  <th className="text-right py-2">Efficacité</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (
                  <tr key={stat.province} className="border-b hover:bg-muted/50">
                    <td className="py-2 font-medium">{stat.province}</td>
                    <td className="text-right">{stat.nb_formations}</td>
                    <td className="text-right">{stat.nb_participants}</td>
                    <td className="text-right">
                      {formatCurrency(stat.budget_prevu)}
                    </td>
                    <td className="text-right">
                      {formatCurrency(stat.budget_reel)}
                    </td>
                    <td className="text-right">
                      <span
                        className={
                          stat.variance > 0 ? "text-destructive" : "text-green-600"
                        }
                      >
                        {stat.variance > 0 ? (
                          <TrendingUp className="inline h-4 w-4" />
                        ) : (
                          <TrendingDown className="inline h-4 w-4" />
                        )}
                        {formatCurrency(Math.abs(stat.variance))}
                      </span>
                    </td>
                    <td className="text-right">
                      {formatCurrency(stat.roi_moyen)}
                    </td>
                    <td className="text-right">
                      <Badge variant="outline">
                        {stat.efficacite_moyenne.toFixed(1)}%
                      </Badge>
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
}
