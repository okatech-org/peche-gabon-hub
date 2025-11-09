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
  type_taxe: string;
  poids_taxable_kg: number;
  taux_applique: number | null;
  montant_unitaire: number | null;
  montant_taxe: number;
  statut_paiement: string;
  date_paiement: string | null;
  quittance_numero: string | null;
  espece: {
    nom: string;
  } | null;
  capture: {
    date_capture: string;
    site: {
      nom: string;
    } | null;
  } | null;
}

export function TaxesPecheur() {
  const [loading, setLoading] = useState(true);
  const [taxes, setTaxes] = useState<TaxeCapture[]>([]);
  const [stats, setStats] = useState({
    totalImpaye: 0,
    totalPaye: 0,
    nombreImpaye: 0,
    nombrePaye: 0,
  });

  useEffect(() => {
    loadTaxes();
  }, []);

  const loadTaxes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Charger les captures du pêcheur
      const { data: capturesData } = await supabase
        .from("captures_pa")
        .select("id")
        .eq("declare_par", user.id);

      const captureIds = (capturesData || []).map(c => c.id);

      if (captureIds.length === 0) {
        setLoading(false);
        return;
      }

      // Charger les taxes
      const { data: taxesData, error: taxesError } = await supabase
        .from("taxes_captures")
        .select(`
          *,
          espece:especes(nom),
          capture:captures_pa(
            date_capture,
            site:sites(nom)
          )
        `)
        .in("capture_pa_id", captureIds)
        .order("created_at", { ascending: false });

      if (taxesError) throw taxesError;

      const taxesTyped = taxesData as any || [];
      setTaxes(taxesTyped);

      // Calculer les statistiques
      const impayees = taxesTyped.filter((t: TaxeCapture) => t.statut_paiement === 'impaye');
      const payees = taxesTyped.filter((t: TaxeCapture) => t.statut_paiement === 'paye');

      setStats({
        totalImpaye: impayees.reduce((sum: number, t: TaxeCapture) => sum + t.montant_taxe, 0),
        totalPaye: payees.reduce((sum: number, t: TaxeCapture) => sum + t.montant_taxe, 0),
        nombreImpaye: impayees.length,
        nombrePaye: payees.length,
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des taxes");
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
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mes Taxes & Impôts</h2>
        <p className="text-muted-foreground">
          Taxes calculées sur vos déclarations de captures
        </p>
      </div>

      {/* KPIs des taxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              À Payer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalImpaye.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">{stats.nombreImpaye} taxe(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Payées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalPaye.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">{stats.nombrePaye} taxe(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalImpaye + stats.totalPaye).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">Toutes périodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Message informatif */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Calcul automatique des taxes</p>
              <p className="text-sm text-blue-700 mt-1">
                Les taxes sont calculées automatiquement selon les barèmes en vigueur 
                dès que vous déclarez une capture. Le montant dépend de l'espèce capturée 
                et du poids déclaré.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Taxes</CardTitle>
          <CardDescription>Détail de toutes vos taxes sur captures</CardDescription>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Aucune taxe calculée. Déclarez vos captures pour voir les taxes applicables.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Capture</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Espèce</TableHead>
                    <TableHead className="text-right">Poids (kg)</TableHead>
                    <TableHead className="text-right">Taux</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Quittance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxes.map((taxe) => (
                    <TableRow key={taxe.id}>
                      <TableCell>
                        {taxe.capture?.date_capture
                          ? format(new Date(taxe.capture.date_capture), "dd/MM/yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                      <TableCell>{taxe.capture?.site?.nom || "-"}</TableCell>
                      <TableCell>{taxe.espece?.nom || "Toutes"}</TableCell>
                      <TableCell className="text-right">
                        {taxe.poids_taxable_kg.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {taxe.montant_unitaire
                          ? `${taxe.montant_unitaire} FCFA/kg`
                          : taxe.taux_applique
                          ? `${taxe.taux_applique}%`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {taxe.montant_taxe.toLocaleString()} FCFA
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            taxe.statut_paiement === "paye"
                              ? "default"
                              : taxe.statut_paiement === "impaye"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {taxe.statut_paiement === "paye"
                            ? "Payé"
                            : taxe.statut_paiement === "impaye"
                            ? "Impayé"
                            : "Exonéré"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {taxe.quittance_numero || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerte si taxes impayées */}
      {stats.nombreImpaye > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Taxes en attente de règlement</p>
                <p className="text-sm text-orange-700 mt-1">
                  Vous avez {stats.nombreImpaye} taxe(s) impayée(s) pour un montant de{" "}
                  <span className="font-semibold">{stats.totalImpaye.toLocaleString()} FCFA</span>.
                  Rapprochez-vous de votre coopérative ou de l'agent de collecte pour procéder au paiement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
