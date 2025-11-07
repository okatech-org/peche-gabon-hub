import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, RotateCcw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface HistoriqueData {
  mois: number;
  annee: number;
  attendu: number;
  paye: number;
  tauxRecouvrement: number;
}

interface ScenarioParams {
  tauxRecouvrementBase: number;
  tendanceMensuelle: number;
  volatilite: number;
}

interface ScenarioResult {
  nom: string;
  couleur: string;
  previsions: {
    periode: string;
    montant: number;
    recouvrement: number;
    taux: number;
  }[];
  total: number;
  moyenneTaux: number;
}

export const ScenarioSimulationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [historique, setHistorique] = useState<HistoriqueData[]>([]);
  const [montantMoyenMensuel, setMontantMoyenMensuel] = useState(0);
  
  // Paramètres des scénarios
  const [optimiste, setOptimiste] = useState<ScenarioParams>({
    tauxRecouvrementBase: 90,
    tendanceMensuelle: 1,
    volatilite: 5,
  });
  
  const [realiste, setRealiste] = useState<ScenarioParams>({
    tauxRecouvrementBase: 75,
    tendanceMensuelle: 0,
    volatilite: 10,
  });
  
  const [pessimiste, setPessimiste] = useState<ScenarioParams>({
    tauxRecouvrementBase: 60,
    tendanceMensuelle: -0.5,
    volatilite: 15,
  });

  const [results, setResults] = useState<ScenarioResult[]>([]);

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - 12);

      const { data, error } = await supabase
        .from('quittances')
        .select('*')
        .gte('date_echeance', dateDebut.toISOString().split('T')[0])
        .order('annee')
        .order('mois');

      if (error) throw error;

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

      const historiqueArray = Object.values(groupedData).map((item) => ({
        ...item,
        tauxRecouvrement: item.attendu > 0 ? (item.paye / item.attendu) * 100 : 0,
      }));

      setHistorique(historiqueArray);
      
      // Calculer le montant moyen mensuel
      const moyenneAttendu = historiqueArray.reduce((sum, item) => sum + item.attendu, 0) / historiqueArray.length;
      setMontantMoyenMensuel(moyenneAttendu);
      
    } catch (error: any) {
      console.error('Error loading historique:', error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const getMoisLabel = (mois: number) => {
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return labels[mois - 1];
  };

  const simulateScenario = (params: ScenarioParams, nom: string, couleur: string): ScenarioResult => {
    const now = new Date();
    const previsions = [];
    let totalRecouvrement = 0;
    let sommeTaux = 0;

    for (let i = 0; i < 6; i++) {
      const moisIndex = (now.getMonth() + i + 1) % 12;
      const annee = now.getFullYear() + Math.floor((now.getMonth() + i + 1) / 12);
      
      // Calculer le taux de recouvrement avec tendance et volatilité
      let tauxBase = params.tauxRecouvrementBase + (params.tendanceMensuelle * i);
      
      // Ajouter une variation aléatoire basée sur la volatilité
      const variation = (Math.random() - 0.5) * params.volatilite * 2;
      let taux = Math.max(0, Math.min(100, tauxBase + variation));
      
      const montant = montantMoyenMensuel;
      const recouvrement = (montant * taux) / 100;
      
      totalRecouvrement += recouvrement;
      sommeTaux += taux;
      
      previsions.push({
        periode: `${getMoisLabel(moisIndex + 1)} ${annee}`,
        montant: montant / 1000,
        recouvrement: recouvrement / 1000,
        taux: Math.round(taux * 10) / 10,
      });
    }

    return {
      nom,
      couleur,
      previsions,
      total: totalRecouvrement,
      moyenneTaux: sommeTaux / 6,
    };
  };

  const runSimulation = () => {
    if (montantMoyenMensuel === 0) {
      toast.error("Données insuffisantes pour la simulation");
      return;
    }

    const scenarios = [
      simulateScenario(optimiste, "Optimiste", "#22c55e"),
      simulateScenario(realiste, "Réaliste", "#3b82f6"),
      simulateScenario(pessimiste, "Pessimiste", "#ef4444"),
    ];

    setResults(scenarios);
    toast.success("Simulation exécutée avec succès");
  };

  const resetToDefaults = () => {
    setOptimiste({
      tauxRecouvrementBase: 90,
      tendanceMensuelle: 1,
      volatilite: 5,
    });
    setRealiste({
      tauxRecouvrementBase: 75,
      tendanceMensuelle: 0,
      volatilite: 10,
    });
    setPessimiste({
      tauxRecouvrementBase: 60,
      tendanceMensuelle: -0.5,
      volatilite: 15,
    });
    setResults([]);
  };

  // Préparer les données combinées pour le graphique
  const combinedChartData = results.length > 0
    ? results[0].previsions.map((_, idx) => {
        const dataPoint: any = {
          periode: results[0].previsions[idx].periode,
        };
        results.forEach(scenario => {
          dataPoint[`${scenario.nom}_recouvrement`] = scenario.previsions[idx].recouvrement;
          dataPoint[`${scenario.nom}_taux`] = scenario.previsions[idx].taux;
        });
        return dataPoint;
      })
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Simulation de Scénarios Financiers</h2>
          <p className="text-muted-foreground">
            Modélisez différents scénarios pour anticiper les variations de recouvrement
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button onClick={runSimulation} className="gap-2">
            <Play className="h-4 w-4" />
            Lancer la Simulation
          </Button>
        </div>
      </div>

      {/* Paramètres des scénarios */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Scénario Optimiste */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
              Scénario Optimiste
            </CardTitle>
            <CardDescription>Conditions favorables avec amélioration continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Taux de Recouvrement Initial: {optimiste.tauxRecouvrementBase}%</Label>
              <Slider
                value={[optimiste.tauxRecouvrementBase]}
                onValueChange={([value]) => setOptimiste({ ...optimiste, tauxRecouvrementBase: value })}
                min={50}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Tendance Mensuelle: {optimiste.tendanceMensuelle > 0 ? '+' : ''}{optimiste.tendanceMensuelle}%</Label>
              <Slider
                value={[optimiste.tendanceMensuelle]}
                onValueChange={([value]) => setOptimiste({ ...optimiste, tendanceMensuelle: value })}
                min={-2}
                max={2}
                step={0.1}
              />
            </div>
            <div className="space-y-2">
              <Label>Volatilité: ±{optimiste.volatilite}%</Label>
              <Slider
                value={[optimiste.volatilite]}
                onValueChange={([value]) => setOptimiste({ ...optimiste, volatilite: value })}
                min={0}
                max={20}
                step={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scénario Réaliste */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Minus className="h-5 w-5" />
              Scénario Réaliste
            </CardTitle>
            <CardDescription>Maintien des conditions actuelles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Taux de Recouvrement Initial: {realiste.tauxRecouvrementBase}%</Label>
              <Slider
                value={[realiste.tauxRecouvrementBase]}
                onValueChange={([value]) => setRealiste({ ...realiste, tauxRecouvrementBase: value })}
                min={50}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Tendance Mensuelle: {realiste.tendanceMensuelle > 0 ? '+' : ''}{realiste.tendanceMensuelle}%</Label>
              <Slider
                value={[realiste.tendanceMensuelle]}
                onValueChange={([value]) => setRealiste({ ...realiste, tendanceMensuelle: value })}
                min={-2}
                max={2}
                step={0.1}
              />
            </div>
            <div className="space-y-2">
              <Label>Volatilité: ±{realiste.volatilite}%</Label>
              <Slider
                value={[realiste.volatilite]}
                onValueChange={([value]) => setRealiste({ ...realiste, volatilite: value })}
                min={0}
                max={20}
                step={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scénario Pessimiste */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="h-5 w-5" />
              Scénario Pessimiste
            </CardTitle>
            <CardDescription>Conditions défavorables avec dégradation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Taux de Recouvrement Initial: {pessimiste.tauxRecouvrementBase}%</Label>
              <Slider
                value={[pessimiste.tauxRecouvrementBase]}
                onValueChange={([value]) => setPessimiste({ ...pessimiste, tauxRecouvrementBase: value })}
                min={50}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Tendance Mensuelle: {pessimiste.tendanceMensuelle > 0 ? '+' : ''}{pessimiste.tendanceMensuelle}%</Label>
              <Slider
                value={[pessimiste.tendanceMensuelle]}
                onValueChange={([value]) => setPessimiste({ ...pessimiste, tendanceMensuelle: value })}
                min={-2}
                max={2}
                step={0.1}
              />
            </div>
            <div className="space-y-2">
              <Label>Volatilité: ±{pessimiste.volatilite}%</Label>
              <Slider
                value={[pessimiste.volatilite]}
                onValueChange={([value]) => setPessimiste({ ...pessimiste, volatilite: value })}
                min={0}
                max={20}
                step={1}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résultats de la simulation */}
      {results.length > 0 && (
        <>
          {/* Comparaison des totaux */}
          <div className="grid gap-4 md:grid-cols-3">
            {results.map((scenario) => (
              <Card key={scenario.nom}>
                <CardHeader>
                  <CardTitle style={{ color: scenario.couleur }}>{scenario.nom}</CardTitle>
                  <CardDescription>Total sur 6 mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold" style={{ color: scenario.couleur }}>
                      {scenario.total.toLocaleString()} FCFA
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taux moyen:</span>
                      <Badge variant={scenario.moyenneTaux >= 80 ? "default" : scenario.moyenneTaux >= 60 ? "secondary" : "destructive"}>
                        {scenario.moyenneTaux.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attendu total:</span>
                      <span className="font-medium">{(montantMoyenMensuel * 6).toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Écart:</span>
                      <span className={`font-medium ${
                        scenario.total >= (montantMoyenMensuel * 6 * 0.8) ? 'text-green-600' : 'text-destructive'
                      }`}>
                        {((scenario.total - montantMoyenMensuel * 6) / (montantMoyenMensuel * 6) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Graphique de comparaison des recouvrements */}
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des Recouvrements par Scénario</CardTitle>
              <CardDescription>Évolution mensuelle des montants recouvrés (en milliers FCFA)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={combinedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periode" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${(value * 1000).toLocaleString()} FCFA`} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Optimiste_recouvrement"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                    name="Optimiste"
                  />
                  <Area
                    type="monotone"
                    dataKey="Réaliste_recouvrement"
                    stackId="2"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Réaliste"
                  />
                  <Area
                    type="monotone"
                    dataKey="Pessimiste_recouvrement"
                    stackId="3"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    name="Pessimiste"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Graphique de comparaison des taux */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Taux de Recouvrement</CardTitle>
              <CardDescription>Comparaison des taux prévus par scénario</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={combinedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periode" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Optimiste_taux"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Optimiste"
                  />
                  <Line
                    type="monotone"
                    dataKey="Réaliste_taux"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Réaliste"
                  />
                  <Line
                    type="monotone"
                    dataKey="Pessimiste_taux"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Pessimiste"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tableau comparatif détaillé */}
          <Card>
            <CardHeader>
              <CardTitle>Comparaison Détaillée Mois par Mois</CardTitle>
              <CardDescription>Prévisions de recouvrement pour chaque scénario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Période</th>
                      {results.map(scenario => (
                        <th key={scenario.nom} className="text-right py-3 px-4 font-medium" style={{ color: scenario.couleur }}>
                          {scenario.nom}
                        </th>
                      ))}
                      <th className="text-right py-3 px-4 font-medium">Écart Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedChartData.map((row, idx) => {
                      const values = results.map(s => s.previsions[idx].recouvrement * 1000);
                      const ecartMax = Math.max(...values) - Math.min(...values);
                      
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.periode}</td>
                          {results.map(scenario => (
                            <td key={scenario.nom} className="text-right py-3 px-4">
                              <span style={{ color: scenario.couleur }} className="font-medium">
                                {(scenario.previsions[idx].recouvrement * 1000).toLocaleString()} FCFA
                              </span>
                              <br />
                              <span className="text-xs text-muted-foreground">
                                ({scenario.previsions[idx].taux.toFixed(1)}%)
                              </span>
                            </td>
                          ))}
                          <td className="text-right py-3 px-4">
                            <Badge variant="outline">
                              {ecartMax.toLocaleString()} FCFA
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
