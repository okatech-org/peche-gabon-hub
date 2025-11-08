import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ExecutiveStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPirogues: 0,
    totalLicences: 0,
    tauxConformite: 0,
    totalCooperatives: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total pirogues actives
      const { count: totalPirogues } = await supabase
        .from("pirogues")
        .select("*", { count: "exact", head: true })
        .eq("statut", "active");

      // Total licences valides
      const { count: totalLicences } = await supabase
        .from("licences")
        .select("*", { count: "exact", head: true })
        .eq("statut", "valide");

      // Taux de conformité (licences valides / pirogues)
      const tauxConformite = totalPirogues && totalLicences
        ? (totalLicences / totalPirogues) * 100
        : 0;

      // Total coopératives
      const { count: totalCooperatives } = await supabase
        .from("cooperatives")
        .select("*", { count: "exact", head: true })
        .eq("statut", "active");

      setStats({
        totalPirogues: totalPirogues || 0,
        totalLicences: totalLicences || 0,
        tauxConformite: Number(tauxConformite.toFixed(1)),
        totalCooperatives: totalCooperatives || 0,
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pirogues Actives</CardTitle>
          <CardDescription>Total du parc artisanal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalPirogues}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Licences Valides</CardTitle>
          <CardDescription>Conformité réglementaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalLicences}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taux de Conformité</CardTitle>
          <CardDescription>Pirogues en règle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.tauxConformite}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coopératives</CardTitle>
          <CardDescription>Organisations actives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalCooperatives}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveStats;
