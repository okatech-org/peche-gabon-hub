import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CooperativeStats {
  membresActifs: number;
  taxesEnCours: number;
  montantTotal: number;
  paiementsGroupes: number;
}

export interface CooperativeActivity {
  id: string;
  type: "paiement" | "inscription" | "taxe" | "validation";
  member: string;
  description: string;
  timestamp: Date;
  status: "success" | "pending" | "error";
  amount?: number;
}

export function useCooperativeStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CooperativeStats>({
    membresActifs: 0,
    taxesEnCours: 0,
    montantTotal: 0,
    paiementsGroupes: 0,
  });
  const [recentActivities, setRecentActivities] = useState<CooperativeActivity[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Récupérer l'ID de la coopérative
      const { data: cooperativeData, error: coopError } = await supabase
        .from("cooperatives")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (coopError || !cooperativeData) {
        setLoading(false);
        return;
      }

      // Charger les membres actifs
      const { data: membresData } = await supabase
        .from("pecheurs_cooperatives")
        .select("pecheur_user_id, date_adhesion")
        .eq("cooperative_id", cooperativeData.id)
        .eq("statut", "actif");

      const membreIds = (membresData || []).map(m => m.pecheur_user_id);

      // Charger les captures des membres pour obtenir les taxes
      let taxesData: any[] = [];
      let taxesEnCours = 0;
      let montantTotal = 0;

      if (membreIds.length > 0) {
        const { data: capturesData } = await supabase
          .from("captures_pa")
          .select("id")
          .in("declare_par", membreIds);

        const captureIds = (capturesData || []).map(c => c.id);

        if (captureIds.length > 0) {
          const { data: taxes } = await supabase
            .from("taxes_captures")
            .select("id, montant_taxe, statut_paiement, created_at")
            .in("capture_pa_id", captureIds);

          taxesData = taxes || [];
          const impayees = taxesData.filter(t => t.statut_paiement === 'impaye');
          taxesEnCours = impayees.length;
          montantTotal = impayees.reduce((sum, t) => sum + t.montant_taxe, 0);
        }
      }

      // Charger les paiements groupés
      const { data: paiementsData } = await supabase
        .from("paiements_groupes_taxes")
        .select("id, montant_total, date_paiement, created_at")
        .eq("cooperative_id", cooperativeData.id)
        .order("created_at", { ascending: false });

      // Construire les activités récentes
      const activities: CooperativeActivity[] = [];

      // Ajouter les paiements récents
      (paiementsData || []).slice(0, 3).forEach(paiement => {
        activities.push({
          id: paiement.id,
          type: "paiement",
          member: "Coopérative",
          description: "Paiement groupé de taxes",
          timestamp: new Date(paiement.created_at),
          status: "success",
          amount: paiement.montant_total,
        });
      });

      // Ajouter les nouvelles inscriptions récentes
      if (membresData && membresData.length > 0) {
        const recentMembres = [...membresData]
          .sort((a, b) => new Date(b.date_adhesion).getTime() - new Date(a.date_adhesion).getTime())
          .slice(0, 2);

        for (const membre of recentMembres) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", membre.pecheur_user_id)
            .single();

          if (profile) {
            activities.push({
              id: membre.pecheur_user_id,
              type: "inscription",
              member: `${profile.first_name} ${profile.last_name}`,
              description: "Nouvelle inscription",
              timestamp: new Date(membre.date_adhesion),
              status: "success",
            });
          }
        }
      }

      // Trier par date décroissante et limiter à 5
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentActivities(activities.slice(0, 5));

      setStats({
        membresActifs: membresData?.length || 0,
        taxesEnCours,
        montantTotal,
        paiementsGroupes: paiementsData?.length || 0,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  return { loading, stats, recentActivities, refresh: loadStats };
}
