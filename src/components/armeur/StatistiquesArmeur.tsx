import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ship, Anchor, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface Stats {
  totalNavires: number;
  totalMarees: number;
  capturesTotales: number;
  cpueMoyenne: number;
}

interface CapturesMensuelles {
  mois: string;
  captures: number;
}

export function StatistiquesArmeur() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalNavires: 0,
    totalMarees: 0,
    capturesTotales: 0,
    cpueMoyenne: 0,
  });
  const [capturesMensuelles, setCapturesMensuelles] = useState<CapturesMensuelles[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Charger l'armement
      const { data: armementData } = await supabase
        .from("armements")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!armementData) {
        setLoading(false);
        return;
      }

      // Charger les navires
      const { data: naviresData } = await supabase
        .from("navires")
        .select("id")
        .eq("armement_id", armementData.id);

      const navireIds = (naviresData || []).map(n => n.id);

      if (navireIds.length === 0) {
        setLoading(false);
        return;
      }

      // Charger les marées
      const { data: mareesData } = await supabase
        .from("marees_industrielles")
        .select("*")
        .in("navire_id", navireIds);

      const marees = mareesData || [];
      const capturesTotales = marees.reduce((sum, m) => sum + (m.capture_totale_kg || 0), 0);
      const cpueMoyenne = marees.length > 0
        ? marees.reduce((sum, m) => sum + (m.cpue_moyenne || 0), 0) / marees.length
        : 0;

      setStats({
        totalNavires: naviresData?.length || 0,
        totalMarees: marees.length,
        capturesTotales,
        cpueMoyenne,
      });

      // Calculer les captures mensuelles des 12 derniers mois
      const now = new Date();
      const monthsData: CapturesMensuelles[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        
        const monthCaptures = marees
          .filter(m => {
            const mareDate = new Date(m.date_depart);
            return mareDate.getMonth() === date.getMonth() && 
                   mareDate.getFullYear() === date.getFullYear();
          })
          .reduce((sum, m) => sum + (m.capture_totale_kg || 0), 0);

        monthsData.push({
          mois: monthName,
          captures: Math.round(monthCaptures / 1000), // En tonnes
        });
      }

      setCapturesMensuelles(monthsData);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Navires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNavires}</div>
            <p className="text-xs text-muted-foreground">Flotte active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Marées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMarees}</div>
            <p className="text-xs text-muted-foreground">Campagnes enregistrées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Anchor className="h-4 w-4" />
              Captures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.capturesTotales / 1000).toFixed(1)} t
            </div>
            <p className="text-xs text-muted-foreground">Tonnes capturées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              CPUE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.cpueMoyenne.toFixed(1)} kg/j
            </div>
            <p className="text-xs text-muted-foreground">Moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des captures mensuelles */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Captures</CardTitle>
          <CardDescription>Captures mensuelles des 12 derniers mois (en tonnes)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={capturesMensuelles}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="captures" name="Captures (t)" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
