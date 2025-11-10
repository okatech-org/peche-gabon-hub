import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, Activity, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ArmeurStats {
  totalNavires: number;
  totalMarees: number;
  capturesMois: number;
  cpueMoyen: number;
}

export default function ArmeurOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ArmeurStats>({
    totalNavires: 0,
    totalMarees: 0,
    capturesMois: 0,
    cpueMoyen: 0,
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Récupérer l'armement de l'utilisateur
      const { data: armement } = await supabase
        .from("armements")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!armement) {
        setLoading(false);
        return;
      }

      // Compter les navires
      const { count: naviresCount } = await supabase
        .from("navires")
        .select("*", { count: "exact", head: true })
        .eq("armement_id", armement.id);

      // Récupérer les navires pour compter les marées
      const { data: navires } = await supabase
        .from("navires_industriels")
        .select("id")
        .eq("armement_id", armement.id);

      const naviresIds = navires?.map(n => n.id) || [];

      // Compter les marées
      let mareesCount = 0;
      if (naviresIds.length > 0) {
        const { count } = await supabase
          .from("marees_industrielles")
          .select("*", { count: "exact", head: true })
          .in("navire_id", naviresIds);
        mareesCount = count || 0;
      }

      // Calculer les captures du mois en cours
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      let capturesMois = 0;
      if (naviresIds.length > 0) {
        const { data: mareesMois } = await supabase
          .from("marees_industrielles")
          .select("capture_totale_kg")
          .in("navire_id", naviresIds)
          .gte("date_depart", firstDayOfMonth.toISOString());

        capturesMois = mareesMois?.reduce(
          (sum, maree) => sum + (maree.capture_totale_kg || 0),
          0
        ) || 0;
      }

      // Calculer le CPUE moyen
      let cpueMoyen = 0;
      if (naviresIds.length > 0) {
        const { data: mareesWithEffort } = await supabase
          .from("marees_industrielles")
          .select("capture_totale_kg, jours_peche")
          .in("navire_id", naviresIds)
          .not("jours_peche", "is", null)
          .gt("jours_peche", 0);

        if (mareesWithEffort && mareesWithEffort.length > 0) {
          const totalCPUE = mareesWithEffort.reduce(
            (sum, maree) => sum + (maree.capture_totale_kg || 0) / (maree.jours_peche || 1),
            0
          );
          cpueMoyen = totalCPUE / mareesWithEffort.length;
        }
      }

      setStats({
        totalNavires: naviresCount || 0,
        totalMarees: mareesCount,
        capturesMois: Math.round(capturesMois),
        cpueMoyen: Math.round(cpueMoyen),
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de Bord Armateur</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre activité de pêche industrielle
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Navires</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNavires}</div>
            <p className="text-xs text-muted-foreground">
              Navires enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marées Totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMarees}</div>
            <p className="text-xs text-muted-foreground">
              Sorties déclarées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Captures (mois)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.capturesMois.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              kg ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPUE Moyen</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cpueMoyen.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              kg/jour de pêche
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue sur votre espace armateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Depuis cet espace, vous pouvez gérer votre flotte, déclarer vos marées de pêche,
            consulter vos statistiques et suivre vos obligations fiscales.
          </p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2">
              <Ship className="h-4 w-4 mt-0.5 text-primary" />
              <span>Gérez les informations de vos navires</span>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="h-4 w-4 mt-0.5 text-primary" />
              <span>Déclarez vos marées et captures</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
              <span>Suivez vos performances de pêche</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
