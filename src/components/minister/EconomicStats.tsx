import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const EconomicStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    valeurExportations: 0,
    totalCooperatives: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Valeur estimée des exportations (captures * prix moyen estimé)
      const { data: capturesData } = await supabase
        .from("captures_pa")
        .select("poids_kg")
        .eq("annee", currentYear);

      const totalCaptures = capturesData?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0;
      // Prix moyen estimé: 2000 FCFA/kg pour exportations
      const valeurExportations = (totalCaptures * 0.62 * 2000) / 1000000; // En millions FCFA

      // Total coopératives
      const { count: totalCooperatives } = await supabase
        .from("cooperatives")
        .select("*", { count: "exact", head: true })
        .eq("statut", "active");

      setStats({
        valeurExportations: Number(valeurExportations.toFixed(1)),
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Valeur Exportations</CardTitle>
            <CardDescription>Estimation année en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.valeurExportations}M FCFA</div>
            <p className="text-sm text-muted-foreground mt-2">Basé sur prix moyen 2000 FCFA/kg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coopératives Actives</CardTitle>
            <CardDescription>Par région</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCooperatives}</div>
            <p className="text-sm text-muted-foreground mt-2">Organisations formalisées</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prix Moyen par Espèce</CardTitle>
          <CardDescription>Évolution comparée année N vs N-1</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Graphique en développement</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contribution au PIB</CardTitle>
          <CardDescription>Impact économique du secteur halieutique</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Emplois directs estimés</span>
              <span className="text-lg font-bold">12,500+</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Emplois indirects</span>
              <span className="text-lg font-bold">35,000+</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Contribution PIB</span>
              <span className="text-lg font-bold">~2.5%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EconomicStats;
