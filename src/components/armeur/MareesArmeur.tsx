import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { DeclarerMareeDialog } from "./DeclarerMareeDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Maree {
  id: string;
  navire_id: string;
  date_depart: string;
  date_retour: string | null;
  duree_mer_jours: number | null;
  jours_peche: number | null;
  zone_peche: string | null;
  capture_totale_kg: number | null;
  cpue_moyenne: number | null;
  navire: {
    nom: string;
    matricule: string;
  };
}

export function MareesArmeur() {
  const [loading, setLoading] = useState(true);
  const [marees, setMarees] = useState<Maree[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadMarees();
  }, []);

  const loadMarees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Charger l'armement de l'utilisateur
      const { data: armementData } = await supabase
        .from("armements")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!armementData) {
        setLoading(false);
        return;
      }

      // Charger les navires de cet armement
      const { data: naviresData } = await supabase
        .from("navires")
        .select("id")
        .eq("armement_id", armementData.id);

      if (!naviresData || naviresData.length === 0) {
        setLoading(false);
        return;
      }

      const navireIds = naviresData.map(n => n.id);

      // Charger les marées de ces navires
      const { data: mareesData, error: mareesError } = await supabase
        .from("marees_industrielles")
        .select(`
          *,
          navire:navires(nom, matricule)
        `)
        .in("navire_id", navireIds)
        .order("date_depart", { ascending: false });

      if (mareesError) throw mareesError;

      setMarees(mareesData as any || []);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des marées");
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Journal des Marées</h3>
          <p className="text-sm text-muted-foreground">
            Historique des campagnes de pêche de votre flotte
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Déclarer une Marée
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marées Enregistrées ({marees.length})</CardTitle>
          <CardDescription>Liste complète des voyages de pêche</CardDescription>
        </CardHeader>
        <CardContent>
          {marees.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">
              Aucune marée enregistrée
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navire</TableHead>
                    <TableHead>Date Départ</TableHead>
                    <TableHead>Date Retour</TableHead>
                    <TableHead className="text-right">Durée (j)</TableHead>
                    <TableHead className="text-right">Jours Pêche</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead className="text-right">Captures (kg)</TableHead>
                    <TableHead className="text-right">CPUE (kg/j)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marees.map((maree) => (
                    <TableRow key={maree.id}>
                      <TableCell className="font-medium">
                        {maree.navire?.nom || "-"}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {maree.navire?.matricule || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(maree.date_depart), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {maree.date_retour
                          ? format(new Date(maree.date_retour), "dd/MM/yyyy", { locale: fr })
                          : "En cours"}
                      </TableCell>
                      <TableCell className="text-right">
                        {maree.duree_mer_jours || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {maree.jours_peche || "-"}
                      </TableCell>
                      <TableCell>{maree.zone_peche || "-"}</TableCell>
                      <TableCell className="text-right">
                        {maree.capture_totale_kg
                          ? maree.capture_totale_kg.toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {maree.cpue_moyenne
                          ? maree.cpue_moyenne.toFixed(2)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeclarerMareeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadMarees}
      />
    </div>
  );
}
