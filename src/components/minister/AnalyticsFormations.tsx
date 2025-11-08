import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Target, Users, Award, BarChart3, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FormationEvaluation {
  id: string;
  formation_id: string;
  formation_titre: string;
  formation_type: string;
  date_debut: string;
  date_fin: string;
  formateur_nom: string;
  nb_participants: number;
  efficacite_avant: number;
  efficacite_apres: number;
  amelioration_pct: number;
  periode_avant_debut: string;
  periode_avant_fin: string;
  periode_apres_debut: string;
  periode_apres_fin: string;
  indicateurs_impactes: string[];
  note_formateur: number | null;
}

interface IndicateurAnalysis {
  indicateur: string;
  nb_formations: number;
  amelioration_moyenne: number;
  amelioration_mediane: number;
  taux_succes: number;
}

interface TypeFormationAnalysis {
  type_formation: string;
  nb_formations: number;
  amelioration_moyenne: number;
  note_moyenne: number;
  nb_participants_total: number;
}

export function AnalyticsFormations() {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<FormationEvaluation[]>([]);
  const [indicateursAnalysis, setIndicateursAnalysis] = useState<IndicateurAnalysis[]>([]);
  const [typesAnalysis, setTypesAnalysis] = useState<TypeFormationAnalysis[]>([]);
  const [periodFilter, setPeriodFilter] = useState<string>("12");
  const [typeFilter, setTypeFilter] = useState<string>("tous");

  useEffect(() => {
    loadData();
  }, [periodFilter, typeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Calculer la date limite selon le filtre de période
      const now = new Date();
      const monthsAgo = parseInt(periodFilter);
      const dateLimit = new Date(now.setMonth(now.getMonth() - monthsAgo));

      // Récupérer les évaluations avec les formations associées
      let query = supabase
        .from("formations_evaluations")
        .select(`
          *,
          formations_planifiees (
            titre,
            type_formation,
            date_debut,
            date_fin,
            formateur_id,
            nb_participants_inscrits
          )
        `)
        .gte("date_evaluation", dateLimit.toISOString().split('T')[0])
        .order("date_evaluation", { ascending: false });

      const { data: evaluationsData, error: evalError } = await query;

      if (evalError) throw evalError;

      // Récupérer les noms des formateurs
      const formateurIds = evaluationsData
        ?.map((e: any) => e.formations_planifiees?.formateur_id)
        .filter((id: any) => id);

      const { data: formateurs } = await supabase
        .from("formateurs")
        .select("id, nom, prenom")
        .in("id", formateurIds || []);

      // Récupérer les évaluations des formateurs
      const { data: formateursEvals } = await supabase
        .from("formateurs_evaluations")
        .select("formateur_id, note_globale")
        .in("formateur_id", formateurIds || []);

      // Mapper les données
      const mappedEvaluations: FormationEvaluation[] = (evaluationsData || [])
        .filter((e: any) => e.formations_planifiees)
        .map((e: any) => {
          const formation = e.formations_planifiees;
          const formateur = formateurs?.find((f: any) => f.id === formation.formateur_id);
          const formateurEval = formateursEvals?.find((fe: any) => fe.formateur_id === formation.formateur_id);

          return {
            id: e.id,
            formation_id: e.formation_id,
            formation_titre: formation.titre,
            formation_type: formation.type_formation,
            date_debut: formation.date_debut,
            date_fin: formation.date_fin,
            formateur_nom: formateur ? `${formateur.prenom} ${formateur.nom}` : "Non assigné",
            nb_participants: formation.nb_participants_inscrits || 0,
            efficacite_avant: e.efficacite_avant,
            efficacite_apres: e.efficacite_apres,
            amelioration_pct: e.amelioration_pct || 0,
            periode_avant_debut: e.periode_avant_debut,
            periode_avant_fin: e.periode_avant_fin,
            periode_apres_debut: e.periode_apres_debut,
            periode_apres_fin: e.periode_apres_fin,
            indicateurs_impactes: e.indicateurs_impactes || [],
            note_formateur: formateurEval?.note_globale || null,
          };
        });

      // Filtrer par type si nécessaire
      const filteredEvaluations = typeFilter === "tous"
        ? mappedEvaluations
        : mappedEvaluations.filter(e => e.formation_type === typeFilter);

      setEvaluations(filteredEvaluations);

      // Analyser par indicateur
      const indicateursMap = new Map<string, number[]>();
      filteredEvaluations.forEach((e) => {
        e.indicateurs_impactes.forEach((ind) => {
          if (!indicateursMap.has(ind)) {
            indicateursMap.set(ind, []);
          }
          indicateursMap.get(ind)!.push(e.amelioration_pct);
        });
      });

      const indicateursAnalysisData: IndicateurAnalysis[] = Array.from(indicateursMap.entries()).map(
        ([indicateur, ameliorations]) => {
          const sorted = [...ameliorations].sort((a, b) => a - b);
          const mediane = sorted.length > 0
            ? sorted[Math.floor(sorted.length / 2)]
            : 0;

          return {
            indicateur,
            nb_formations: ameliorations.length,
            amelioration_moyenne: ameliorations.reduce((sum, val) => sum + val, 0) / ameliorations.length,
            amelioration_mediane: mediane,
            taux_succes: (ameliorations.filter((a) => a > 0).length / ameliorations.length) * 100,
          };
        }
      );

      setIndicateursAnalysis(indicateursAnalysisData);

      // Analyser par type de formation
      const typesMap = new Map<string, FormationEvaluation[]>();
      filteredEvaluations.forEach((e) => {
        if (!typesMap.has(e.formation_type)) {
          typesMap.set(e.formation_type, []);
        }
        typesMap.get(e.formation_type)!.push(e);
      });

      const typesAnalysisData: TypeFormationAnalysis[] = Array.from(typesMap.entries()).map(
        ([type, evals]) => {
          const ameliorations = evals.map((e) => e.amelioration_pct);
          const notes = evals.map((e) => e.note_formateur).filter((n) => n !== null) as number[];

          return {
            type_formation: type,
            nb_formations: evals.length,
            amelioration_moyenne: ameliorations.reduce((sum, val) => sum + val, 0) / ameliorations.length,
            note_moyenne: notes.length > 0
              ? notes.reduce((sum, val) => sum + val, 0) / notes.length
              : 0,
            nb_participants_total: evals.reduce((sum, e) => sum + e.nb_participants, 0),
          };
        }
      );

      setTypesAnalysis(typesAnalysisData);
    } catch (error) {
      console.error("Erreur chargement analytics:", error);
      toast.error("Erreur lors du chargement des analyses");
    } finally {
      setLoading(false);
    }
  };

  const calculateGlobalStats = () => {
    if (evaluations.length === 0) {
      return {
        nb_formations_total: 0,
        amelioration_moyenne: 0,
        taux_succes: 0,
        nb_participants_total: 0,
        note_moyenne: 0,
      };
    }

    const ameliorations = evaluations.map((e) => e.amelioration_pct);
    const notes = evaluations.map((e) => e.note_formateur).filter((n) => n !== null) as number[];

    return {
      nb_formations_total: evaluations.length,
      amelioration_moyenne: ameliorations.reduce((sum, val) => sum + val, 0) / ameliorations.length,
      taux_succes: (ameliorations.filter((a) => a > 0).length / ameliorations.length) * 100,
      nb_participants_total: evaluations.reduce((sum, e) => sum + e.nb_participants, 0),
      note_moyenne: notes.length > 0 ? notes.reduce((sum, val) => sum + val, 0) / notes.length : 0,
    };
  };

  const getTimelineData = () => {
    const sortedByDate = [...evaluations].sort(
      (a, b) => new Date(a.date_fin).getTime() - new Date(b.date_fin).getTime()
    );

    return sortedByDate.map((e) => ({
      date: format(new Date(e.date_fin), "MMM yyyy", { locale: fr }),
      amelioration: Math.round(e.amelioration_pct * 10) / 10,
      formation: e.formation_titre.substring(0, 20),
    }));
  };

  const getCorrelationData = () => {
    return evaluations
      .filter((e) => e.note_formateur !== null)
      .map((e) => ({
        note_formateur: e.note_formateur,
        amelioration: Math.round(e.amelioration_pct * 10) / 10,
        type: e.formation_type,
      }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const stats = calculateGlobalStats();

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Période:</span>
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 derniers mois</SelectItem>
                <SelectItem value="6">6 derniers mois</SelectItem>
                <SelectItem value="12">12 derniers mois</SelectItem>
                <SelectItem value="24">24 derniers mois</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="technique">Technique</SelectItem>
                <SelectItem value="reglementaire">Réglementaire</SelectItem>
                <SelectItem value="gestion">Gestion</SelectItem>
                <SelectItem value="securite">Sécurité</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" variant="outline" onClick={loadData} className="ml-auto">
              <BarChart3 className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Formations évaluées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nb_formations_total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Amélioration moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">
                +{stats.amelioration_moyenne.toFixed(1)}%
              </div>
              {stats.amelioration_moyenne > 0 && <TrendingUp className="h-5 w-5 text-green-600" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de succès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.taux_succes.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Formations avec amélioration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Participants formés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nb_participants_total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Note moyenne formateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.note_moyenne.toFixed(1)}/5</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs d'analyse */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Évolution temporelle</TabsTrigger>
          <TabsTrigger value="indicateurs">Par indicateur</TabsTrigger>
          <TabsTrigger value="types">Par type</TabsTrigger>
          <TabsTrigger value="correlation">Corrélations</TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de l'efficacité des formations</CardTitle>
              <CardDescription>
                Amélioration des indicateurs dans le temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getTimelineData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Amélioration (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amelioration"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Amélioration (%)"
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Liste des formations récentes */}
              <div className="mt-6 space-y-2">
                <h4 className="font-semibold text-sm">Dernières formations évaluées</h4>
                {evaluations.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{e.formation_titre}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(e.date_fin), "dd MMMM yyyy", { locale: fr })} • {e.formateur_nom}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={e.amelioration_pct > 0 ? "default" : "secondary"}>
                        {e.amelioration_pct > 0 ? "+" : ""}{e.amelioration_pct.toFixed(1)}%
                      </Badge>
                      <Badge variant="outline">{e.nb_participants} participants</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Par indicateur */}
        <TabsContent value="indicateurs">
          <Card>
            <CardHeader>
              <CardTitle>Impact par indicateur de pêche</CardTitle>
              <CardDescription>
                Analyse de l'amélioration par type d'indicateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={indicateursAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="indicateur" />
                  <YAxis label={{ value: 'Amélioration moyenne (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amelioration_moyenne" fill="#3b82f6" name="Amélioration moyenne (%)">
                    {indicateursAnalysis.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.amelioration_moyenne > 10 ? "#10b981" : entry.amelioration_moyenne > 0 ? "#3b82f6" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Détails des indicateurs */}
              <div className="mt-6 grid gap-3">
                {indicateursAnalysis.map((ind, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{ind.indicateur}</div>
                      <div className="text-sm text-muted-foreground">
                        {ind.nb_formations} formation(s) • Médiane: {ind.amelioration_mediane.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          +{ind.amelioration_moyenne.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ind.taux_succes.toFixed(0)}% de succès
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Par type */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Efficacité par type de formation</CardTitle>
              <CardDescription>
                Comparaison des différents types de formation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={typesAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type_formation" />
                  <YAxis yAxisId="left" label={{ value: 'Amélioration (%)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Note', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="amelioration_moyenne" fill="#10b981" name="Amélioration (%)" />
                  <Bar yAxisId="right" dataKey="note_moyenne" fill="#f59e0b" name="Note formateur" />
                </BarChart>
              </ResponsiveContainer>

              {/* Détails des types */}
              <div className="mt-6 grid gap-3">
                {typesAnalysis.map((type, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-lg">{type.type_formation}</div>
                      <Badge variant="secondary">{type.nb_formations} formation(s)</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Amélioration</div>
                        <div className="text-lg font-bold text-green-600">
                          +{type.amelioration_moyenne.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Note formateur</div>
                        <div className="text-lg font-bold">{type.note_moyenne.toFixed(1)}/5</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Participants</div>
                        <div className="text-lg font-bold">{type.nb_participants_total}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Corrélations */}
        <TabsContent value="correlation">
          <Card>
            <CardHeader>
              <CardTitle>Corrélation: Note formateur vs Amélioration</CardTitle>
              <CardDescription>
                Relation entre la qualité du formateur et l'efficacité de la formation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="note_formateur"
                    name="Note formateur"
                    domain={[0, 5]}
                    label={{ value: 'Note formateur', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="amelioration"
                    name="Amélioration"
                    label={{ value: 'Amélioration (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={getCorrelationData()} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Insights clés
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>
                      Les formations dispensées par des formateurs bien notés (≥4/5) montrent une amélioration
                      moyenne de{" "}
                      <strong>
                        {evaluations
                          .filter((e) => e.note_formateur && e.note_formateur >= 4)
                          .reduce((sum, e) => sum + e.amelioration_pct, 0) /
                          (evaluations.filter((e) => e.note_formateur && e.note_formateur >= 4).length || 1)}
                        %
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>
                      <strong>{stats.nb_participants_total}</strong> personnes ont bénéficié des formations
                      sur la période
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span>
                      Le type de formation le plus efficace est{" "}
                      <strong>
                        {typesAnalysis.length > 0
                          ? typesAnalysis.sort((a, b) => b.amelioration_moyenne - a.amelioration_moyenne)[0]
                              ?.type_formation
                          : "N/A"}
                      </strong>{" "}
                      avec{" "}
                      <strong>
                        +
                        {typesAnalysis.length > 0
                          ? typesAnalysis.sort((a, b) => b.amelioration_moyenne - a.amelioration_moyenne)[0]
                              ?.amelioration_moyenne.toFixed(1)
                          : 0}
                        %
                      </strong>{" "}
                      d'amélioration moyenne
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
