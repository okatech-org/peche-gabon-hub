import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Activity, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ExecutiveStats from "@/components/minister/ExecutiveStats";
import GlobalFilters from "@/components/minister/GlobalFilters";
import { DailyBriefingCard } from "@/components/minister/DailyBriefingCard";
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
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
            Bienvenue au Dashboard
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Vue d'ensemble des ressources et performances en temps réel
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => loadExecutiveData()}
          className="gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
        >
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
      </div>

      {/* Daily Briefing */}
      <DailyBriefingCard />

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Production Card */}
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 hover:-translate-y-1 transition-all duration-300 animate-fade-in group" style={{ animationDelay: "0s" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Utilisation CPU
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-3xl font-bold">{kpis.productionAnnuelle.toFixed(1)}T</div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '45%' }} />
            </div>
            {kpis.productionTrend && (
              <Badge variant="secondary" className={`${kpis.productionTrend.startsWith('+') ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                Normal
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Exportations Card */}
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 hover:-translate-y-1 transition-all duration-300 animate-fade-in group" style={{ animationDelay: "0.1s" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-colors" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Mémoire RAM
            </CardTitle>
            <div className="p-2 rounded-lg bg-accent/10">
              <BarChart3 className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-3xl font-bold">{kpis.exportations.toFixed(1)}T</div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: '62%' }} />
            </div>
            {kpis.exportationsTrend && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                Normal
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* CPUE Card */}
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 hover:-translate-y-1 transition-all duration-300 animate-fade-in group" style={{ animationDelay: "0.2s" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Espace Disque
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Activity className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-3xl font-bold">{kpis.cpueMoyenne}</div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: '44%' }} />
            </div>
            {kpis.cpueTrend && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                Normal
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Infractions Card */}
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 hover:-translate-y-1 transition-all duration-300 animate-fade-in group" style={{ animationDelay: "0.3s" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              System Uptime
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <AlertTriangle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-2xl font-bold">7j 14h 32m</div>
            <p className="text-xs text-muted-foreground">Système stable et opérationnel</p>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              Actif
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/40 bg-gradient-to-br from-card to-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Requêtes Totales</CardTitle>
            <p className="text-xs text-muted-foreground">Dernières 24 heures</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">17 127</div>
            <p className="text-xs text-muted-foreground">~713 requêtes/heure</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Erreurs Détectées</CardTitle>
            <p className="text-xs text-muted-foreground">Taux d'erreur système</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">39</div>
            <p className="text-xs text-muted-foreground">0.228% du total</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latence Moyenne</CardTitle>
            <p className="text-xs text-muted-foreground">Temps de réponse</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">119ms</div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              Rapide
            </Badge>
          </CardContent>
        </Card>
      </div>

      <ExecutiveStats />
      
      <GlobalFilters onFiltersChange={setFilters} />
    </div>
  );
}