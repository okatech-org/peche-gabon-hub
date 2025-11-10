import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CreditCard, Users, DollarSign, Calendar, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TaxeImpayee {
  id: string;
  montant_taxe: number;
  date_echeance: string | null;
  poids_taxable_kg: number;
  created_at: string;
  capture_pa: {
    declare_par: string;
    date_capture: string;
  } | null;
  espece: {
    nom: string;
  } | null;
  pecheur: {
    nom: string;
    prenom: string;
    telephone: string | null;
  } | null;
  user: {
    email: string;
  } | null;
}

export function PaiementTaxesGroupees() {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [taxes, setTaxes] = useState<TaxeImpayee[]>([]);
  const [selectedTaxes, setSelectedTaxes] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [stats, setStats] = useState({
    totalMembres: 0,
    totalTaxes: 0,
    montantTotal: 0,
  });

  useEffect(() => {
    loadTaxesImpayees();
  }, []);

  const loadTaxesImpayees = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer la coopérative de l'utilisateur
      const { data: coop } = await supabase
        .from("cooperatives")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coop) {
        toast.error("Coopérative non trouvée");
        return;
      }

      // Récupérer les membres de la coopérative
      const { data: membres } = await supabase
        .from("pecheurs_cooperatives")
        .select("pecheur_user_id")
        .eq("cooperative_id", coop.id)
        .eq("statut", "actif");

      if (!membres || membres.length === 0) {
        setLoading(false);
        return;
      }

      const membresIds = membres.map(m => m.pecheur_user_id);

      // Récupérer les captures des membres
      const { data: captures } = await supabase
        .from("captures_pa")
        .select("id, declare_par")
        .in("declare_par", membresIds);

      if (!captures || captures.length === 0) {
        setLoading(false);
        return;
      }

      const capturesIds = captures.map(c => c.id);

      // Récupérer les taxes impayées
      const { data: taxesData } = await supabase
        .from("taxes_captures")
        .select(`
          *,
          espece:especes(nom),
          capture_pa:captures_pa!capture_pa_id(declare_par, date_capture)
        `)
        .in("capture_pa_id", capturesIds)
        .eq("statut_paiement", "impaye")
        .order("date_echeance", { ascending: true, nullsFirst: false });

      if (taxesData && taxesData.length > 0) {
        // Enrichir avec les infos des utilisateurs
        const capturesMap = new Map(captures.map((c: any) => [c.id, c.declare_par]));
        
        const taxesEnrichies: any[] = [];
        
        for (const taxe of taxesData) {
          const userId = capturesMap.get(taxe.capture_pa_id);
          
          // Récupérer les infos de l'utilisateur
          const { data: userData } = await supabase.auth.admin.getUserById(userId || '');

          taxesEnrichies.push({
            ...taxe,
            pecheur: {
              nom: userData?.user?.user_metadata?.last_name || '',
              prenom: userData?.user?.user_metadata?.first_name || '',
              telephone: userData?.user?.phone || null,
            },
            user: { email: userData?.user?.email || '' },
          });
        }

        setTaxes(taxesEnrichies);

        // Calculer les statistiques
        const montantTotal = taxesEnrichies.reduce((sum, t) => sum + t.montant_taxe, 0);
        const membresUniques = new Set(taxesEnrichies.map((t: any) => t.capture_pa?.declare_par)).size;

        setStats({
          totalMembres: membresUniques,
          totalTaxes: taxesEnrichies.length,
          montantTotal,
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des taxes");
    } finally {
      setLoading(false);
    }
  };

  const toggleTaxe = (taxeId: string) => {
    const newSelected = new Set(selectedTaxes);
    if (newSelected.has(taxeId)) {
      newSelected.delete(taxeId);
    } else {
      newSelected.add(taxeId);
    }
    setSelectedTaxes(newSelected);
  };

  const toggleAll = () => {
    if (selectedTaxes.size === taxes.length) {
      setSelectedTaxes(new Set());
    } else {
      setSelectedTaxes(new Set(taxes.map(t => t.id)));
    }
  };

  const getMontantSelectionne = () => {
    return taxes
      .filter(t => selectedTaxes.has(t.id))
      .reduce((sum, t) => sum + t.montant_taxe, 0);
  };

  const handlePaiementGroupe = async () => {
    if (selectedTaxes.size === 0) {
      toast.error("Sélectionnez au moins une taxe");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmerPaiement = async () => {
    try {
      setPaying(true);
      setShowConfirmDialog(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Récupérer la coopérative
      const { data: coop } = await supabase
        .from("cooperatives")
        .select("id, nom")
        .eq("user_id", user.id)
        .single();

      if (!coop) throw new Error("Coopérative non trouvée");

      const taxesSelectionnees = taxes.filter(t => selectedTaxes.has(t.id));

      // Appeler l'edge function pour générer les quittances et envoyer les emails
      const { data, error } = await supabase.functions.invoke("generer-quittances-groupees", {
        body: {
          cooperative_id: coop.id,
          cooperative_nom: coop.nom,
          taxes: taxesSelectionnees.map(t => ({
            id: t.id,
            montant: t.montant_taxe,
            pecheur_email: t.user?.email,
            pecheur_nom: `${t.pecheur?.prenom || ''} ${t.pecheur?.nom || ''}`,
            espece: t.espece?.nom,
            poids: t.poids_taxable_kg,
            date_capture: t.capture_pa?.date_capture,
          })),
        },
      });

      if (error) throw error;

      toast.success(
        `${selectedTaxes.size} taxe(s) payée(s) avec succès`,
        {
          description: "Les quittances ont été générées et envoyées aux membres",
          duration: 5000,
        }
      );

      // Recharger les données
      setSelectedTaxes(new Set());
      await loadTaxesImpayees();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du paiement groupé", {
        description: error.message,
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membres concernés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembres}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Taxes impayées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTaxes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Montant total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.montantTotal.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      {selectedTaxes.size > 0 && (
        <Alert className="border-primary bg-primary/5">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {selectedTaxes.size} taxe(s) sélectionnée(s) - {getMontantSelectionne().toLocaleString()} FCFA
            </span>
            <Button onClick={handlePaiementGroupe} disabled={paying}>
              <CreditCard className="mr-2 h-4 w-4" />
              Payer la sélection
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Taxes impayées des membres</CardTitle>
              <CardDescription>
                Sélectionnez les taxes à payer en lot
              </CardDescription>
            </div>
            {taxes.length > 0 && (
              <Button variant="outline" onClick={toggleAll}>
                {selectedTaxes.size === taxes.length ? "Tout désélectionner" : "Tout sélectionner"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Aucune taxe impayée</p>
              <p className="text-sm mt-2">Tous vos membres sont à jour !</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTaxes.size === taxes.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Membre</TableHead>
                    <TableHead>Espèce</TableHead>
                    <TableHead className="text-right">Poids (kg)</TableHead>
                    <TableHead>Date capture</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxes.map((taxe) => (
                    <TableRow key={taxe.id} className={selectedTaxes.has(taxe.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTaxes.has(taxe.id)}
                          onCheckedChange={() => toggleTaxe(taxe.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {taxe.pecheur?.prenom} {taxe.pecheur?.nom}
                      </TableCell>
                      <TableCell>{taxe.espece?.nom || "-"}</TableCell>
                      <TableCell className="text-right">{taxe.poids_taxable_kg.toLocaleString()}</TableCell>
                      <TableCell>
                        {taxe.capture_pa?.date_capture
                          ? format(new Date(taxe.capture_pa.date_capture), "dd/MM/yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {taxe.date_echeance ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">
                              {format(new Date(taxe.date_echeance), "dd/MM/yyyy", { locale: fr })}
                            </span>
                            {new Date(taxe.date_echeance) < new Date() && (
                              <Badge variant="destructive" className="text-xs w-fit">
                                Échue
                              </Badge>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {taxe.montant_taxe.toLocaleString()} FCFA
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {taxe.user?.email || "Non renseigné"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le paiement groupé</DialogTitle>
            <DialogDescription>
              Vous allez payer {selectedTaxes.size} taxe(s) pour un montant total de{" "}
              <span className="font-bold">{getMontantSelectionne().toLocaleString()} FCFA</span>
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Des quittances seront automatiquement générées et envoyées par email à chaque membre concerné.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={paying}>
              Annuler
            </Button>
            <Button onClick={confirmerPaiement} disabled={paying}>
              {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
