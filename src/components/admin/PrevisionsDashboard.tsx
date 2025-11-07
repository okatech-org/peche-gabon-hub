import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, DollarSign, Activity, Download } from "lucide-react";
import { toast } from "sonner";
import { generatePrevisionsPDF } from "@/lib/pdfExport";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface HistoriqueData {
  mois: number;
  annee: number;
  attendu: number;
  paye: number;
  tauxRecouvrement: number;
}

export const PrevisionsDashboard = () => {
  const [historique, setHistorique] = useState<HistoriqueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("12"); // Nombre de mois à analyser
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      // Charger les données des 24 derniers mois
      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - 24);

      const { data, error } = await supabase
        .from('quittances')
        .select('*')
        .gte('date_echeance', dateDebut.toISOString().split('T')[0])
        .order('annee')
        .order('mois');

      if (error) throw error;

      // Regrouper par mois/année
      const groupedData: { [key: string]: HistoriqueData } = {};

      (data || []).forEach((q) => {
        const key = `${q.annee}-${q.mois}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            mois: q.mois,
            annee: q.annee,
            attendu: 0,
            paye: 0,
            tauxRecouvrement: 0,
          };
        }
        groupedData[key].attendu += q.montant || 0;
        if (q.statut === 'paye') {
          groupedData[key].paye += q.montant || 0;
        }
      });

      // Calculer les taux de recouvrement
      const historiqueArray = Object.values(groupedData).map((item) => ({
        ...item,
        tauxRecouvrement: item.attendu > 0 ? (item.paye / item.attendu) * 100 : 0,
      }));

      setHistorique(historiqueArray);
    } catch (error: any) {
      console.error('Error loading historique:', error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  // Calculer les prévisions
  const calculatePrevisions = (): {
    moyenneAttendu: number;
    moyenneTaux: number;
    tendance: 'hausse' | 'baisse' | 'stable';
    ecartType: number;
    volatilite: 'haute' | 'moyenne' | 'faible';
    previsions: {
      mois: number;
      annee: number;
      montantPrevu: number;
      tauxPrevu: number;
      recouvrementPrevu: number;
      intervalleConfiance: number;
    }[];
  } | null => {
    const periodLength = parseInt(selectedPeriod);
    const dataToAnalyze = historique.slice(-periodLength);

    if (dataToAnalyze.length < 3) {
      return null;
    }

    // Moyenne mobile pour le montant attendu
    const moyenneAttendu = dataToAnalyze.reduce((sum, item) => sum + item.attendu, 0) / dataToAnalyze.length;
    
    // Moyenne mobile pour le taux de recouvrement
    const moyenneTaux = dataToAnalyze.reduce((sum, item) => sum + item.tauxRecouvrement, 0) / dataToAnalyze.length;

    // Tendance (régression linéaire simple pour le taux)
    const n = dataToAnalyze.length;
    const sumX = dataToAnalyze.reduce((sum, _, idx) => sum + idx, 0);
    const sumY = dataToAnalyze.reduce((sum, item) => sum + item.tauxRecouvrement, 0);
    const sumXY = dataToAnalyze.reduce((sum, item, idx) => sum + (idx * item.tauxRecouvrement), 0);
    const sumX2 = dataToAnalyze.reduce((sum, _, idx) => sum + (idx * idx), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const tendance = slope > 0 ? 'hausse' : slope < 0 ? 'baisse' : 'stable';

    // Écart type pour identifier la volatilité
    const variance = dataToAnalyze.reduce((sum, item) => {
      return sum + Math.pow(item.tauxRecouvrement - moyenneTaux, 2);
    }, 0) / n;
    const ecartType = Math.sqrt(variance);

    // Générer les prévisions pour les 6 prochains mois
    const now = new Date();
    const previsions = Array.from({ length: 6 }, (_, i) => {
      const moisIndex = (now.getMonth() + i + 1) % 12;
      const annee = now.getFullYear() + Math.floor((now.getMonth() + i + 1) / 12);
      
      // Prévision basée sur la tendance
      const tauxPrevu = Math.max(0, Math.min(100, moyenneTaux + (slope * (n + i))));
      const montantPrevu = moyenneAttendu;
      const recouvrementPrevu = (montantPrevu * tauxPrevu) / 100;

      return {
        mois: moisIndex + 1,
        annee,
        montantPrevu,
        tauxPrevu,
        recouvrementPrevu,
        intervalleConfiance: ecartType * 1.96, // 95% intervalle de confiance
      };
    });

    return {
      moyenneAttendu,
      moyenneTaux,
      tendance,
      ecartType,
      volatilite: ecartType > 15 ? 'haute' : ecartType > 8 ? 'moyenne' : 'faible',
      previsions,
    };
  };

  const getMoisLabel = (mois: number) => {
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return labels[mois - 1];
  };

  const getMoisLabelLong = (mois: number) => {
    const labels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return labels[mois - 1];
  };

  const previsions = calculatePrevisions();

  const handleExportPDF = async () => {
    if (!previsions) return;
    
    setExporting(true);
    try {
      const combinedChart = document.getElementById('combined-chart');
      const tauxChart = document.getElementById('taux-chart');
      
      await generatePrevisionsPDF(
        previsions,
        combinedChart,
        tauxChart,
        selectedPeriod
      );
      
      toast.success('Rapport PDF généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setExporting(false);
    }
  };

  // Préparer les données pour les graphiques
  const historiqueFormatted = historique.slice(-12).map(item => ({
    periode: `${getMoisLabel(item.mois)} ${item.annee}`,
    attendu: item.attendu / 1000,
    paye: item.paye / 1000,
    taux: Math.round(item.tauxRecouvrement),
  }));

  const previsionsFormatted = previsions?.previsions.map(item => ({
    periode: `${getMoisLabel(item.mois)} ${item.annee}`,
    montantPrevu: item.montantPrevu / 1000,
    recouvrementPrevu: item.recouvrementPrevu / 1000,
    tauxPrevu: Math.round(item.tauxPrevu),
  })) || [];

  // Combiner historique et prévisions pour le graphique
  const combinedData = [
    ...historiqueFormatted.map(item => ({ ...item, type: 'historique' })),
    ...previsionsFormatted.map(item => ({ 
      periode: item.periode,
      attendu: item.montantPrevu,
      paye: item.recouvrementPrevu,
      taux: item.tauxPrevu,
      type: 'prevision'
    })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!previsions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prévisions Financières</CardTitle>
          <CardDescription>Données insuffisantes pour générer des prévisions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Il faut au moins 3 mois de données historiques pour générer des prévisions fiables.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Prévisions Financières</h2>
          <p className="text-muted-foreground">
            Analyse prédictive basée sur l'historique des paiements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 derniers mois</SelectItem>
              <SelectItem value="12">12 derniers mois</SelectItem>
              <SelectItem value="24">24 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleExportPDF} 
            disabled={exporting || !previsions}
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
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Indicateurs clés */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recouvrement Moyen</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{previsions.moyenneTaux.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Sur les {selectedPeriod} derniers mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendance</CardTitle>
            {previsions.tendance === 'hausse' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : previsions.tendance === 'baisse' ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <Activity className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              previsions.tendance === 'hausse' ? 'text-green-600' : 
              previsions.tendance === 'baisse' ? 'text-destructive' : ''
            }`}>
              {previsions.tendance === 'hausse' ? 'À la hausse' : 
               previsions.tendance === 'baisse' ? 'À la baisse' : 'Stable'}
            </div>
            <p className="text-xs text-muted-foreground">
              Évolution du taux de recouvrement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volatilité</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {previsions.volatilite === 'haute' ? 'Haute' : 
               previsions.volatilite === 'moyenne' ? 'Moyenne' : 'Faible'}
            </div>
            <p className="text-xs text-muted-foreground">
              Écart-type: {previsions.ecartType.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Moyen Mensuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {previsions.moyenneAttendu.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              Attendu par mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {previsions.tendance === 'baisse' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tendance à la baisse détectée</AlertTitle>
          <AlertDescription>
            Le taux de recouvrement montre une tendance à la baisse. 
            Il est recommandé de renforcer les actions de relance et d'identifier les causes de cette diminution.
          </AlertDescription>
        </Alert>
      )}

      {previsions.volatilite === 'haute' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Volatilité élevée</AlertTitle>
          <AlertDescription>
            Les taux de recouvrement varient fortement d'un mois à l'autre (écart-type: {previsions.ecartType.toFixed(1)}%). 
            Cela peut indiquer des problèmes de régularité dans les paiements.
          </AlertDescription>
        </Alert>
      )}

      {/* Graphique combiné historique et prévisions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique et Prévisions de Recouvrement</CardTitle>
          <CardDescription>
            12 derniers mois + 6 mois de prévisions (en milliers FCFA)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div id="combined-chart">
            <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periode" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `${(value * 1000).toLocaleString()} FCFA`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="attendu"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Montant Attendu"
              />
              <Area
                type="monotone"
                dataKey="paye"
                stackId="2"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
                name="Montant Recouvré"
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Graphique taux de recouvrement */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution du Taux de Recouvrement</CardTitle>
          <CardDescription>Historique et prévisions en pourcentage</CardDescription>
        </CardHeader>
        <CardContent>
          <div id="taux-chart">
            <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periode" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="taux"
                stroke="#22c55e"
                strokeWidth={2}
                name="Taux de Recouvrement"
                dot={(props: any) => {
                  const isHistorique = combinedData[props.index]?.type === 'historique';
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={isHistorique ? '#22c55e' : '#f97316'}
                      stroke={isHistorique ? '#22c55e' : '#f97316'}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des prévisions détaillées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prévisions Détaillées (6 prochains mois)
          </CardTitle>
          <CardDescription>
            Projections basées sur l'analyse des {selectedPeriod} derniers mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Période</th>
                  <th className="text-right py-3 px-4 font-medium">Montant Prévu</th>
                  <th className="text-right py-3 px-4 font-medium">Taux Prévu</th>
                  <th className="text-right py-3 px-4 font-medium">Recouvrement Estimé</th>
                  <th className="text-right py-3 px-4 font-medium">Confiance</th>
                </tr>
              </thead>
              <tbody>
                {previsions.previsions.map((prev, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">
                      {getMoisLabelLong(prev.mois)} {prev.annee}
                    </td>
                    <td className="text-right py-3 px-4">
                      {prev.montantPrevu.toLocaleString()} FCFA
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge variant={prev.tauxPrevu >= 80 ? "default" : prev.tauxPrevu >= 60 ? "secondary" : "destructive"}>
                        {prev.tauxPrevu.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4 text-green-600 font-medium">
                      {prev.recouvrementPrevu.toLocaleString()} FCFA
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="text-xs text-muted-foreground">
                        ±{prev.intervalleConfiance.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations</CardTitle>
          <CardDescription>Basées sur l'analyse prédictive</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {previsions.moyenneTaux < 70 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600 shrink-0" />
                <span className="text-sm">
                  Le taux de recouvrement moyen ({previsions.moyenneTaux.toFixed(1)}%) est inférieur à 70%. 
                  Mettre en place un système de relance automatique.
                </span>
              </li>
            )}
            {previsions.tendance === 'baisse' && (
              <li className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                <span className="text-sm">
                  La tendance est à la baisse. Analyser les causes et renforcer les actions de recouvrement.
                </span>
              </li>
            )}
            {previsions.volatilite === 'haute' && (
              <li className="flex items-start gap-2">
                <Activity className="h-4 w-4 mt-0.5 text-orange-600 shrink-0" />
                <span className="text-sm">
                  Volatilité élevée détectée. Standardiser les processus de paiement et de relance.
                </span>
              </li>
            )}
            {previsions.moyenneTaux >= 80 && previsions.tendance === 'hausse' && (
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span className="text-sm">
                  Excellente performance ! Maintenir les pratiques actuelles et capitaliser sur les bonnes pratiques.
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};