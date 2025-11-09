import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PayerTaxesGroupeesDialog } from "./PayerTaxesGroupeesDialog";

interface TaxeMembre {
  id: string;
  created_at: string;
  poids_taxable_kg: number;
  montant_taxe: number;
  statut_paiement: string;
  espece: { nom: string } | null;
  capture: {
    declare_par: string;
    pecheur: { first_name: string; last_name: string; email: string } | null;
  } | null;
}

export function TaxesCooperative() {
  const [loading, setLoading] = useState(true);
  const [taxes, setTaxes] = useState<TaxeMembre[]>([]);
  const [selectedTaxes, setSelectedTaxes] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState({ totalImpaye: 0, nombreImpaye: 0 });

  useEffect(() => {
    loadTaxes();
  }, []);

  const loadTaxes = async () => {
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

      const { data: membresData } = await supabase
        .from("pecheurs_cooperatives")
        .select("pecheur_user_id")
        .eq("cooperative_id", cooperativeData.id)
        .eq("statut", "actif");

      const membreIds = (membresData || []).map(m => m.pecheur_user_id);
      if (membreIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: capturesData } = await supabase
        .from("captures_pa")
        .select("id")
        .in("declare_par", membreIds);

      const captureIds = (capturesData || []).map(c => c.id);
      if (captureIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: taxesData, error } = await supabase
        .from("taxes_captures")
        .select(`
          *,
          espece:especes(nom),
          capture:captures_pa!inner(declare_par)
        `)
        .in("capture_pa_id", captureIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrichir avec les infos des pêcheurs
      const taxesEnrichies = await Promise.all(
        (taxesData || []).map(async (taxe) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", (taxe.capture as any).declare_par)
            .single();

          return {
            ...taxe,
            capture: {
              ...(taxe.capture as any),
              pecheur: profile
            }
          };
        })
      );

      setTaxes(taxesEnrichies as any);

      const impayees = taxesEnrichies.filter((t: any) => t.statut_paiement === 'impaye');
      setStats({
        totalImpaye: impayees.reduce((sum: number, t: any) => sum + t.montant_taxe, 0),
        nombreImpaye: impayees.length,
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTaxe = (taxeId: string, checked: boolean) => {
    setSelectedTaxes(prev =>
      checked ? [...prev, taxeId] : prev.filter(id => id !== taxeId)
    );
  };

  const handleSelectAll = () => {
    const impayees = taxes.filter(t => t.statut_paiement === 'impaye');
    if (selectedTaxes.length === impayees.length) {
      setSelectedTaxes([]);
    } else {
      setSelectedTaxes(impayees.map(t => t.id));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const taxesImpa = taxes.filter(t => t.statut_paiement === 'impaye');
  const montantSelection = taxes
    .filter(t => selectedTaxes.includes(t.id))
    .reduce((sum, t) => sum + t.montant_taxe, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Total Impayé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalImpaye.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">{stats.nombreImpaye} taxe(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Sélection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{montantSelection.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">{selectedTaxes.length} sélectionnée(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={selectedTaxes.length === 0}
              className="w-full"
            >
              Payer la Sélection
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taxes des Membres</CardTitle>
          <CardDescription>Sélectionnez les taxes à payer collectivement</CardDescription>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <p className="text-center p-8 text-muted-foreground">Aucune taxe</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTaxes.length === taxesImpa.length && taxesImpa.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Tout sélectionner ({taxesImpa.length} impayées)</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Pêcheur</TableHead>
                    <TableHead>Espèce</TableHead>
                    <TableHead className="text-right">Poids (kg)</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxes.map((taxe) => (
                    <TableRow key={taxe.id}>
                      <TableCell>
                        {taxe.statut_paiement === 'impaye' && (
                          <Checkbox
                            checked={selectedTaxes.includes(taxe.id)}
                            onCheckedChange={(checked) => handleSelectTaxe(taxe.id, checked as boolean)}
                          />
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(taxe.created_at), "dd/MM/yyyy", { locale: fr })}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{taxe.capture?.pecheur?.first_name} {taxe.capture?.pecheur?.last_name}</p>
                          <p className="text-xs text-muted-foreground">{taxe.capture?.pecheur?.email}</p>
                        </div>
                      </TableCell>
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
            </div>
          )}
        </CardContent>
      </Card>

      <PayerTaxesGroupeesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        taxesIds={selectedTaxes}
        montantTotal={montantSelection}
        onSuccess={() => {
          setSelectedTaxes([]);
          loadTaxes();
        }}
      />
    </div>
  );
}
