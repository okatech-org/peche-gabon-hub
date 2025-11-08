import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp,
  BarChart3,
  Activity,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MinisterSidebar } from "@/components/minister/MinisterSidebar";
import PublishRegulationDialog from "@/components/minister/PublishRegulationDialog";
import SendNotificationDialog from "@/components/minister/SendNotificationDialog";
import LockZoneDialog from "@/components/minister/LockZoneDialog";
import ExecutiveStats from "@/components/minister/ExecutiveStats";
import ArtisanalFishingStats from "@/components/minister/ArtisanalFishingStats";
import IndustrialFishingStats from "@/components/minister/IndustrialFishingStats";
import SurveillanceStats from "@/components/minister/SurveillanceStats";
import EconomicStats from "@/components/minister/EconomicStats";
import MinisterHistory from "@/components/minister/MinisterHistory";
import AlertesRapportsPanel from "@/components/minister/AlertesRapportsPanel";
import { SeuilsAlertesManagement } from "@/components/minister/SeuilsAlertesManagement";
import { AnalysePredictiveActions } from "@/components/minister/AnalysePredictiveActions";
import { RecommandationsFormation } from "@/components/minister/RecommandationsFormation";
import { SuiviFormations } from "@/components/minister/SuiviFormations";
import { BudgetFormations } from "@/components/minister/BudgetFormations";
import { ComparaisonRegionaleFormations } from "@/components/minister/ComparaisonRegionaleFormations";
import { GestionFormateurs } from "@/components/minister/GestionFormateurs";
import { RecommandationFormateurs } from "@/components/minister/RecommandationFormateurs";
import { HistoriqueRecommandations } from "@/components/minister/HistoriqueRecommandations";
import { SimpleCalendrierFormations } from "@/components/minister/SimpleCalendrierFormations";
import { GanttFormateurs } from "@/components/minister/GanttFormateurs";
import { AnalyticsFormations } from "@/components/minister/AnalyticsFormations";
import { PredictionsFormations } from "@/components/minister/PredictionsFormations";
import { ValidationFormations } from "@/components/minister/ValidationFormations";
import GlobalFilters from "@/components/minister/GlobalFilters";
import AlertsPanel from "@/components/minister/AlertsPanel";
import ExportPDFButton from "@/components/minister/ExportPDFButton";

interface ExecutiveKPIs {
  productionAnnuelle: number;
  productionTrend: string;
  exportations: number;
  exportationsTrend: string;
  cpueMoyenne: number;
  cpueTrend: string;
  infractions: number;
  infractionsTrend: string;
}

const MinisterDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear().toString(),
    mois: "tous",
    province: "tous",
    typePeche: "tous",
  });
  const [kpis, setKpis] = useState<ExecutiveKPIs>({
    productionAnnuelle: 0,
    productionTrend: "",
    exportations: 0,
    exportationsTrend: "",
    cpueMoyenne: 0,
    cpueTrend: "",
    infractions: 0,
    infractionsTrend: "",
  });

  useEffect(() => {
    loadExecutiveData();
  }, [filters]);

  const loadExecutiveData = async () => {
    try {
      const currentYear = parseInt(filters.annee);
      const lastYear = currentYear - 1;

      // Build query with filters
      let capturesQuery = supabase
        .from("captures_pa")
        .select("poids_kg, site_id")
        .eq("annee", currentYear);

      if (filters.mois !== "tous") {
        capturesQuery = capturesQuery.eq("mois", parseInt(filters.mois));
      }

      // Production totale année en cours
      const { data: capturesCurrentYear } = await capturesQuery;

      const productionAnnuelle = 
        (capturesCurrentYear?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0) / 1000; // Convert to tonnes

      // Production année précédente pour la tendance
      const { data: capturesLastYear } = await supabase
        .from("captures_pa")
        .select("poids_kg")
        .eq("annee", lastYear);

      const productionLastYear = 
        (capturesLastYear?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0) / 1000;

      const productionTrend = productionLastYear > 0 
        ? `${((productionAnnuelle - productionLastYear) / productionLastYear * 100).toFixed(0)}%`
        : "";

      // Exportations (estimation basée sur 62% de la production)
      const exportations = productionAnnuelle * 0.62;
      const exportationsLastYear = productionLastYear * 0.62;
      const exportationsTrend = exportationsLastYear > 0
        ? `${((exportations - exportationsLastYear) / exportationsLastYear * 100).toFixed(0)}%`
        : "";

      // CPUE moyenne
      const { data: cpueData } = await supabase
        .from("captures_pa")
        .select("cpue")
        .eq("annee", currentYear)
        .not("cpue", "is", null);

      const cpueMoyenne = cpueData && cpueData.length > 0
        ? cpueData.reduce((sum, c) => sum + (c.cpue || 0), 0) / cpueData.length
        : 0;

      // CPUE année précédente
      const { data: cpueLastYearData } = await supabase
        .from("captures_pa")
        .select("cpue")
        .eq("annee", lastYear)
        .not("cpue", "is", null);

      const cpueLastYear = cpueLastYearData && cpueLastYearData.length > 0
        ? cpueLastYearData.reduce((sum, c) => sum + (c.cpue || 0), 0) / cpueLastYearData.length
        : 0;

      const cpueTrend = cpueLastYear > 0
        ? `${((cpueMoyenne - cpueLastYear) / cpueLastYear * 100).toFixed(0)}%`
        : "";

      // Infractions (estimation)
      const infractions = 45; // Valeur d'exemple
      const infractionsTrend = "-8%";

      setKpis({
        productionAnnuelle,
        productionTrend: productionTrend.startsWith('-') ? productionTrend : `+${productionTrend}`,
        exportations,
        exportationsTrend: exportationsTrend.startsWith('-') ? exportationsTrend : `+${exportationsTrend}`,
        cpueMoyenne: Number(cpueMoyenne.toFixed(1)),
        cpueTrend: cpueTrend.startsWith('-') ? cpueTrend : `+${cpueTrend}`,
        infractions,
        infractionsTrend,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données exécutives:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full flex bg-gradient-subtle">
        <MinisterSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
            <div className="flex items-center gap-4 px-6 py-3">
              <SidebarTrigger className="hover:bg-muted" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">Tableau de Bord Exécutif</h1>
                <p className="text-sm text-muted-foreground truncate">
                  Vue stratégique du secteur halieutique
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-accent hidden sm:flex">
                  Ministre
                </Badge>
                <ExportPDFButton filters={filters} />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto" id="main-content">
            <div className="container mx-auto px-6 py-6 space-y-6">
              {/* Section Overview */}
              <div id="overview">

                {/* KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <Card className="shadow-card hover:shadow-elevated transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Production Annuelle
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.productionAnnuelle.toFixed(1)}T</div>
                      {kpis.productionTrend && (
                        <p className={`text-xs ${kpis.productionTrend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {kpis.productionTrend}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-card hover:shadow-elevated transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Exportations
                      </CardTitle>
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.exportations.toFixed(1)}T</div>
                      {kpis.exportationsTrend && (
                        <p className={`text-xs ${kpis.exportationsTrend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {kpis.exportationsTrend}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-card hover:shadow-elevated transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        CPUE Moyenne
                      </CardTitle>
                      <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.cpueMoyenne}</div>
                      {kpis.cpueTrend && (
                        <p className={`text-xs ${kpis.cpueTrend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {kpis.cpueTrend}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-card hover:shadow-elevated transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Infractions
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.infractions}</div>
                      {kpis.infractionsTrend && (
                        <p className={`text-xs ${kpis.infractionsTrend.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}>
                          {kpis.infractionsTrend}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <ExecutiveStats />
              </div>

              {/* Global Filters */}
              <GlobalFilters onFiltersChange={setFilters} />

              {/* Section Alerts */}
              <div id="alerts">
                <AlertsPanel />
              </div>

              {/* Section Artisanal */}
              <div id="artisanal">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Pêche Artisanale</h2>
                  <p className="text-sm text-muted-foreground">Captures, CPUE, licences et conformité</p>
                </div>
                <ArtisanalFishingStats />
              </div>

              {/* Section Industrial */}
              <div id="industrial">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Pêche Industrielle</h2>
                  <p className="text-sm text-muted-foreground">Navires, armements et activité</p>
                </div>
                <IndustrialFishingStats />
              </div>

              {/* Section Surveillance */}
              <div id="surveillance">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Surveillance & Contrôle</h2>
                  <p className="text-sm text-muted-foreground">Carte interactive, zones restreintes et infractions</p>
                </div>
                <SurveillanceStats />
              </div>

              {/* Section Economic */}
              <div id="economic">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Économie de la Pêche</h2>
                  <p className="text-sm text-muted-foreground">Exportations, valeur et prix</p>
                </div>
                <EconomicStats />
              </div>

              {/* Section Powers */}
              <div id="powers">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Pouvoirs Ministériels</h2>
                  <p className="text-sm text-muted-foreground">Actions réglementaires et notifications</p>
                </div>
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Actions Disponibles</CardTitle>
                    <CardDescription>Exercez vos prérogatives ministérielles</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PublishRegulationDialog />
                    <SendNotificationDialog />
                    <LockZoneDialog />
                  </CardContent>
                </Card>
              </div>

              {/* Section History */}
              <div id="history">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Historique & Archives</h2>
                  <p className="text-sm text-muted-foreground">Réglementations, notifications et audit</p>
                </div>
                <div className="grid gap-6 mb-6">
                  <AlertesRapportsPanel />
                  <SeuilsAlertesManagement />
                  <AnalysePredictiveActions />
                  <RecommandationsFormation />
                  <SimpleCalendrierFormations />
                  <SuiviFormations />
                  <BudgetFormations />
                  <ComparaisonRegionaleFormations />
                  <GestionFormateurs />
                  <RecommandationFormateurs />
                  <HistoriqueRecommandations />
                  <PredictionsFormations />
                  <ValidationFormations />
                  <AnalyticsFormations />
                  <GanttFormateurs />
                </div>
                <MinisterHistory />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MinisterDashboard;
