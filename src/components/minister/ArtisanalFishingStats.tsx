import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const ArtisanalFishingStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    capturesPA: 0,
    cpueMoyenne: 0,
    tauxRenouvellementLicences: 0,
    tauxPaiementTaxes: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Captures PA totales
      const { data: capturesData } = await supabase
        .from("captures_pa")
        .select("poids_kg")
        .eq("annee", currentYear);

      const capturesPA = (capturesData?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0) / 1000;

      // CPUE moyenne
      const { data: cpueData } = await supabase
        .from("captures_pa")
        .select("cpue")
        .eq("annee", currentYear)
        .not("cpue", "is", null);

      const cpueMoyenne = cpueData && cpueData.length > 0
        ? cpueData.reduce((sum, c) => sum + (c.cpue || 0), 0) / cpueData.length
        : 0;

      // Taux de renouvellement des licences
      const { count: totalPirogues } = await supabase
        .from("pirogues")
        .select("*", { count: "exact", head: true })
        .eq("statut", "active");

      const { count: licencesValides } = await supabase
        .from("licences")
        .select("*", { count: "exact", head: true })
        .eq("statut", "valide")
        .eq("annee", currentYear);

      const tauxRenouvellementLicences = totalPirogues && licencesValides
        ? (licencesValides / totalPirogues) * 100
        : 0;

      // Taux de paiement des taxes (quittances payées)
      const { count: totalQuittances } = await supabase
        .from("quittances")
        .select("*", { count: "exact", head: true })
        .eq("annee", currentYear);

      const { count: quittancesPayees } = await supabase
        .from("quittances")
        .select("*", { count: "exact", head: true })
        .eq("annee", currentYear)
        .eq("statut", "paye");

      const tauxPaiementTaxes = totalQuittances && quittancesPayees
        ? (quittancesPayees / totalQuittances) * 100
        : 0;

      // Données pour le graphique (12 derniers mois)
      const monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const mois = date.getMonth() + 1;
        const annee = date.getFullYear();

        const { data: capturesMois } = await supabase
          .from("captures_pa")
          .select("poids_kg, cpue")
          .eq("mois", mois)
          .eq("annee", annee);

        const totalMois = (capturesMois?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0) / 1000;
        const cpueMois = capturesMois && capturesMois.length > 0
          ? capturesMois.reduce((sum, c) => sum + (c.cpue || 0), 0) / capturesMois.length
          : 0;

        monthlyData.push({
          mois: date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
          captures: Number(totalMois.toFixed(1)),
          cpue: Number(cpueMois.toFixed(1)),
        });
      }

      setChartData(monthlyData);
      setStats({
        capturesPA,
        cpueMoyenne: Number(cpueMoyenne.toFixed(1)),
        tauxRenouvellementLicences: Number(tauxRenouvellementLicences.toFixed(1)),
        tauxPaiementTaxes: Number(tauxPaiementTaxes.toFixed(1)),
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Captures PA</CardTitle>
            <CardDescription>Année en cours (tonnes)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.capturesPA.toFixed(1)}T</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CPUE Moyenne</CardTitle>
            <CardDescription>Rendement mensuel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.cpueMoyenne}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Renouvellement</CardTitle>
            <CardDescription>Licences à jour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.tauxRenouvellementLicences}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paiement Taxes</CardTitle>
            <CardDescription>Conformité fiscale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.tauxPaiementTaxes}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution des Captures PA</CardTitle>
          <CardDescription>12 derniers mois</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis yAxisId="left" label={{ value: "Tonnes", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: "CPUE", angle: 90, position: "insideRight" }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="captures" stroke="hsl(var(--primary))" strokeWidth={2} name="Captures (T)" />
              <Line yAxisId="right" type="monotone" dataKey="cpue" stroke="hsl(var(--accent))" strokeWidth={2} name="CPUE" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArtisanalFishingStats;
