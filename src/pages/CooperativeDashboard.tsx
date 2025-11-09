import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Receipt, DollarSign, BarChart3, Bell, Activity, TrendingUp, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MembresCooperative } from "@/components/cooperative/MembresCooperative";
import { TaxesCooperative } from "@/components/cooperative/TaxesCooperative";
import { PaiementsCooperative } from "@/components/cooperative/PaiementsCooperative";
import { StatistiquesCooperative } from "@/components/cooperative/StatistiquesCooperative";
import { NotificationsHistorique } from "@/components/cooperative/NotificationsHistorique";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useState } from "react";

export default function CooperativeDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats simulées - à remplacer par de vraies données
  const stats = {
    membresActifs: 127,
    taxesEnCours: 34,
    montantTotal: 45600000,
    paiementsGroupes: 8
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Hero Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                Gestion de Coopérative
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Coopérative
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm md:text-base">
              Gérez les membres, taxes et paiements collectifs de votre coopérative
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>

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
              <div className="text-3xl font-bold">{stats.membresActifs}</div>
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
              <div className="text-3xl font-bold">{stats.taxesEnCours}</div>
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
              <div className="text-2xl font-bold">{(stats.montantTotal / 1000000).toFixed(1)}M FCFA</div>
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
              <div className="text-3xl font-bold">{stats.paiementsGroupes}</div>
              <p className="text-xs text-muted-foreground">Ce mois</p>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                Récents
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Card className="border-border/40 bg-gradient-to-br from-card via-card to-card/95">
          <CardContent className="p-0">
            <Tabs defaultValue="taxes" className="w-full">
              <div className="border-b px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-2 bg-transparent">
                  <TabsTrigger 
                    value="taxes" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <Receipt className="h-4 w-4" />
                    <span className="hidden sm:inline">Taxes</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="paiements" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Paiements</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Notifications</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="membres" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Membres</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stats" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Stats</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="taxes" className="p-6 animate-fade-in">
                <TaxesCooperative key={`taxes-${refreshKey}`} />
              </TabsContent>

              <TabsContent value="paiements" className="p-6 animate-fade-in">
                <PaiementsCooperative key={`paiements-${refreshKey}`} />
              </TabsContent>

              <TabsContent value="notifications" className="p-6 animate-fade-in">
                <NotificationsHistorique key={`notifications-${refreshKey}`} />
              </TabsContent>

              <TabsContent value="membres" className="p-6 animate-fade-in">
                <MembresCooperative key={`membres-${refreshKey}`} />
              </TabsContent>

              <TabsContent value="stats" className="p-6 animate-fade-in">
                <StatistiquesCooperative key={`stats-${refreshKey}`} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
