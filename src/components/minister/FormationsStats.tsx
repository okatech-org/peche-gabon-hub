import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Users, DollarSign, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  formationsActives: number;
  formationsEnAttente: number;
  formateursDisponibles: number;
  formateursTotal: number;
  budgetUtilise: number;
  budgetTotal: number;
  participantsInscrits: number;
}

export function FormationsStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousStats, setPreviousStats] = useState<StatsData | null>(null);

  const loadStats = async () => {
    try {
      // Formations actives et en attente
      const { data: formations, error: formationsError } = await supabase
        .from("formations_planifiees")
        .select("statut, budget_prevu, budget_reel, nb_participants_inscrits");

      if (formationsError) throw formationsError;

      const formationsActives = formations?.filter(f => 
        f.statut === "en_cours" || f.statut === "planifiee"
      ).length || 0;

      const formationsEnAttente = formations?.filter(f => 
        f.statut === "planifiee"
      ).length || 0;

      // Budget
      const budgetPrevu = formations?.reduce((sum, f) => sum + (f.budget_prevu || 0), 0) || 0;
      const budgetUtilise = formations?.reduce((sum, f) => sum + (f.budget_reel || 0), 0) || 0;

      // Participants inscrits
      const participantsInscrits = formations?.reduce((sum, f) => sum + (f.nb_participants_inscrits || 0), 0) || 0;

      // Formateurs disponibles
      const { data: formateurs, error: formateursError } = await supabase
        .from("formateurs")
        .select("statut");

      if (formateursError) throw formateursError;

      const formateursDisponibles = formateurs?.filter(f => f.statut === "actif").length || 0;
      const formateursTotal = formateurs?.length || 0;

      const newStats: StatsData = {
        formationsActives,
        formationsEnAttente,
        formateursDisponibles,
        formateursTotal,
        budgetUtilise,
        budgetTotal: budgetPrevu,
        participantsInscrits
      };

      setPreviousStats(stats);
      setStats(newStats);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadStats, 30000);

    // Realtime subscriptions
    const formationsChannel = supabase
      .channel('formations-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'formations_planifiees'
        },
        () => loadStats()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'formateurs'
        },
        () => loadStats()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(formationsChannel);
    };
  }, []);

  const getTrend = (current: number, previous: number | undefined) => {
    if (!previous || previous === current) return null;
    return current > previous ? "up" : "down";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Formations Actives",
      value: stats.formationsActives,
      subtitle: `${stats.formationsEnAttente} en attente`,
      icon: GraduationCap,
      trend: getTrend(stats.formationsActives, previousStats?.formationsActives),
      color: "text-primary"
    },
    {
      title: "Formateurs Disponibles",
      value: stats.formateursDisponibles,
      subtitle: `sur ${stats.formateursTotal} total`,
      icon: Users,
      trend: getTrend(stats.formateursDisponibles, previousStats?.formateursDisponibles),
      color: "text-blue-600"
    },
    {
      title: "Budget Utilisé",
      value: `${(stats.budgetUtilise / 1000000).toFixed(1)}M`,
      subtitle: `sur ${(stats.budgetTotal / 1000000).toFixed(1)}M FCFA`,
      icon: DollarSign,
      trend: getTrend(stats.budgetUtilise, previousStats?.budgetUtilise),
      color: "text-green-600"
    },
    {
      title: "Participants Inscrits",
      value: stats.participantsInscrits,
      subtitle: "tous programmes",
      icon: Calendar,
      trend: getTrend(stats.participantsInscrits, previousStats?.participantsInscrits),
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </h3>
                  {stat.trend && (
                    <div className={`flex items-center gap-1 ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.subtitle}
                </p>
              </div>
              <div className={`rounded-full p-3 bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
