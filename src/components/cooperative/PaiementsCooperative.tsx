import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Paiement {
  id: string;
  date_paiement: string;
  montant_total: number;
  mode_paiement: string;
  reference_paiement: string | null;
  notes: string | null;
  created_at: string;
}

export function PaiementsCooperative() {
  const [loading, setLoading] = useState(true);
  const [paiements, setPaiements] = useState<Paiement[]>([]);

  useEffect(() => {
    loadPaiements();
  }, []);

  const loadPaiements = async () => {
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

      const { data, error } = await supabase
        .from("paiements_groupes_taxes")
        .select("*")
        .eq("cooperative_id", cooperativeData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPaiements(data || []);
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
          <Receipt className="h-5 w-5" />
          Historique des Paiements Groupés
        </CardTitle>
        <CardDescription>Tous les paiements collectifs effectués</CardDescription>
      </CardHeader>
      <CardContent>
        {paiements.length === 0 ? (
          <p className="text-center p-8 text-muted-foreground">Aucun paiement enregistré</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paiements.map((paiement) => (
                <TableRow key={paiement.id}>
                  <TableCell>{format(new Date(paiement.date_paiement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {paiement.mode_paiement === 'especes' ? 'Espèces' :
                       paiement.mode_paiement === 'cheque' ? 'Chèque' :
                       paiement.mode_paiement === 'virement' ? 'Virement' :
                       paiement.mode_paiement === 'mobile_money' ? 'Mobile Money' :
                       paiement.mode_paiement}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{paiement.reference_paiement || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">{paiement.montant_total.toLocaleString()} FCFA</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{paiement.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
