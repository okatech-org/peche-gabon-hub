import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Fish, FileText, Shield, TrendingUp, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { GABON_PROVINCES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface KPIData {
  totalUsers: number;
  activeUsers: number;
  totalCaptures: number;
  capturesWeight: number;
  totalPirogues: number;
  totalCooperatives: number;
  totalNavires: number;
}

export const AdminDashboard = () => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [provinceFilter, setProvinceFilter] = useState<string>("all");

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      // Charger les KPIs en parallèle
      const [usersResult, capturesResult, piroguesResult, coopResult, naviresResult] = await Promise.all([
        // Total utilisateurs
        supabase.from('profiles').select('id, created_at', { count: 'exact', head: true }),
        // Total captures
        supabase.from('captures_pa').select('poids_kg', { count: 'exact' }),
        // Total pirogues
        supabase.from('pirogues').select('id', { count: 'exact', head: true }),
        // Total coopératives
        supabase.from('cooperatives').select('id', { count: 'exact', head: true }),
        // Total navires industriels
        supabase.from('navires').select('id', { count: 'exact', head: true }),
      ]);

      // Calculer les utilisateurs actifs (créés dans les 30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeUsersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Calculer le poids total des captures
      const totalWeight = capturesResult.data?.reduce((sum, capture) => 
        sum + (Number(capture.poids_kg) || 0), 0) || 0;

      setKpiData({
        totalUsers: usersResult.count || 0,
        activeUsers: activeUsersCount || 0,
        totalCaptures: capturesResult.count || 0,
        capturesWeight: totalWeight,
        totalPirogues: piroguesResult.count || 0,
        totalCooperatives: coopResult.count || 0,
        totalNavires: naviresResult.count || 0,
      });
    } catch (error: any) {
      console.error('Error loading KPIs:', error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  const formatWeight = (kg: number): string => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}T`;
    }
    return `${kg.toFixed(0)}kg`;
  };

  const kpis = kpiData ? [
    {
      icon: Users,
      label: "Utilisateurs Actifs",
      value: kpiData.activeUsers.toLocaleString('fr-FR'),
      subtitle: `${kpiData.totalUsers} total`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Fish,
      label: "Captures Totales",
      value: formatWeight(kpiData.capturesWeight),
      subtitle: `${kpiData.totalCaptures.toLocaleString('fr-FR')} déclarations`,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: FileText,
      label: "Flotte Artisanale",
      value: kpiData.totalPirogues.toLocaleString('fr-FR'),
      subtitle: "Pirogues enregistrées",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Shield,
      label: "Flotte Industrielle",
      value: kpiData.totalNavires.toLocaleString('fr-FR'),
      subtitle: "Navires actifs",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Shield,
      label: "Coopératives",
      value: kpiData.totalCooperatives.toLocaleString('fr-FR'),
      subtitle: "Organisations",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Tableau de Bord Administrateur</h2>
          <p className="text-muted-foreground">Vue d'ensemble des statistiques système</p>
        </div>
        <div className="w-64">
          <Select value={provinceFilter} onValueChange={setProvinceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les provinces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les provinces</SelectItem>
              {GABON_PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          kpis.map((kpi, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Évolution des Captures
            </CardTitle>
            <CardDescription>
              Suivi de l'activité de pêche sur les 30 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Graphique en cours de développement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Activité Récente
            </CardTitle>
            <CardDescription>
              Dernières actions dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Logs d'audit en cours de développement
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
