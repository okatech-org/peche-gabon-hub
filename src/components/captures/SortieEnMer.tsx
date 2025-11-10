import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ship, Anchor, Clock, Fish } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { DepartEnMerDialog } from "./DepartEnMerDialog";
import { RetourAuPortDialog } from "./RetourAuPortDialog";
import { DeclarerCaptureDialog } from "./DeclarerCaptureDialog";

interface SortieEnCours {
  id: string;
  pirogue_id: string;
  site_id: string;
  date_depart: string;
  heure_depart: string;
  pirogue_nom?: string;
  site_nom?: string;
}

interface SortieEnMerProps {
  onSortieChange?: () => void;
}

export const SortieEnMer = ({ onSortieChange }: SortieEnMerProps) => {
  const { user } = useAuth();
  const [sortieEnCours, setSortieEnCours] = useState<SortieEnCours | null>(null);
  const [sortieTerminee, setSortieTerminee] = useState<SortieEnCours | null>(null);
  const [loading, setLoading] = useState(true);
  const [departDialogOpen, setDepartDialogOpen] = useState(false);
  const [retourDialogOpen, setRetourDialogOpen] = useState(false);
  const [captureDialogOpen, setCaptureDialogOpen] = useState(false);

  useEffect(() => {
    loadSortieEnCours();
  }, [user]);

  const loadSortieEnCours = async () => {
    try {
      if (!user) return;

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
    } finally {
      setLoading(false);
    }
  };

  const handleDepartSuccess = () => {
    loadSortieEnCours();
    onSortieChange?.();
    setDepartDialogOpen(false);
  };

  const handleRetourSuccess = (sortieTerminee: SortieEnCours & { date_retour: string; heure_retour: string; effort_heures: number }) => {
    loadSortieEnCours();
    onSortieChange?.();
    setRetourDialogOpen(false);
    setSortieTerminee(sortieTerminee);
    setCaptureDialogOpen(true);
  };

  const calculerTempsEnMer = () => {
    if (!sortieEnCours) return "";
    
    const maintenant = new Date();
    const depart = new Date(`${sortieEnCours.date_depart}T${sortieEnCours.heure_depart}`);
    
    const heures = differenceInHours(maintenant, depart);
    const minutes = differenceInMinutes(maintenant, depart) % 60;
    
    return `${heures}h ${minutes}min`;
  };

  if (loading) return null;

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${sortieEnCours ? 'bg-blue-500/10' : 'bg-muted'}`}>
                {sortieEnCours ? (
                  <Ship className="h-6 w-6 text-blue-500" />
                ) : (
                  <Anchor className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Sortie en Mer</CardTitle>
                <CardDescription>
                  {sortieEnCours ? "Sortie en cours" : "Aucune sortie active"}
                </CardDescription>
              </div>
            </div>
            <Badge variant={sortieEnCours ? "default" : "secondary"} className="text-xs">
              {sortieEnCours ? "EN MER" : "AU PORT"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortieEnCours ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pirogue</p>
                  <p className="font-medium">{sortieEnCours.pirogue_nom}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Site</p>
                  <p className="font-medium">{sortieEnCours.site_nom}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Départ</p>
                  <p className="font-medium">
                    {format(new Date(`${sortieEnCours.date_depart}T${sortieEnCours.heure_depart}`), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Temps en mer</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <p className="font-medium">{calculerTempsEnMer()}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setRetourDialogOpen(true)}
                  className="flex-1"
                  variant="default"
                >
                  <Anchor className="h-4 w-4 mr-2" />
                  Retour au Port
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Déclarez votre départ en mer pour commencer à enregistrer vos captures
              </p>
              <Button 
                onClick={() => setDepartDialogOpen(true)}
                className="w-full"
              >
                <Ship className="h-4 w-4 mr-2" />
                Départ en Mer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DepartEnMerDialog 
        open={departDialogOpen}
        onOpenChange={setDepartDialogOpen}
        onSuccess={handleDepartSuccess}
      />

      <RetourAuPortDialog
        open={retourDialogOpen}
        onOpenChange={setRetourDialogOpen}
        sortie={sortieEnCours}
        onSuccess={handleRetourSuccess}
      />

      <DeclarerCaptureDialog
        open={captureDialogOpen}
        onOpenChange={setCaptureDialogOpen}
        sortieEnCours={sortieTerminee}
      />
    </>
  );
};