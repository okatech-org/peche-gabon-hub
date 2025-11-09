import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, AlertCircle, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TaxeCapture {
  id: string;
  created_at: string;
  poids_taxable_kg: number;
  montant_unitaire: number | null;
  montant_taxe: number;
  statut_paiement: string;
  quittance_numero: string | null;
  espece: {
    nom: string;
  } | null;
}

export function TaxesPecheur() {
  const [loading, setLoading] = useState(true);
  const [taxes, setTaxes] = useState<TaxeCapture[]>([]);
  const [stats, setStats] = useState({
    totalImpaye: 0,
    totalPaye: 0,
    nombreImpaye: 0,
  });

  useEffect(() => {
    loadTaxes();
  }, []);

  const loadTaxes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: capturesData } = await supabase
        .from("captures_pa")
        .select("id")
        .eq("declare_par", user.id);

      const captureIds = (capturesData || []).map(c => c.id);
      if (captureIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: taxesData } = await supabase
        .from("taxes_captures")
        .select(`*, espece:especes(nom)`)
        .in("capture_pa_id", captureIds)
        .order("created_at", { ascending: false });

      const taxesTyped = taxesData as any || [];
      setTaxes(taxesTyped);

      const impayees = taxesTyped.filter((t: any) => t.statut_paiement === 'impaye');
      setStats({
        totalImpaye: impayees.reduce((sum: number, t: any) => sum + t.montant_taxe, 0),
        totalPaye: taxesTyped.filter((t: any) => t.statut_paiement === 'paye').reduce((sum: number, t: any) => sum + t.montant_taxe, 0),
        nombreImpaye: impayees.length,
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
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-700">
              Les taxes sont calculées automatiquement. Contactez votre coopérative pour le paiement.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Impayé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalImpaye.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Payé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalPaye.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm"><DollarSign className="h-4 w-4 inline" /> Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalImpaye + stats.totalPaye).toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taxes sur Captures</CardTitle>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <p className="text-center p-8 text-muted-foreground">Aucune taxe</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Espèce</TableHead>
                  <TableHead className="text-right">Poids (kg)</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxes.map((taxe) => (
                  <TableRow key={taxe.id}>
                    <TableCell>{format(new Date(taxe.created_at), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{taxe.espece?.nom || "-"}</TableCell>
                    <TableCell className="text-right">{taxe.poids_taxable_kg.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">{taxe.montant_taxe.toLocaleString()} FCFA</TableCell>
                    <TableCell>
                      <Badge variant={taxe.statut_paiement === "paye" ? "default" : "destructive"}>
                        {taxe.statut_paiement === "paye" ? "Payé" : "Impayé"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
