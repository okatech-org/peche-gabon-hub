import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { DeclarerCaptureDialog } from "@/components/captures/DeclarerCaptureDialog";
import { ListeCaptures } from "@/components/captures/ListeCaptures";
import { StatsCaptures } from "@/components/captures/StatsCaptures";
import { SortieEnMer } from "@/components/captures/SortieEnMer";
import { PecheurNav } from "@/components/PecheurNav";
import { supabase } from "@/integrations/supabase/client";

const Captures = () => {
  const { hasRole, user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortieEnCours, setSortieEnCours] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const canDeclare = hasRole('pecheur') || hasRole('agent_collecte') || 
                     hasRole('gestionnaire_coop') || hasRole('admin');

  const isPecheur = hasRole('pecheur');

  useEffect(() => {
    if (canDeclare) {
      loadSortieEnCours();
    }
  }, [user, canDeclare, refreshKey]);

  const loadSortieEnCours = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("sorties_peche")
        .select(`
          id,
          pirogue_id,
          site_id,
          date_depart,
          heure_depart,
          pirogues!inner(nom),
          sites!inner(nom)
        `)
        .eq("pecheur_id", user.id)
        .is("date_retour", null)
        .order("date_depart", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erreur chargement sortie:", error);
        return;
      }

      if (data) {
        const sortieData = data as any;
        setSortieEnCours({
          id: sortieData.id,
          pirogue_id: sortieData.pirogue_id,
          site_id: sortieData.site_id,
          date_depart: sortieData.date_depart,
          heure_depart: sortieData.heure_depart,
          pirogue_nom: sortieData.pirogues?.nom,
          site_nom: sortieData.sites?.nom,
        });
      } else {
        setSortieEnCours(null);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSortieChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {isPecheur && <PecheurNav />}
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Captures Artisanales</h1>
              <p className="text-muted-foreground">
                Déclarations et suivi des captures de pêche artisanale
              </p>
            </div>
            {canDeclare && (
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Déclarer une Capture
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Sortie en Mer Component */}
          {canDeclare && <SortieEnMer onSortieChange={handleSortieChange} />}

          <Tabs defaultValue="liste" className="space-y-6">
            <TabsList>
              <TabsTrigger value="liste">Liste des Captures</TabsTrigger>
              <TabsTrigger value="stats">Statistiques</TabsTrigger>
            </TabsList>

            <TabsContent value="liste" className="space-y-4">
              <ListeCaptures />
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <StatsCaptures />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {canDeclare && (
        <DeclarerCaptureDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          sortieEnCours={sortieEnCours}
        />
      )}
    </div>
  );
};

export default Captures;
