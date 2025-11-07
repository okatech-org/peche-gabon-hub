import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Fish, TrendingUp, Scale, Activity } from "lucide-react";

export const StatsCaptures = () => {
  const [stats, setStats] = useState({
    total_captures: 0,
    poids_total: 0,
    cpue_moyen: 0,
    nb_pirogues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('captures_pa')
        .select('poids_kg, cpue, pirogue_id');

      if (error) throw error;

      const uniquePirogues = new Set(data.map(c => c.pirogue_id));
      const cpueValues = data.filter(c => c.cpue !== null).map(c => Number(c.cpue));
      const avgCpue = cpueValues.length > 0 
        ? cpueValues.reduce((a, b) => a + b, 0) / cpueValues.length 
        : 0;

      setStats({
        total_captures: data.length,
        poids_total: data.reduce((sum, c) => sum + Number(c.poids_kg), 0),
        cpue_moyen: avgCpue,
        nb_pirogues: uniquePirogues.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Captures</CardTitle>
          <Fish className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_captures}</div>
          <p className="text-xs text-muted-foreground">
            Déclarations enregistrées
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Poids Total</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.poids_total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg
          </div>
          <p className="text-xs text-muted-foreground">
            Captures cumulées
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPUE Moyen</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.cpue_moyen.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            kg / heure d'effort
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pirogues Actives</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.nb_pirogues}</div>
          <p className="text-xs text-muted-foreground">
            Avec déclarations
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
