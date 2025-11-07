import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, DollarSign, Activity, Download, BarChart3, History, Wind } from "lucide-react";
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

interface ComparisonData {
  periode: string;
  mois: number;
  annee: number;
  reel: number;
  prevu: number;
  ecart: number;
  ecartPourcentage: number;
}

export const PrevisionsDashboard = () => {
  const { user } = useAuth();
  const [historique, setHistorique] = useState<HistoriqueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("12"); // Nombre de mois à analyser
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [facteursExternes, setFacteursExternes] = useState<any[]>([]);
  const [modeleSaisonnier, setModeleSaisonnier] = useState<any[]>([]);

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      // Charger les données des 24 derniers mois
      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - 24);

      const [quittancesResult, facteursResult, saisonnierResult] = await Promise.all([
        supabase
          .from('quittances')
          .select('*')
          .gte('date_echeance', dateDebut.toISOString().split('T')[0])
          .order('annee')
          .order('mois'),
        supabase
          .from('facteurs_externes')
          .select('*')
          .eq('actif', true)
          .order('date_debut'),
        supabase
          .from('modeles_saisonniers')
          .select('*')
          .order('mois')
      ]);

      if (quittancesResult.error) throw quittancesResult.error;

      setFacteursExternes(facteursResult.data || []);
      setModeleSaisonnier(saisonnierResult.data || []);

      // Regrouper par mois/année
      const groupedData: { [key: string]: HistoriqueData } = {};

      (quittancesResult.data || []).forEach((q) => {
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
      const moisDate = new Date(annee, moisIndex, 15); // Milieu du mois
      
      // Prévision basée sur la tendance de base
      let tauxPrevu = moyenneTaux + (slope * (n + i));
      
      // Appliquer le coefficient saisonnier
      const coeffSaisonnier = modeleSaisonnier.find(m => m.mois === moisIndex + 1)?.coefficient_saisonnier || 1.0;
      tauxPrevu = tauxPrevu * coeffSaisonnier;
      
      // Appliquer les facteurs externes actifs pour cette période
      facteursExternes.forEach(facteur => {
        const dateDebut = new Date(facteur.date_debut);
        const dateFin = new Date(facteur.date_fin);
        if (moisDate >= dateDebut && moisDate <= dateFin) {
          // Pondérer l'impact selon l'importance
          const poids = facteur.importance === 'forte' ? 1.0 : facteur.importance === 'moyenne' ? 0.7 : 0.4;
          tauxPrevu += (facteur.impact_prevu * poids);
        }
      });
      
      // Limiter le taux entre 0 et 100
      tauxPrevu = Math.max(0, Math.min(100, tauxPrevu));
      
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

  // Calculer les comparaisons prévisions vs réalisé
  const calculateComparison = (): {
    comparisons: ComparisonData[];
    mape: number; // Mean Absolute Percentage Error
    bias: number; // Biais moyen
    precision: number; // % de prévisions dans l'intervalle ±10%
  } | null => {
    if (historique.length < 12) return null;

    // Prendre les 6 derniers mois comme période de test
    const derniersMois = historique.slice(-6);
    
    // Recalculer ce qu'auraient été les prévisions il y a 6 mois
    const historiqueAvantTest = historique.slice(0, -6);
    if (historiqueAvantTest.length < 3) return null;

    const periodLength = parseInt(selectedPeriod);
    const dataToAnalyze = historiqueAvantTest.slice(-Math.min(periodLength, historiqueAvantTest.length));

    // Moyenne mobile pour le taux de recouvrement
    const moyenneTaux = dataToAnalyze.reduce((sum, item) => sum + item.tauxRecouvrement, 0) / dataToAnalyze.length;
    
    // Tendance (régression linéaire)
    const n = dataToAnalyze.length;
    const sumX = dataToAnalyze.reduce((sum, _, idx) => sum + idx, 0);
    const sumY = dataToAnalyze.reduce((sum, item) => sum + item.tauxRecouvrement, 0);
    const sumXY = dataToAnalyze.reduce((sum, item, idx) => sum + (idx * item.tauxRecouvrement), 0);
    const sumX2 = dataToAnalyze.reduce((sum, _, idx) => sum + (idx * idx), 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Générer les prévisions pour les 6 mois de test
    const comparisons: ComparisonData[] = derniersMois.map((realData, idx) => {
      const tauxPrevu = Math.max(0, Math.min(100, moyenneTaux + (slope * (n + idx))));
      const recouvrementPrevu = (realData.attendu * tauxPrevu) / 100;
      const recouvrementReel = realData.paye;
      const ecart = recouvrementReel - recouvrementPrevu;
      const ecartPourcentage = recouvrementPrevu > 0 ? (ecart / recouvrementPrevu) * 100 : 0;

      return {
        periode: `${getMoisLabel(realData.mois)} ${realData.annee}`,
        mois: realData.mois,
        annee: realData.annee,
        reel: recouvrementReel,
        prevu: recouvrementPrevu,
        ecart,
        ecartPourcentage,
      };
    });

    // Calculer le MAPE (Mean Absolute Percentage Error)
    const mape = comparisons.reduce((sum, item) => {
      return sum + Math.abs(item.ecartPourcentage);
    }, 0) / comparisons.length;

    // Calculer le biais moyen
    const bias = comparisons.reduce((sum, item) => sum + item.ecartPourcentage, 0) / comparisons.length;

    // Calculer la précision (% dans l'intervalle ±10%)
    const dansIntervalle = comparisons.filter(item => Math.abs(item.ecartPourcentage) <= 10).length;
    const precision = (dansIntervalle / comparisons.length) * 100;

    return {
      comparisons,
      mape,
      bias,
      precision,
    };
  };

  const comparison = calculateComparison();

  // Sauvegarder les prévisions dans l'historique
  const handleSavePrevisions = async () => {
    if (!previsions || !user) {
      toast.error("Impossible de sauvegarder les prévisions");
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Sauvegarder les prévisions
      const previsionsToSave = previsions.previsions.map(prev => ({
        version_date: today,
        periode_analyse: parseInt(selectedPeriod),
        mois_prevu: prev.mois,
        annee_prevu: prev.annee,
        montant_prevu: prev.montantPrevu,
        taux_prevu: prev.tauxPrevu,
        recouvrement_prevu: prev.recouvrementPrevu,
        intervalle_confiance: prev.intervalleConfiance,
        moyenne_taux: previsions.moyenneTaux,
        tendance: previsions.tendance,
        ecart_type: previsions.ecartType,
        volatilite: previsions.volatilite,
        created_by: user.id,
      }));

      const { error: prevError } = await supabase
        .from('previsions_history')
        .insert(previsionsToSave);

      if (prevError) throw prevError;

      // Sauvegarder la performance si disponible
      if (comparison) {
        const derniersMois = historique.slice(-6);
        const periodeDebut = new Date(
          derniersMois[0].annee,
          derniersMois[0].mois - 1,
          1
        ).toISOString().split('T')[0];
        const periodeFin = new Date(
          derniersMois[derniersMois.length - 1].annee,
          derniersMois[derniersMois.length - 1].mois - 1,
          1
        ).toISOString().split('T')[0];

        const { error: perfError } = await supabase
          .from('model_performance')
          .insert({
            evaluation_date: today,
            periode_test_debut: periodeDebut,
            periode_test_fin: periodeFin,
            mape: comparison.mape,
            bias: comparison.bias,
            precision: comparison.precision,
            nb_predictions: comparison.comparisons.length,
            periode_analyse: parseInt(selectedPeriod),
          });

        if (perfError) throw perfError;
      }

      toast.success("Prévisions sauvegardées avec succès dans l'historique");
    } catch (error: any) {
      console.error('Error saving previsions:', error);
      toast.error("Erreur lors de la sauvegarde des prévisions");
    } finally {
      setSaving(false);
    }
  };

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
            onClick={handleSavePrevisions} 
            disabled={saving || !previsions}
            variant="secondary"
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <History className="h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>
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

      {/* Facteurs Externes Appliqués */}
      {facteursExternes.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              Facteurs Externes Intégrés aux Prévisions
            </CardTitle>
            <CardDescription>
              Ces facteurs sont automatiquement pris en compte dans le calcul des prévisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {facteursExternes.map((facteur) => (
                <div key={facteur.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{facteur.nom}</span>
                      <Badge variant={
                        facteur.type_facteur === 'economique' ? 'default' :
                        facteur.type_facteur === 'carburant' ? 'destructive' :
                        'secondary'
                      }>
                        {facteur.type_facteur}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(facteur.date_debut).toLocaleDateString('fr-FR')} - {new Date(facteur.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-medium ${
                        facteur.impact_prevu > 0 ? 'text-green-600' : 
                        facteur.impact_prevu < 0 ? 'text-destructive' : ''
                      }`}>
                        Impact: {facteur.impact_prevu > 0 ? '+' : ''}{facteur.impact_prevu}%
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {facteur.importance}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Analyse Comparative Prévisions vs Réalisé */}
      {comparison && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analyse Comparative: Prévisions vs Réalisé
              </CardTitle>
              <CardDescription>
                Évaluation de la précision du modèle sur les 6 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Métriques de précision */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">MAPE (Erreur Moyenne)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${
                        comparison.mape <= 10 ? 'text-green-600' : 
                        comparison.mape <= 20 ? 'text-orange-600' : 
                        'text-destructive'
                      }`}>
                        {comparison.mape.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {comparison.mape <= 10 ? 'Excellente précision' : 
                         comparison.mape <= 20 ? 'Précision acceptable' : 
                         'Précision à améliorer'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Biais du Modèle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${
                        Math.abs(comparison.bias) <= 5 ? 'text-green-600' : 
                        Math.abs(comparison.bias) <= 15 ? 'text-orange-600' : 
                        'text-destructive'
                      }`}>
                        {comparison.bias > 0 ? '+' : ''}{comparison.bias.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {comparison.bias > 5 ? 'Surestimation' : 
                         comparison.bias < -5 ? 'Sous-estimation' : 
                         'Bien calibré'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Précision ±10%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${
                        comparison.precision >= 80 ? 'text-green-600' : 
                        comparison.precision >= 60 ? 'text-orange-600' : 
                        'text-destructive'
                      }`}>
                        {comparison.precision.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        des prévisions dans l'intervalle
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphique de comparaison */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparison.comparisons}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periode" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `${(value / 1000).toFixed(1)}k FCFA`}
                      />
                      <Legend />
                      <Bar 
                        dataKey="prevu" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.8}
                        name="Prévu"
                      />
                      <Bar 
                        dataKey="reel" 
                        fill="hsl(var(--accent))" 
                        fillOpacity={0.8}
                        name="Réalisé"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tableau détaillé */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Période</th>
                        <th className="text-right py-3 px-4 font-medium">Prévu</th>
                        <th className="text-right py-3 px-4 font-medium">Réalisé</th>
                        <th className="text-right py-3 px-4 font-medium">Écart</th>
                        <th className="text-right py-3 px-4 font-medium">Écart %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.comparisons.map((comp, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{comp.periode}</td>
                          <td className="text-right py-3 px-4">
                            {comp.prevu.toLocaleString()} FCFA
                          </td>
                          <td className="text-right py-3 px-4">
                            {comp.reel.toLocaleString()} FCFA
                          </td>
                          <td className={`text-right py-3 px-4 font-medium ${
                            comp.ecart >= 0 ? 'text-green-600' : 'text-destructive'
                          }`}>
                            {comp.ecart > 0 ? '+' : ''}{comp.ecart.toLocaleString()} FCFA
                          </td>
                          <td className="text-right py-3 px-4">
                            <Badge variant={
                              Math.abs(comp.ecartPourcentage) <= 10 ? "default" : 
                              Math.abs(comp.ecartPourcentage) <= 20 ? "secondary" : 
                              "destructive"
                            }>
                              {comp.ecartPourcentage > 0 ? '+' : ''}{comp.ecartPourcentage.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ajustements recommandés */}
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertTitle>Ajustements Recommandés du Modèle</AlertTitle>
                  <AlertDescription>
                    <ul className="space-y-2 mt-2">
                      {comparison.bias > 10 && (
                        <li className="text-sm">
                          • Le modèle <strong>surestime systématiquement</strong> (+{comparison.bias.toFixed(1)}%). 
                          Réduire le facteur de prévision de {(comparison.bias / 100).toFixed(2)}.
                        </li>
                      )}
                      {comparison.bias < -10 && (
                        <li className="text-sm">
                          • Le modèle <strong>sous-estime systématiquement</strong> ({comparison.bias.toFixed(1)}%). 
                          Augmenter le facteur de prévision de {Math.abs(comparison.bias / 100).toFixed(2)}.
                        </li>
                      )}
                      {comparison.mape > 20 && (
                        <li className="text-sm">
                          • Erreur moyenne élevée ({comparison.mape.toFixed(1)}%). 
                          Considérer l'intégration de <strong>facteurs saisonniers</strong> ou de <strong>variables externes</strong>.
                        </li>
                      )}
                      {comparison.precision < 60 && (
                        <li className="text-sm">
                          • Précision faible ({comparison.precision.toFixed(0)}% dans l'intervalle). 
                          Augmenter la période d'analyse ou utiliser des <strong>méthodes de prévision plus sophistiquées</strong>.
                        </li>
                      )}
                      {comparison.mape <= 10 && Math.abs(comparison.bias) <= 5 && comparison.precision >= 80 && (
                        <li className="text-sm text-green-600">
                          • ✓ Le modèle affiche une <strong>excellente performance</strong>. Continuer avec les paramètres actuels.
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </>
      )}

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