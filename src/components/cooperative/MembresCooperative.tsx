import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Membre {
  id: string;
  date_adhesion: string;
  statut: string;
  pecheur: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export function MembresCooperative() {
  const [loading, setLoading] = useState(true);
  const [membres, setMembres] = useState<Membre[]>([]);

  useEffect(() => {
    loadMembres();
  }, []);

  const loadMembres = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cooperativeData } = await supabase
        .from("cooperatives")
        .select("id, nom")
        .eq("user_id", user.id)
        .single();

      if (!cooperativeData) {
        setLoading(false);
        return;
      }

      const { data: membresData, error } = await supabase
        .from("pecheurs_cooperatives")
        .select("*")
        .eq("cooperative_id", cooperativeData.id);

      if (error) throw error;

      const membresEnrichis = await Promise.all(
        (membresData || []).map(async (membre) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", membre.pecheur_user_id)
            .single();

          return { ...membre, pecheur: profile };
        })
      );

      setMembres(membresEnrichis);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Membres de la Coopérative ({membres.length})
        </CardTitle>
        <CardDescription>Liste des pêcheurs membres de votre coopérative</CardDescription>
      </CardHeader>
      <CardContent>
        {membres.length === 0 ? (
          <p className="text-center p-8 text-muted-foreground">Aucun membre</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date d'adhésion</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membres.map((membre) => (
                <TableRow key={membre.id}>
                  <TableCell className="font-medium">
                    {membre.pecheur?.first_name} {membre.pecheur?.last_name}
                  </TableCell>
                  <TableCell>{membre.pecheur?.email}</TableCell>
                  <TableCell>{format(new Date(membre.date_adhesion), "dd/MM/yyyy", { locale: fr })}</TableCell>
                  <TableCell>
                    <Badge variant={membre.statut === "actif" ? "default" : "secondary"}>
                      {membre.statut}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
