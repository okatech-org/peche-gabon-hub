import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Fish, 
  LogOut,
  TrendingUp,
  BarChart3,
  Activity,
  AlertTriangle,
  FileText,
  Bell,
  MapPin,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PublishRegulationDialog from "@/components/minister/PublishRegulationDialog";
import SendNotificationDialog from "@/components/minister/SendNotificationDialog";
import LockZoneDialog from "@/components/minister/LockZoneDialog";
import ExecutiveStats from "@/components/minister/ExecutiveStats";
import ArtisanalFishingStats from "@/components/minister/ArtisanalFishingStats";
import IndustrialFishingStats from "@/components/minister/IndustrialFishingStats";
import SurveillanceStats from "@/components/minister/SurveillanceStats";
import EconomicStats from "@/components/minister/EconomicStats";
import MinisterHistory from "@/components/minister/MinisterHistory";
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
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fish className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">PÊCHE GABON</h1>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-accent">
              Ministre
            </Badge>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8" id="main-content">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Tableau de Bord Exécutif</h2>
            <p className="text-muted-foreground">Vue d'ensemble stratégique du secteur halieutique</p>
          </div>
          <ExportPDFButton filters={filters} />
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Actions Rapides */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PublishRegulationDialog />
            <SendNotificationDialog />
            <LockZoneDialog />
          </CardContent>
        </Card>

        {/* Global Filters */}
        <GlobalFilters onFiltersChange={setFilters} />

        {/* Alerts Panel */}
        <div className="mb-8">
          <AlertsPanel />
        </div>

        {/* Detailed Stats Tabs */}
        <Tabs defaultValue="executive" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="executive">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="artisanal">Pêche Artisanale</TabsTrigger>
            <TabsTrigger value="industrial">Pêche Industrielle</TabsTrigger>
            <TabsTrigger value="surveillance">Surveillance</TabsTrigger>
            <TabsTrigger value="economic">Économie</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="executive">
            <ExecutiveStats />
          </TabsContent>

          <TabsContent value="artisanal">
            <ArtisanalFishingStats />
          </TabsContent>

          <TabsContent value="industrial">
            <IndustrialFishingStats />
          </TabsContent>

          <TabsContent value="surveillance">
            <SurveillanceStats />
          </TabsContent>

          <TabsContent value="economic">
            <EconomicStats />
          </TabsContent>

          <TabsContent value="history">
            <MinisterHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MinisterDashboard;
