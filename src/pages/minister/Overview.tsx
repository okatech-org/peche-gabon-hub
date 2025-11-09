import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Activity, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ExecutiveStats from "@/components/minister/ExecutiveStats";
import GlobalFilters from "@/components/minister/GlobalFilters";
import { useOutletContext } from "react-router-dom";

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

interface ContextType {
  filters: {
    annee: string;
    mois: string;
    province: string;
    typePeche: string;
  };
  setFilters: (filters: any) => void;
}

export default function Overview() {
  const { filters, setFilters } = useOutletContext<ContextType>();
  const [loading, setLoading] = useState(true);
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

      let capturesQuery = supabase
        .from("captures_pa")
        .select("poids_kg, site_id")
        .eq("annee", currentYear);

      if (filters.mois !== "tous") {
        capturesQuery = capturesQuery.eq("mois", parseInt(filters.mois));
      }

      const { data: capturesCurrentYear } = await capturesQuery;

      const productionAnnuelle = 
        (capturesCurrentYear?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0) / 1000;

      const { data: capturesLastYear } = await supabase
        .from("captures_pa")
        .select("poids_kg")
        .eq("annee", lastYear);

      const productionLastYear = 
        (capturesLastYear?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0) / 1000;

      const productionTrend = productionLastYear > 0 
        ? `${((productionAnnuelle - productionLastYear) / productionLastYear * 100).toFixed(0)}%`
        : "";

      const exportations = productionAnnuelle * 0.62;
      const exportationsLastYear = productionLastYear * 0.62;
      const exportationsTrend = exportationsLastYear > 0
        ? `${((exportations - exportationsLastYear) / exportationsLastYear * 100).toFixed(0)}%`
        : "";

      const { data: cpueData } = await supabase
        .from("captures_pa")
        .select("cpue")
        .eq("annee", currentYear)
        .not("cpue", "is", null);

      const cpueMoyenne = cpueData && cpueData.length > 0
        ? cpueData.reduce((sum, c) => sum + (c.cpue || 0), 0) / cpueData.length
        : 0;

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

      const infractions = 45;
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
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <Card className="relative overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in hover:-translate-y-1 group border-border/50" style={{ animationDelay: "0s" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Production Annuelle
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">{kpis.productionAnnuelle.toFixed(1)}T</div>
            {kpis.productionTrend && (
              <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${kpis.productionTrend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <span>{kpis.productionTrend}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in hover:-translate-y-1 group border-border/50" style={{ animationDelay: "0.1s" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Exportations
            </CardTitle>
            <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <BarChart3 className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">{kpis.exportations.toFixed(1)}T</div>
            {kpis.exportationsTrend && (
              <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${kpis.exportationsTrend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <span>{kpis.exportationsTrend}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in hover:-translate-y-1 group border-border/50" style={{ animationDelay: "0.2s" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CPUE Moyenne
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Activity className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">{kpis.cpueMoyenne}</div>
            {kpis.cpueTrend && (
              <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${kpis.cpueTrend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <span>{kpis.cpueTrend}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in hover:-translate-y-1 group border-border/50" style={{ animationDelay: "0.3s" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Infractions
            </CardTitle>
            <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
              <AlertTriangle className="h-4 w-4 text-destructive group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">{kpis.infractions}</div>
            {kpis.infractionsTrend && (
              <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${kpis.infractionsTrend.startsWith('+') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                <span>{kpis.infractionsTrend}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ExecutiveStats />
      
      <GlobalFilters onFiltersChange={setFilters} />
    </div>
  );
}