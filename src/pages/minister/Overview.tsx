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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in hover:-translate-y-1" style={{ animationDelay: "0s" }}>
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

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in hover:-translate-y-1" style={{ animationDelay: "0.1s" }}>
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

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in hover:-translate-y-1" style={{ animationDelay: "0.2s" }}>
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

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in hover:-translate-y-1" style={{ animationDelay: "0.3s" }}>
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
      
      <GlobalFilters onFiltersChange={setFilters} />
    </div>
  );
}