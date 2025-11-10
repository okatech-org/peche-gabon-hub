import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Receipt, DollarSign, BarChart3, Bell, Activity, TrendingUp, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MembresCooperative } from "@/components/cooperative/MembresCooperative";
import { TaxesCooperative } from "@/components/cooperative/TaxesCooperative";
import { PaiementTaxesGroupees } from "@/components/cooperative/PaiementTaxesGroupees";
import { StatistiquesCooperative } from "@/components/cooperative/StatistiquesCooperative";
import { NotificationsHistorique } from "@/components/cooperative/NotificationsHistorique";
import { CooperativeSidebar } from "@/components/cooperative/CooperativeSidebar";
import { ActiviteRecente } from "@/components/cooperative/ActiviteRecente";
import { MesRemonteesContent } from "@/components/remontees/MesRemonteesContent";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { DemoBadge } from "@/components/DemoBadge";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useCooperativeStats } from "@/hooks/useCooperativeStats";
import { Loader2 } from "lucide-react";

export default function CooperativeDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedTab, setDisplayedTab] = useState("dashboard");
  const { loading, stats, recentActivities, refresh } = useCooperativeStats();

  useEffect(() => {
    if (activeTab !== displayedTab) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedTab(activeTab);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, displayedTab]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refresh();
  };

  // Contenu du dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Membres Actifs */}
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Membres Actifs
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-3xl font-bold">{loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.membresActifs}</div>
            <p className="text-xs text-muted-foreground">Pêcheurs enregistrés</p>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              Actif
            </Badge>
          </CardContent>
        </Card>

        {/* Taxes en Cours */}
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Taxes en Cours
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Receipt className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-3xl font-bold">{loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.taxesEnCours}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
              En attente
            </Badge>
          </CardContent>
        </Card>

        {/* Montant Total */}
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Montant Total
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Banknote className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `${(stats.montantTotal / 1000000).toFixed(1)}M FCFA`}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              +12%
            </Badge>
          </CardContent>
        </Card>

        {/* Paiements Groupés */}
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Paiements Groupés
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <DollarSign className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-3xl font-bold">{loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.paiementsGroupes}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
              Récents
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Activité Récente */}
      <div className="mt-6">
        <ActiviteRecente activities={recentActivities} loading={loading} />
      </div>
    </div>
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <DemoBadge />
      <div className="min-h-screen flex w-full bg-background">
        <CooperativeSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger className="-ml-2" />
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-2">
                <LanguageSelector />
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 md:p-6 animate-fade-in">
              <div className="space-y-8">
                {/* Hero Header */}
                <div className="flex items-center justify-between">
                  <div className={`transition-all duration-300 ${
                    isTransitioning ? "opacity-50" : "opacity-100"
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                        {displayedTab === "dashboard" && "Gestion de Coopérative"}
                        {displayedTab === "taxes" && "Taxes des Membres"}
                        {displayedTab === "paiements" && "Paiements Groupés"}
                        {displayedTab === "remontees" && "Mes Remontées"}
                        {displayedTab === "notifications" && "Notifications"}
                        {displayedTab === "membres" && "Gestion des Membres"}
                        {displayedTab === "stats" && "Statistiques"}
                      </h1>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Coopérative
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base">
                      {displayedTab === "dashboard" && "Vue d'ensemble de votre coopérative"}
                      {displayedTab === "taxes" && "Gérez les taxes des membres de votre coopérative"}
                      {displayedTab === "paiements" && "Effectuez des paiements groupés pour vos membres"}
                      {displayedTab === "remontees" && "Soumettez vos réclamations, suggestions et dénonciations"}
                      {displayedTab === "notifications" && "Historique des notifications envoyées"}
                      {displayedTab === "membres" && "Gérez les membres de votre coopérative"}
                      {displayedTab === "stats" && "Visualisez les statistiques de votre coopérative"}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                    <span className="hidden sm:inline">Actualiser</span>
                  </Button>
                </div>

                {/* Tab Content */}
                <div 
                  className={`transition-all duration-300 ${
                    isTransitioning 
                      ? "opacity-0 translate-x-4" 
                      : "opacity-100 translate-x-0"
                  }`}
                >
                  {displayedTab === "dashboard" && renderDashboard()}
                  {displayedTab === "taxes" && <TaxesCooperative key={`taxes-${refreshKey}`} />}
                  {displayedTab === "paiements" && <PaiementTaxesGroupees key={`paiements-${refreshKey}`} />}
                  {displayedTab === "remontees" && <MesRemonteesContent key={`remontees-${refreshKey}`} />}
                  {displayedTab === "notifications" && <NotificationsHistorique key={`notifications-${refreshKey}`} />}
                  {displayedTab === "membres" && <MembresCooperative key={`membres-${refreshKey}`} />}
                  {displayedTab === "stats" && <StatistiquesCooperative key={`stats-${refreshKey}`} />}
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-muted/30 py-3 px-4">
            <div className="text-center text-xs text-muted-foreground">
              © 2025 PÊCHE GABON - Gestion Coopérative
            </div>
          </footer>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
