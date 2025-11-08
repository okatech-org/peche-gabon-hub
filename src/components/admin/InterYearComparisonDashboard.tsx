import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, TrendingDown, Calendar, Download, BarChart3, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface AnnualData {
  annee: number;
  recettes: number;
  recettesPayees: number;
  taxes: number;
  taxesPayees: number;
  nbQuittances: number;
  nbTaxes: number;
  tauxRecouvrement: number;
}

interface MonthlyComparison {
  mois: string;
  [key: string]: any; // Données dynamiques par année
}

const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#10b981', // emerald
];

export const InterYearComparisonDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [annualData, setAnnualData] = useState<AnnualData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyComparison[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedYears.length > 0) {
      loadComparisonData();
    }
  }, [selectedYears]);

  const loadAvailableYears = async () => {
    try {
      // Charger les années disponibles depuis les quittances
      const { data, error } = await supabase
        .from('quittances')
        .select('annee')
        .order('annee', { ascending: false });

      if (error) throw error;

      const years = [...new Set(data?.map(q => q.annee) || [])];
      setAvailableYears(years);

      // Sélectionner par défaut les 3 dernières années
      const defaultYears = years.slice(0, Math.min(3, years.length));
      setSelectedYears(defaultYears);

    } catch (error: any) {
      console.error('Error loading years:', error);
      toast.error("Erreur lors du chargement des années disponibles");
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonData = async () => {
    if (selectedYears.length === 0) return;

    setLoading(true);
    try {
      // Charger les données annuelles pour chaque année
      const annualPromises = selectedYears.map(async (year) => {
        const [quittancesRes, taxesRes] = await Promise.all([
          supabase
            .from('quittances')
            .select('*')
            .eq('annee', year),
          supabase
            .from('taxes_calculees')
            .select('*')
            .gte('created_at', `${year}-01-01`)
            .lt('created_at', `${year + 1}-01-01`)
        ]);

        const quittances = quittancesRes.data || [];
        const taxes = taxesRes.data || [];

        const recettes = quittances.reduce((sum, q) => sum + (q.montant || 0), 0);
        const recettesPayees = quittances
          .filter(q => q.statut === 'paye')
          .reduce((sum, q) => sum + (q.montant || 0), 0);

        const taxesTotal = taxes.reduce((sum, t) => sum + parseFloat(t.montant_taxe.toString()), 0);
        const taxesPayees = taxes
          .filter(t => t.statut_paiement === 'paye')
          .reduce((sum, t) => sum + parseFloat(t.montant_taxe.toString()), 0);

        return {
          annee: year,
          recettes,
          recettesPayees,
          taxes: taxesTotal,
          taxesPayees,
          nbQuittances: quittances.length,
          nbTaxes: taxes.length,
          tauxRecouvrement: recettes > 0 ? (recettesPayees / recettes) * 100 : 0,
        };
      });

      const annualResults = await Promise.all(annualPromises);
      setAnnualData(annualResults.sort((a, b) => a.annee - b.annee));

      // Charger les données mensuelles pour comparaison
      const monthlyPromises = Array.from({ length: 12 }, async (_, idx) => {
        const mois = idx + 1;
        const monthData: MonthlyComparison = {
          mois: getMoisLabel(mois),
        };

        for (const year of selectedYears) {
          const { data } = await supabase
            .from('quittances')
            .select('*')
            .eq('annee', year)
            .eq('mois', mois);

          const quittances = data || [];
          const recettes = quittances.reduce((sum, q) => sum + (q.montant || 0), 0);
          const payees = quittances
            .filter(q => q.statut === 'paye')
            .reduce((sum, q) => sum + (q.montant || 0), 0);

          monthData[`${year}_recettes`] = recettes / 1000;
          monthData[`${year}_payees`] = payees / 1000;
          monthData[`${year}_taux`] = recettes > 0 ? Math.round((payees / recettes) * 100) : 0;
        }

        return monthData;
      });

      const monthlyResults = await Promise.all(monthlyPromises);
      setMonthlyData(monthlyResults);

    } catch (error: any) {
      console.error('Error loading comparison data:', error);
      toast.error("Erreur lors du chargement des données de comparaison");
    } finally {
      setLoading(false);
    }
  };

  const getMoisLabel = (mois: number) => {
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return labels[mois - 1];
  };

  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const toggleYear = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year].sort((a, b) => a - b)
    );
  };

  const handleExportToExcel = () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Feuille 1: Données annuelles
      const annualSheet = XLSX.utils.json_to_sheet(annualData.map(d => ({
        'Année': d.annee,
        'Recettes Attendues': d.recettes.toLocaleString(),
        'Recettes Payées': d.recettesPayees.toLocaleString(),
        'Taxes Calculées': d.taxes.toLocaleString(),
        'Taxes Payées': d.taxesPayees.toLocaleString(),
        'Nb Quittances': d.nbQuittances,
        'Taux Recouvrement': `${d.tauxRecouvrement.toFixed(1)}%`,
      })));
      XLSX.utils.book_append_sheet(wb, annualSheet, 'Données Annuelles');

      // Feuille 2: Données mensuelles
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(wb, monthlySheet, 'Données Mensuelles');

      // Feuille 3: Taux de croissance
      const growthData = annualData.slice(1).map((data, idx) => {
        const prevData = annualData[idx];
        return {
          'Période': `${prevData.annee} → ${data.annee}`,
          'Croissance Recettes': `${calculateGrowthRate(data.recettes, prevData.recettes).toFixed(1)}%`,
          'Croissance Taxes': `${calculateGrowthRate(data.taxes, prevData.taxes).toFixed(1)}%`,
          'Variation Taux': `${(data.tauxRecouvrement - prevData.tauxRecouvrement).toFixed(1)}%`,
        };
      });
      const growthSheet = XLSX.utils.json_to_sheet(growthData);
      XLSX.utils.book_append_sheet(wb, growthSheet, 'Taux de Croissance');

      const fileName = `comparaison_inter-annees_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Export Excel généré avec succès');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  if (loading && selectedYears.length === 0) {
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
          <h2 className="text-3xl font-bold tracking-tight">Comparaison Inter-Années</h2>
          <p className="text-muted-foreground">
            Analyse des tendances historiques sur plusieurs exercices fiscaux
          </p>
        </div>
        <Button
          onClick={handleExportToExcel}
          disabled={exporting || annualData.length === 0}
          variant="outline"
          className="gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exporter Excel
            </>
          )}
        </Button>
      </div>

      {/* Sélection des années */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sélection des Années à Comparer
          </CardTitle>
          <CardDescription>
            Choisissez jusqu'à 5 années pour analyser les tendances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {availableYears.map((year, idx) => (
              <label
                key={year}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedYears.includes(year)
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                } ${selectedYears.length >= 5 && !selectedYears.includes(year) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Checkbox
                  checked={selectedYears.includes(year)}
                  onCheckedChange={() => toggleYear(year)}
                  disabled={selectedYears.length >= 5 && !selectedYears.includes(year)}
                />
                <span className="font-semibold">{year}</span>
                {selectedYears.includes(year) && (
                  <Badge variant="secondary" style={{ backgroundColor: COLORS[selectedYears.indexOf(year)] }}>
                    {selectedYears.indexOf(year) + 1}
                  </Badge>
                )}
              </label>
            ))}
          </div>
          {selectedYears.length >= 5 && (
            <p className="text-sm text-muted-foreground mt-3">
              Maximum 5 années sélectionnées. Décochez une année pour en ajouter une autre.
            </p>
          )}
        </CardContent>
      </Card>

      {/* KPIs de comparaison */}
      {annualData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recettes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {annualData.reduce((sum, d) => sum + d.recettes, 0).toLocaleString()} FCFA
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sur {selectedYears.length} année(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Croissance Moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              {annualData.length > 1 ? (
                <>
                  <div className={`text-2xl font-bold flex items-center gap-2 ${
                    calculateGrowthRate(
                      annualData[annualData.length - 1].recettes,
                      annualData[0].recettes
                    ) >= 0 ? 'text-green-600' : 'text-destructive'
                  }`}>
                    {calculateGrowthRate(
                      annualData[annualData.length - 1].recettes,
                      annualData[0].recettes
                    ) >= 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    {Math.abs(calculateGrowthRate(
                      annualData[annualData.length - 1].recettes,
                      annualData[0].recettes
                    )).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {annualData[0].annee} → {annualData[annualData.length - 1].annee}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">N/A</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Meilleure Année</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const best = annualData.reduce((max, d) =>
                  d.recettesPayees > max.recettesPayees ? d : max
                , annualData[0]);
                return (
                  <>
                    <div className="text-2xl font-bold text-green-600">{best.annee}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {best.recettesPayees.toLocaleString()} FCFA payés
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taux Moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(annualData.reduce((sum, d) => sum + d.tauxRecouvrement, 0) / annualData.length).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recouvrement moyen
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglets de comparaison */}
      {annualData.length > 0 && (
        <Tabs defaultValue="recettes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recettes">Recettes</TabsTrigger>
            <TabsTrigger value="taxes">Taxes</TabsTrigger>
            <TabsTrigger value="mensuel">Mensuel</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Comparaison des Recettes */}
          <TabsContent value="recettes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Recettes par Année</CardTitle>
                <CardDescription>Comparaison des montants attendus et payés</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={annualData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="annee" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                    <Legend />
                    <Bar dataKey="recettes" fill="#3b82f6" name="Attendu" />
                    <Bar dataKey="recettesPayees" fill="#22c55e" name="Payé" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de Croissance Annuel</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">Recettes Attendues</TableHead>
                      <TableHead className="text-right">Recettes Payées</TableHead>
                      <TableHead className="text-right">Croissance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {annualData.map((data, idx) => {
                      if (idx === 0) {
                        return (
                          <TableRow key={data.annee}>
                            <TableCell className="font-medium">{data.annee}</TableCell>
                            <TableCell className="text-right">{data.recettes.toLocaleString()} FCFA</TableCell>
                            <TableCell className="text-right">{data.recettesPayees.toLocaleString()} FCFA</TableCell>
                            <TableCell className="text-right">—</TableCell>
                          </TableRow>
                        );
                      }
                      const prevData = annualData[idx - 1];
                      const growth = calculateGrowthRate(data.recettes, prevData.recettes);
                      return (
                        <TableRow key={data.annee}>
                          <TableCell className="font-medium">{data.annee}</TableCell>
                          <TableCell className="text-right">{data.recettes.toLocaleString()} FCFA</TableCell>
                          <TableCell className="text-right">{data.recettesPayees.toLocaleString()} FCFA</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={growth >= 0 ? "default" : "destructive"}>
                              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparaison des Taxes */}
          <TabsContent value="taxes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Taxes par Année</CardTitle>
                <CardDescription>Comparaison des taxes calculées et payées</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={annualData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="annee" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                    <Legend />
                    <Bar dataKey="taxes" fill="#f59e0b" name="Taxes Calculées" />
                    <Line
                      type="monotone"
                      dataKey="taxesPayees"
                      stroke="#22c55e"
                      strokeWidth={3}
                      name="Taxes Payées"
                      dot={{ fill: '#22c55e', r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Nombre de Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={annualData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="annee" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="nbQuittances" fill="#8b5cf6" name="Quittances" />
                      <Bar dataKey="nbTaxes" fill="#06b6d4" name="Taxes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Détail par Année</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Année</TableHead>
                        <TableHead className="text-right">Taxes</TableHead>
                        <TableHead className="text-right">Payées</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {annualData.map(data => (
                        <TableRow key={data.annee}>
                          <TableCell className="font-medium">{data.annee}</TableCell>
                          <TableCell className="text-right">{data.taxes.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {data.taxesPayees.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comparaison Mensuelle */}
          <TabsContent value="mensuel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparaison Mensuelle Multi-Années</CardTitle>
                <CardDescription>Recettes mensuelles comparées sur plusieurs années</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${(value * 1000).toLocaleString()} FCFA`} />
                    <Legend />
                    {selectedYears.map((year, idx) => (
                      <Line
                        key={year}
                        type="monotone"
                        dataKey={`${year}_payees`}
                        stroke={COLORS[idx]}
                        strokeWidth={2}
                        name={`${year}`}
                        dot={{ fill: COLORS[idx], r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de Recouvrement Mensuel</CardTitle>
                <CardDescription>Pourcentage de recouvrement par mois et par année</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Legend />
                    {selectedYears.map((year, idx) => (
                      <Line
                        key={year}
                        type="monotone"
                        dataKey={`${year}_taux`}
                        stroke={COLORS[idx]}
                        strokeWidth={2}
                        name={`${year}`}
                        dot={{ fill: COLORS[idx], r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Globale */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Taux de Recouvrement par Année</CardTitle>
                <CardDescription>Évolution de la performance de recouvrement</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={annualData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="annee" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Area
                      type="monotone"
                      dataKey="tauxRecouvrement"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.3}
                      name="Taux de Recouvrement"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analyse de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Année</TableHead>
                      <TableHead className="text-right">Taux</TableHead>
                      <TableHead className="text-right">Variation</TableHead>
                      <TableHead>Évaluation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {annualData.map((data, idx) => {
                      const variation = idx > 0
                        ? data.tauxRecouvrement - annualData[idx - 1].tauxRecouvrement
                        : 0;
                      const performance = data.tauxRecouvrement >= 80 ? 'Excellent' :
                                        data.tauxRecouvrement >= 60 ? 'Bon' :
                                        data.tauxRecouvrement >= 40 ? 'Moyen' : 'Faible';
                      return (
                        <TableRow key={data.annee}>
                          <TableCell className="font-medium">{data.annee}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={
                              data.tauxRecouvrement >= 80 ? 'default' :
                              data.tauxRecouvrement >= 60 ? 'secondary' :
                              'destructive'
                            }>
                              {data.tauxRecouvrement.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {idx > 0 ? (
                              <span className={variation >= 0 ? 'text-green-600' : 'text-destructive'}>
                                {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell>{performance}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {annualData.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Sélectionnez au moins une année pour voir les comparaisons
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
