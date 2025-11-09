import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function StatistiquesCooperative() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    nombreMembres: 0,
    totalTaxes: 0,
    totalPaye: 0,
    nombrePaiements: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cooperativeData } = await supabase
        .from("cooperatives")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!cooperativeData) {
        setLoading(false);
        return;
      }

      // Compter les membres
      const { data: membresData } = await supabase
        .from("pecheurs_cooperatives")
        .select("pecheur_user_id", { count: 'exact' })
        .eq("cooperative_id", cooperativeData.id)
        .eq("statut", "actif");

      // Compter les paiements
      const { data: paiementsData } = await supabase
        .from("paiements_groupes_taxes")
        .select("montant_total")
        .eq("cooperative_id", cooperativeData.id);

      const totalPaye = (paiementsData || []).reduce((sum, p) => sum + p.montant_total, 0);

      setStats({
        nombreMembres: membresData?.length || 0,
        totalTaxes: 0,
        totalPaye,
        nombrePaiements: paiementsData?.length || 0,
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Membres Actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.nombreMembres}</div>
          <p className="text-xs text-muted-foreground">Pêcheurs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Total Payé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.totalPaye.toLocaleString()} FCFA</div>
          <p className="text-xs text-muted-foreground">Taxes réglées</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.nombrePaiements}</div>
          <p className="text-xs text-muted-foreground">Groupés effectués</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Moyenne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.nombrePaiements > 0 ? (stats.totalPaye / stats.nombrePaiements).toFixed(0) : 0} FCFA
          </div>
          <p className="text-xs text-muted-foreground">Par paiement</p>
        </CardContent>
      </Card>
    </div>
  );
}
