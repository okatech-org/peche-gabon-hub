import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Receipt, TrendingUp, FileSpreadsheet, Layers, Activity, Bell, Download } from "lucide-react";
import { ExcelExportButton } from "./ExcelExportButton";
import { useCSVData } from "@/hooks/useCSVData";
import { FinancialOverviewDashboard } from "./FinancialOverviewDashboard";
import { FinancesDashboard } from "./FinancesDashboard";
import { TaxesRemonteesDashboard } from "./TaxesRemonteesDashboard";
import { PrevisionsDashboard } from "./PrevisionsDashboard";
import { ScenarioSimulationDashboard } from "./ScenarioSimulationDashboard";
import { FinancialExportDashboard } from "./FinancialExportDashboard";
import { InterYearComparisonDashboard } from "./InterYearComparisonDashboard";
import { SmartAlertsManagement } from "./SmartAlertsManagement";

export function FinancialCompleteDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Load all CSV data for export
  const { data: indicateurs } = useCSVData('/data/analytics/indicateurs_cles.csv');
  const { data: quittances } = useCSVData('/data/analytics/finances_quittances_mensuel.csv');
  const { data: exportations } = useCSVData('/data/analytics/exportation_resume_numerique.csv');
  const { data: previsions } = useCSVData('/data/analytics/previsions_scenarios_synthese.csv');
  const { data: demandes } = useCSVData('/data/analytics/demandes_resume_numerique.csv');

  // Prepare KPIs data
  const kpis = indicateurs.map((row: any) => ({
    label: String(row.kpi || '').replace(/_/g, ' ').replace(/total/g, '').trim(),
    value: Number(row.valeur) || 0,
  }));

  // Prepare monthly data
  const monthlyData = quittances.map((row: any) => ({
    mois: String(row.Mois || ''),
    valeur: Number(row.Valeur) || 0,
  }));

  // Prepare previsions data
  const previsionsData = previsions.map((row: any) => ({
    feuille: String(row.feuille || ''),
    somme: Number(row.somme_numeriques) || 0,
  }));

  const exportData = {
    kpis,
    monthlyData,
    previsionsData,
    rawData: {
      quittances,
      exportations,
      demandes,
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard Finances PÊCHE GABON</h1>
          <p className="text-muted-foreground mt-2">
            Suivi complet des finances, taxes, prévisions et exportations
          </p>
        </div>
        <ExcelExportButton 
          data={exportData}
          filename={`dashboard_finances_${new Date().toISOString().split('T')[0]}.xlsx`}
          variant="default"
        />
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 h-auto">
          <TabsTrigger value="overview" className="flex flex-col gap-1 py-3">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="quittances" className="flex flex-col gap-1 py-3">
            <Receipt className="h-5 w-5" />
            <span className="text-xs">Quittances</span>
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex flex-col gap-1 py-3">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs">Taxes & Remontées</span>
          </TabsTrigger>
          <TabsTrigger value="previsions" className="flex flex-col gap-1 py-3">
            <FileSpreadsheet className="h-5 w-5" />
            <span className="text-xs">Prévisions</span>
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex flex-col gap-1 py-3">
            <Layers className="h-5 w-5" />
            <span className="text-xs">Scénarios</span>
          </TabsTrigger>
          <TabsTrigger value="exportations" className="flex flex-col gap-1 py-3">
            <Download className="h-5 w-5" />
            <span className="text-xs">Exportations</span>
          </TabsTrigger>
          <TabsTrigger value="comparaison" className="flex flex-col gap-1 py-3">
            <Activity className="h-5 w-5" />
            <span className="text-xs">Inter-Années</span>
          </TabsTrigger>
          <TabsTrigger value="alertes" className="flex flex-col gap-1 py-3">
            <Bell className="h-5 w-5" />
            <span className="text-xs">Alertes IA</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* 1. Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Vue d'Ensemble Financière
                </CardTitle>
                <CardDescription>
                  KPIs clés, recettes mensuelles, et comparatifs exportations/valeurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinancialOverviewDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Quittances */}
          <TabsContent value="quittances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Gestion des Quittances
                </CardTitle>
                <CardDescription>
                  Tableau interactif des quittances mensuelles avec évolution et taux de recouvrement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinancesDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Taxes & Remontées */}
          <TabsContent value="taxes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Taxes et Remontées Institutionnelles
                </CardTitle>
                <CardDescription>
                  Autorisations, taxes calculées, et répartition par institution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TaxesRemonteesDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Prévisions */}
          <TabsContent value="previsions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Prévisions Financières
                </CardTitle>
                <CardDescription>
                  Analyse prédictive, tendances et estimations pour les périodes futures (2024, 2025, 2026)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrevisionsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Scénarios */}
          <TabsContent value="scenarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Simulation de Scénarios
                </CardTitle>
                <CardDescription>
                  Comparaison de scénarios optimiste, réaliste et pessimiste pour anticiper les variations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScenarioSimulationDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. Exportations & Demande */}
          <TabsContent value="exportations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportations et Demande
                </CardTitle>
                <CardDescription>
                  Analyse des exportations, demandes et valeurs avec comparaisons par famille de produits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinancialExportDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 7. Comparaison Inter-Années */}
          <TabsContent value="comparaison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Comparaison Inter-Années
                </CardTitle>
                <CardDescription>
                  Analyse des tendances historiques sur plusieurs exercices fiscaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InterYearComparisonDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 8. Alertes Intelligentes */}
          <TabsContent value="alertes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alertes Intelligentes avec IA
                </CardTitle>
                <CardDescription>
                  Détection automatique d'anomalies et recommandations intelligentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SmartAlertsManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
