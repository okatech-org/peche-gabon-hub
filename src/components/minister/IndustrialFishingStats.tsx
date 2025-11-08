import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', '#82ca9d', '#ffc658'];

const IndustrialFishingStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNavires: 0,
    naviresActifs: 0,
    armements: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total navires
      const { count: totalNavires } = await supabase
        .from("navires")
        .select("*", { count: "exact", head: true });

      // Navires actifs
      const { count: naviresActifs } = await supabase
        .from("navires")
        .select("*", { count: "exact", head: true })
        .eq("statut", "active");

      // Total armements
      const { count: armements } = await supabase
        .from("armements")
        .select("*", { count: "exact", head: true })
        .eq("statut", "active");

      setStats({
        totalNavires: totalNavires || 0,
        naviresActifs: naviresActifs || 0,
        armements: armements || 0,
      });
    } catch (error) {
      console.error("Erreur:", error);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Navires</CardTitle>
            <CardDescription>Flotte totale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalNavires}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navires Actifs</CardTitle>
            <CardDescription>En exploitation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.naviresActifs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Armements</CardTitle>
            <CardDescription>Entreprises actives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.armements}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité Mensuelle</CardTitle>
          <CardDescription>Données simulées - Volume capturé par la flotte industrielle</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { mois: "Jan", volume: 45 },
              { mois: "Fév", volume: 52 },
              { mois: "Mar", volume: 48 },
              { mois: "Avr", volume: 61 },
              { mois: "Mai", volume: 55 },
              { mois: "Jun", volume: 67 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis label={{ value: "Tonnes", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="volume" fill="hsl(var(--primary))" name="Captures (T)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Espèces Capturées</CardTitle>
          <CardDescription>Données simulées - Répartition par espèce (pêche industrielle)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={[
                  { name: "Thon", value: 145 },
                  { name: "Espadon", value: 89 },
                  { name: "Merlu", value: 67 },
                  { name: "Crevettes", value: 54 },
                  { name: "Autres", value: 78 },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {[0, 1, 2, 3, 4].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} T`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndustrialFishingStats;
