import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, DollarSign, TrendingUp, Building2, PieChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaxeCalculee {
  id: string;
  montant_taxe: number;
  poids_taxable_kg: number;
  statut_paiement: string;
  date_paiement: string | null;
  captures_pa?: {
    date_capture: string;
    pirogues?: {
      nom: string;
    };
  };
  bareme_taxes?: {
    nom: string;
  };
}

interface RemonteeEffective {
  id: string;
  montant_remonte: number;
  pourcentage_applique: number;
  periode_mois: number;
  periode_annee: number;
  statut_virement: string;
  repartition_institutionnelle?: {
    nom_institution: string;
    type_institution: string;
  };
}

interface RepartitionInstitutionnelle {
  id: string;
  nom_institution: string;
  type_institution: string;
  pourcentage_taxes: number;
  actif: boolean;
}

interface StatsTaxes {
  total_taxes: number;
  taxes_payees: number;
  taxes_en_attente: number;
  poids_total_kg: number;
}

export function TaxesRemonteesDashboard() {
  const [taxes, setTaxes] = useState<TaxeCalculee[]>([]);
  const [remontees, setRemontees] = useState<RemonteeEffective[]>([]);
  const [repartitions, setRepartitions] = useState<RepartitionInstitutionnelle[]>([]);
  const [stats, setStats] = useState<StatsTaxes>({
    total_taxes: 0,
    taxes_payees: 0,
    taxes_en_attente: 0,
    poids_total_kg: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taxesRes, remonteesRes, repartitionsRes] = await Promise.all([
        supabase
          .from("taxes_calculees")
          .select(`
            *,
            captures_pa(date_capture, pirogues(nom)),
            bareme_taxes(nom)
          `)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("remontees_effectives")
          .select(`
            *,
            repartition_institutionnelle(nom_institution, type_institution)
          `)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("repartition_institutionnelle")
          .select("*")
          .eq("actif", true)
          .order("pourcentage_taxes", { ascending: false }),
      ]);

      if (taxesRes.error) throw taxesRes.error;
      if (remonteesRes.error) throw remonteesRes.error;
      if (repartitionsRes.error) throw repartitionsRes.error;

      setTaxes(taxesRes.data || []);
      setRemontees(remonteesRes.data || []);
      setRepartitions(repartitionsRes.data || []);

      // Calculer les statistiques
      const totalTaxes = (taxesRes.data || []).reduce(
        (sum, t) => sum + parseFloat(t.montant_taxe.toString()),
        0
      );
      const taxesPayees = (taxesRes.data || [])
        .filter((t) => t.statut_paiement === "paye")
        .reduce((sum, t) => sum + parseFloat(t.montant_taxe.toString()), 0);
      const taxesEnAttente = (taxesRes.data || [])
        .filter((t) => t.statut_paiement === "en_attente")
        .reduce((sum, t) => sum + parseFloat(t.montant_taxe.toString()), 0);
      const poidsTotal = (taxesRes.data || []).reduce(
        (sum, t) => sum + parseFloat(t.poids_taxable_kg.toString()),
        0
      );

      setStats({
        total_taxes: totalTaxes,
        taxes_payees: taxesPayees,
        taxes_en_attente: taxesEnAttente,
        poids_total_kg: poidsTotal,
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "paye":
      case "effectue":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "en_attente":
      case "planifie":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
      case "exonere":
      case "annule":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Taxes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_taxes.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {stats.poids_total_kg.toLocaleString()} kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxes Payées</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.taxes_payees.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total_taxes > 0
                ? ((stats.taxes_payees / stats.total_taxes) * 100).toFixed(1)
                : 0}
              % du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.taxes_en_attente.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total_taxes > 0
                ? ((stats.taxes_en_attente / stats.total_taxes) * 100).toFixed(1)
                : 0}
              % du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repartitions.length}</div>
            <p className="text-xs text-muted-foreground">Bénéficiaires actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs pour les différentes vues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Taxes et Remontées Institutionnelles
          </CardTitle>
          <CardDescription>
            Suivi des taxes collectées et leur répartition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="taxes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="taxes">Taxes Calculées</TabsTrigger>
              <TabsTrigger value="remontees">Remontées</TabsTrigger>
              <TabsTrigger value="repartition">Répartition</TabsTrigger>
            </TabsList>

            <TabsContent value="taxes" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Capture</TableHead>
                      <TableHead>Pirogue</TableHead>
                      <TableHead>Barème</TableHead>
                      <TableHead className="text-right">Poids (kg)</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Aucune taxe enregistrée
                        </TableCell>
                      </TableRow>
                    ) : (
                      taxes.map((taxe) => (
                        <TableRow key={taxe.id}>
                          <TableCell>
                            {taxe.captures_pa?.date_capture
                              ? new Date(taxe.captures_pa.date_capture).toLocaleDateString("fr-FR")
                              : "N/A"}
                          </TableCell>
                          <TableCell>{taxe.captures_pa?.pirogues?.nom || "N/A"}</TableCell>
                          <TableCell>{taxe.bareme_taxes?.nom || "N/A"}</TableCell>
                          <TableCell className="text-right">
                            {taxe.poids_taxable_kg.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {taxe.montant_taxe.toLocaleString()} FCFA
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatutColor(taxe.statut_paiement)}>
                              {taxe.statut_paiement.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="remontees" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">% Appliqué</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remontees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Aucune remontée enregistrée
                        </TableCell>
                      </TableRow>
                    ) : (
                      remontees.map((remontee) => (
                        <TableRow key={remontee.id}>
                          <TableCell className="font-medium">
                            {remontee.repartition_institutionnelle?.nom_institution || "N/A"}
                          </TableCell>
                          <TableCell>
                            {remontee.repartition_institutionnelle?.type_institution
                              ?.replace("_", " ")
                              || "N/A"}
                          </TableCell>
                          <TableCell>
                            {remontee.periode_mois}/{remontee.periode_annee}
                          </TableCell>
                          <TableCell className="text-right">
                            {remontee.pourcentage_applique}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {remontee.montant_remonte.toLocaleString()} FCFA
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatutColor(remontee.statut_virement)}>
                              {remontee.statut_virement}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="repartition" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Pourcentage</TableHead>
                      <TableHead className="text-right">Montant Estimé</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repartitions.map((rep) => {
                      const montantEstime =
                        (stats.total_taxes * rep.pourcentage_taxes) / 100;
                      return (
                        <TableRow key={rep.id}>
                          <TableCell className="font-medium">
                            {rep.nom_institution}
                          </TableCell>
                          <TableCell>
                            {rep.type_institution.replace("_", " ")}
                          </TableCell>
                          <TableCell className="text-right text-lg font-semibold">
                            {rep.pourcentage_taxes}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {montantEstime.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
