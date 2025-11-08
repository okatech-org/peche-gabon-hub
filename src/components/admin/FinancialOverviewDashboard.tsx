import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Clock, Activity, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateFinancialOverviewPDF } from "@/lib/pdfExport";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface KPIData {
  totalAttendu: number;
  totalRecouvre: number;
  tauxGlobal: number;
  enAttente: number;
  enRetard: number;
  nbQuittances: number;
  tendanceMensuelle: 'hausse' | 'baisse' | 'stable';
  variationMensuelle: number;
}

interface TendanceMensuelle {
  mois: string;
  attendu: number;
  recouvre: number;
  taux: number;
}

interface StatutDistribution {
  statut: string;
  count: number;
  montant: number;
  couleur: string;
}

export const FinancialOverviewDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [tendances, setTendances] = useState<TendanceMensuelle[]>([]);
  const [distribution, setDistribution] = useState<StatutDistribution[]>([]);
  const [performanceModele, setPerformanceModele] = useState<any>(null);
  const [facteursActifs, setFacteursActifs] = useState<any[]>([]);

  const evolutionChartRef = useRef<HTMLDivElement>(null);
  const tauxChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllData();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(() => {
      loadAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      const now = new Date();
      const debutAnnee = new Date(now.getFullYear(), 0, 1);
      const debutMoisDernier = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const finMoisDernier = new Date(now.getFullYear(), now.getMonth(), 0);

      // Charger les quittances de l'année en cours
      const { data: quittancesAnnee, error: errAnnee } = await supabase
        .from('quittances')
        .select('*')
        .gte('date_echeance', debutAnnee.toISOString().split('T')[0]);

      if (errAnnee) throw errAnnee;

      // Calculer les KPI
      const totalAttendu = quittancesAnnee?.reduce((sum, q) => sum + (q.montant || 0), 0) || 0;
      const totalRecouvre = quittancesAnnee?.filter(q => q.statut === 'paye').reduce((sum, q) => sum + (q.montant || 0), 0) || 0;
      const enAttente = quittancesAnnee?.filter(q => q.statut === 'en_attente').reduce((sum, q) => sum + (q.montant || 0), 0) || 0;
      const enRetard = quittancesAnnee?.filter(q => q.statut === 'en_retard').reduce((sum, q) => sum + (q.montant || 0), 0) || 0;
      const tauxGlobal = totalAttendu > 0 ? (totalRecouvre / totalAttendu) * 100 : 0;

      // Calculer la tendance mensuelle
      const { data: moisDernier } = await supabase
        .from('quittances')
        .select('*')
        .gte('date_echeance', debutMoisDernier.toISOString().split('T')[0])
        .lte('date_echeance', finMoisDernier.toISOString().split('T')[0]);

      const moisDernierAttendu = moisDernier?.reduce((sum, q) => sum + (q.montant || 0), 0) || 0;
      const moisDernierRecouvre = moisDernier?.filter(q => q.statut === 'paye').reduce((sum, q) => sum + (q.montant || 0), 0) || 0;
      const tauxMoisDernier = moisDernierAttendu > 0 ? (moisDernierRecouvre / moisDernierAttendu) * 100 : 0;
      
      const variationMensuelle = tauxMoisDernier - tauxGlobal;
      const tendanceMensuelle = Math.abs(variationMensuelle) < 2 ? 'stable' : variationMensuelle > 0 ? 'hausse' : 'baisse';

      setKpi({
        totalAttendu,
        totalRecouvre,
        tauxGlobal,
        enAttente,
        enRetard,
        nbQuittances: quittancesAnnee?.length || 0,
        tendanceMensuelle,
        variationMensuelle,
      });

      // Charger les tendances mensuelles (12 derniers mois)
      const debutTendances = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const { data: quittancesTendances } = await supabase
        .from('quittances')
        .select('*')
        .gte('date_echeance', debutTendances.toISOString().split('T')[0])
        .order('annee')
        .order('mois');

      const groupedTendances: { [key: string]: TendanceMensuelle } = {};
      quittancesTendances?.forEach((q) => {
        const key = `${q.annee}-${q.mois}`;
        if (!groupedTendances[key]) {
          groupedTendances[key] = {
            mois: getMoisLabel(q.mois, q.annee),
            attendu: 0,
            recouvre: 0,
            taux: 0,
          };
        }
        groupedTendances[key].attendu += q.montant || 0;
        if (q.statut === 'paye') {
          groupedTendances[key].recouvre += q.montant || 0;
        }
      });

      const tendancesArray = Object.values(groupedTendances).map(t => ({
        ...t,
        attendu: t.attendu / 1000,
        recouvre: t.recouvre / 1000,
        taux: t.attendu > 0 ? Math.round((t.recouvre * 1000 / t.attendu / 1000) * 100) : 0,
      }));

      setTendances(tendancesArray);

      // Distribution par statut
      const statutCounts = {
        paye: { count: 0, montant: 0, couleur: '#22c55e' },
        en_attente: { count: 0, montant: 0, couleur: '#f59e0b' },
        en_retard: { count: 0, montant: 0, couleur: '#ef4444' },
      };

      quittancesAnnee?.forEach((q) => {
        const statut = q.statut as keyof typeof statutCounts;
        if (statutCounts[statut]) {
          statutCounts[statut].count++;
          statutCounts[statut].montant += q.montant || 0;
        }
      });

      setDistribution([
        { statut: 'Payées', count: statutCounts.paye.count, montant: statutCounts.paye.montant, couleur: statutCounts.paye.couleur },
        { statut: 'En attente', count: statutCounts.en_attente.count, montant: statutCounts.en_attente.montant, couleur: statutCounts.en_attente.couleur },
        { statut: 'En retard', count: statutCounts.en_retard.count, montant: statutCounts.en_retard.montant, couleur: statutCounts.en_retard.couleur },
      ]);

      // Charger la performance du modèle (dernière évaluation)
      const { data: perfData } = await supabase
        .from('model_performance')
        .select('*')
        .order('evaluation_date', { ascending: false })
        .limit(1)
        .single();

      setPerformanceModele(perfData);

      // Charger les facteurs externes actifs
      const { data: facteursData } = await supabase
        .from('facteurs_externes')
        .select('*')
        .eq('actif', true)
        .gte('date_fin', now.toISOString().split('T')[0])
        .order('importance', { ascending: false })
        .limit(5);

      setFacteursActifs(facteursData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const getMoisLabel = (mois: number, annee: number) => {
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${labels[mois - 1]} ${annee}`;
  };

  const handleExportPDF = async () => {
    if (!kpi) return;

    setExporting(true);
    try {
      await generateFinancialOverviewPDF(
        {
          totalAttendu: kpi.totalAttendu,
          totalRecouvre: kpi.totalRecouvre,
          tauxGlobal: kpi.tauxGlobal,
          enAttente: kpi.enAttente,
          enRetard: kpi.enRetard,
          nbQuittances: kpi.nbQuittances,
          tendanceMensuelle: kpi.tendanceMensuelle,
          variationMensuelle: kpi.variationMensuelle,
          performanceModele: performanceModele,
          facteursActifs: facteursActifs,
        },
        evolutionChartRef.current,
        tauxChartRef.current,
        pieChartRef.current,
        barChartRef.current
      );
      toast.success("Rapport PDF généré avec succès");
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!kpi) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tableau de Bord Financier</CardTitle>
          <CardDescription>Aucune donnée disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord Financier</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble en temps réel - Mis à jour il y a quelques secondes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportPDF}
            disabled={exporting}
            variant="outline"
            className="gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exporter en PDF
              </>
            )}
          </Button>
          <Badge variant="outline" className="gap-2">
            <Activity className="h-3 w-3 animate-pulse" />
            En direct
          </Badge>
        </div>
      </div>

      {/* KPI Principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total Attendu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.totalAttendu.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              {kpi.nbQuittances} quittances cette année
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Recouvré</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpi.totalRecouvre.toLocaleString()} FCFA
            </div>
            <Progress value={kpi.tauxGlobal} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {kpi.tauxGlobal.toFixed(1)}% de recouvrement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {kpi.enAttente.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {((kpi.enAttente / kpi.totalAttendu) * 100).toFixed(1)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {kpi.enRetard.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {((kpi.enRetard / kpi.totalAttendu) * 100).toFixed(1)}% du total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tendance et Performance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={
          kpi.tendanceMensuelle === 'hausse' ? 'border-green-200 bg-green-50/50' :
          kpi.tendanceMensuelle === 'baisse' ? 'border-red-200 bg-red-50/50' :
          'border-blue-200 bg-blue-50/50'
        }>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {kpi.tendanceMensuelle === 'hausse' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : kpi.tendanceMensuelle === 'baisse' ? (
                <TrendingDown className="h-5 w-5 text-destructive" />
              ) : (
                <Activity className="h-5 w-5 text-blue-600" />
              )}
              Tendance Mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              kpi.tendanceMensuelle === 'hausse' ? 'text-green-600' :
              kpi.tendanceMensuelle === 'baisse' ? 'text-destructive' :
              'text-blue-600'
            }`}>
              {kpi.variationMensuelle > 0 ? '+' : ''}{kpi.variationMensuelle.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {kpi.tendanceMensuelle === 'hausse' ? 'En amélioration' :
               kpi.tendanceMensuelle === 'baisse' ? 'En dégradation' :
               'Stabilité'} vs moyenne annuelle
            </p>
          </CardContent>
        </Card>

        {performanceModele && (
          <Card>
            <CardHeader>
              <CardTitle>Précision du Modèle</CardTitle>
              <CardDescription>Dernière évaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">MAPE:</span>
                  <Badge variant={
                    performanceModele.mape <= 10 ? "default" :
                    performanceModele.mape <= 20 ? "secondary" :
                    "destructive"
                  }>
                    {performanceModele.mape.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Précision:</span>
                  <Badge variant={
                    performanceModele.precision >= 80 ? "default" :
                    performanceModele.precision >= 60 ? "secondary" :
                    "destructive"
                  }>
                    {performanceModele.precision.toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Évalué le {new Date(performanceModele.evaluation_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Facteurs Actifs</CardTitle>
            <CardDescription>{facteursActifs.length} facteur(s) en cours</CardDescription>
          </CardHeader>
          <CardContent>
            {facteursActifs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun facteur actif</p>
            ) : (
              <div className="space-y-2">
                {facteursActifs.slice(0, 3).map((facteur) => (
                  <div key={facteur.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{facteur.nom}</span>
                    <Badge variant={
                      facteur.impact_prevu > 0 ? "default" :
                      facteur.impact_prevu < 0 ? "destructive" :
                      "secondary"
                    } className="ml-2">
                      {facteur.impact_prevu > 0 ? '+' : ''}{facteur.impact_prevu}%
                    </Badge>
                  </div>
                ))}
                {facteursActifs.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{facteursActifs.length - 3} autre(s)
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de tendances */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution Mensuelle du Recouvrement</CardTitle>
            <CardDescription>12 derniers mois (en milliers FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={evolutionChartRef}>
              <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={tendances}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value * 1000).toLocaleString()} FCFA`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="attendu"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Attendu"
                />
                <Area
                  type="monotone"
                  dataKey="recouvre"
                  stackId="2"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                  name="Recouvré"
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évolution du Taux de Recouvrement</CardTitle>
            <CardDescription>Performance mensuelle en %</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={tauxChartRef}>
              <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendances}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="taux"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Taux"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution par statut */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribution des Quittances</CardTitle>
            <CardDescription>Par statut de paiement</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={pieChartRef}>
              <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="statut"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.statut}: ${entry.count}`}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.couleur} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des Montants</CardTitle>
            <CardDescription>En FCFA par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={barChartRef}>
              <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="statut" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                <Legend />
                <Bar dataKey="montant" fill="#3b82f6" name="Montant">
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.couleur} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
