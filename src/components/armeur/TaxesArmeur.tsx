import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
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
  maree: {
    date_depart: string;
    navire: {
      nom: string;
    };
  } | null;
}

export function TaxesArmeur() {
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
      const { data: mareesData } = await supabase
        .from("marees_industrielles")
        .select("id")
        .in("navire_id", navireIds);

      const mareeIds = (mareesData || []).map(m => m.id);

      if (mareeIds.length === 0) {
        setLoading(false);
        return;
      }

      // Charger les taxes
      const { data: taxesData, error: taxesError } = await supabase
        .from("taxes_captures")
        .select(`
          *,
          espece:especes(nom),
          maree:marees_industrielles(
            date_depart,
            navire:navires(nom)
          )
        `)
        .in("maree_industrielle_id", mareeIds)
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
    <div className="space-y-6">
      {/* KPIs des taxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Taxes Impayées
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
              Taxes Payées
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
              Total Taxes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalImpaye + stats.totalPaye).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">Toutes périodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Déclarations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxes.length}</div>
            <p className="text-xs text-muted-foreground">Taxes calculées</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé des taxes */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Taxes sur Captures</CardTitle>
          <CardDescription>
            Taxes calculées automatiquement selon les barèmes en vigueur
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Aucune taxe calculée pour le moment
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Navire</TableHead>
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
                        {format(new Date(taxe.created_at), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {taxe.maree?.navire?.nom || "-"}
                      </TableCell>
                      <TableCell>{taxe.espece?.nom || "Toutes espèces"}</TableCell>
                      <TableCell className="text-right">
                        {taxe.poids_taxable_kg.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {taxe.taux_applique
                          ? `${taxe.taux_applique}%`
                          : taxe.montant_unitaire
                          ? `${taxe.montant_unitaire} FCFA/kg`
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

      {/* Message informatif */}
      {stats.nombreImpaye > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Taxes en attente de paiement</p>
                <p className="text-sm text-orange-700 mt-1">
                  Vous avez {stats.nombreImpaye} taxe(s) impayée(s) pour un montant total de{" "}
                  <span className="font-semibold">{stats.totalImpaye.toLocaleString()} FCFA</span>.
                  Veuillez vous rapprocher de l'administration pour régulariser votre situation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
