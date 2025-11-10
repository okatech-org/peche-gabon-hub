import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, DollarSign, AlertCircle, CheckCircle, Info, Calendar, Filter, Phone } from "lucide-react";
import { toast } from "sonner";
import { format, isPast, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PayerTaxeDialog } from "./PayerTaxeDialog";

interface TaxeCapture {
  id: string;
  created_at: string;
  poids_taxable_kg: number;
  montant_unitaire: number | null;
  montant_taxe: number;
  statut_paiement: string;
  quittance_numero: string | null;
  date_echeance: string | null;
  espece: {
    nom: string;
  } | null;
  bareme: {
    nom: string;
  } | null;
}

export function TaxesPecheur() {
  const [loading, setLoading] = useState(true);
  const [taxes, setTaxes] = useState<TaxeCapture[]>([]);
  const [filteredTaxes, setFilteredTaxes] = useState<TaxeCapture[]>([]);
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [selectedTaxes, setSelectedTaxes] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [recentlyPaidTaxes, setRecentlyPaidTaxes] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalImpaye: 0,
    totalPaye: 0,
    nombreImpaye: 0,
    nombreEchuSoon: 0,
  });

  useEffect(() => {
    loadTaxes();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [taxes, filterStatut]);

  const applyFilter = () => {
    if (filterStatut === "tous") {
      setFilteredTaxes(taxes);
    } else {
      setFilteredTaxes(taxes.filter(t => t.statut_paiement === filterStatut));
    }
  };

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
        .select(`*, espece:especes(nom), bareme:bareme_taxes(nom)`)
        .in("capture_pa_id", captureIds)
        .order("created_at", { ascending: false });

      const taxesTyped = taxesData as any || [];
      
      // Détecter les taxes qui viennent d'être payées
      const newRecentlyPaid = new Set<string>();
      taxesTyped.forEach((newTaxe: any) => {
        const oldTaxe = taxes.find(t => t.id === newTaxe.id);
        if (oldTaxe && oldTaxe.statut_paiement === 'impaye' && newTaxe.statut_paiement === 'paye') {
          newRecentlyPaid.add(newTaxe.id);
        }
      });
      
      if (newRecentlyPaid.size > 0) {
        setRecentlyPaidTaxes(newRecentlyPaid);
        // Retirer l'animation après 2 secondes
        setTimeout(() => {
          setRecentlyPaidTaxes(new Set());
        }, 2000);
      }
      
      setTaxes(taxesTyped);

      const impayees = taxesTyped.filter((t: any) => t.statut_paiement === 'impaye');
      const today = new Date();
      const echuSoon = impayees.filter((t: any) => {
        if (!t.date_echeance) return false;
        const echeance = new Date(t.date_echeance);
        const daysUntil = differenceInDays(echeance, today);
        return daysUntil >= 0 && daysUntil <= 5;
      });

      setStats({
        totalImpaye: impayees.reduce((sum: number, t: any) => sum + t.montant_taxe, 0),
        totalPaye: taxesTyped.filter((t: any) => t.statut_paiement === 'paye').reduce((sum: number, t: any) => sum + t.montant_taxe, 0),
        nombreImpaye: impayees.length,
        nombreEchuSoon: echuSoon.length,
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

  const handleSelectTaxe = (taxeId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaxes(prev => [...prev, taxeId]);
    } else {
      setSelectedTaxes(prev => prev.filter(id => id !== taxeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const impayeesIds = filteredTaxes.filter(t => t.statut_paiement === 'impaye').map(t => t.id);
      setSelectedTaxes(impayeesIds);
    } else {
      setSelectedTaxes([]);
    }
  };

  const getEcheanceStatus = (dateEcheance: string | null) => {
    if (!dateEcheance) return null;
    const echeance = new Date(dateEcheance);
    const today = new Date();
    const daysUntil = differenceInDays(echeance, today);
    
    if (isPast(echeance) && daysUntil < 0) {
      return { label: "Échue", variant: "destructive" as const, days: Math.abs(daysUntil) };
    } else if (daysUntil <= 5) {
      return { label: "Urgent", variant: "destructive" as const, days: daysUntil };
    } else if (daysUntil <= 15) {
      return { label: "Bientôt", variant: "secondary" as const, days: daysUntil };
    }
    return { label: "OK", variant: "default" as const, days: daysUntil };
  };

  const selectedAmount = taxes
    .filter(t => selectedTaxes.includes(t.id))
    .reduce((sum, t) => sum + t.montant_taxe, 0);

  return (
    <div className="space-y-6">
      {stats.nombreEchuSoon > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-semibold text-orange-700">
                  {stats.nombreEchuSoon} taxe{stats.nombreEchuSoon > 1 ? "s" : ""} à échéance proche (≤ 5 jours)
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Contactez votre coopérative rapidement pour éviter les pénalités.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Les taxes sont calculées automatiquement selon les barèmes en vigueur.
              </p>
              <Button variant="link" className="h-auto p-0 text-sm mt-2" asChild>
                <a href="tel:+241" className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  Contacter ma coopérative
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Impayé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalImpaye.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.nombreImpaye} taxe{stats.nombreImpaye > 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
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
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalImpaye + stats.totalPaye).toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        {stats.nombreEchuSoon > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-600" />
                Urgent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.nombreEchuSoon}</div>
              <p className="text-xs text-muted-foreground mt-1">échéance ≤ 5j</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedTaxes.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {selectedTaxes.length} taxe{selectedTaxes.length > 1 ? "s" : ""} sélectionnée{selectedTaxes.length > 1 ? "s" : ""}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {selectedAmount.toLocaleString()} FCFA
                </p>
              </div>
              <Button onClick={() => setShowPaymentDialog(true)} size="lg">
                Payer la sélection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historique des Taxes</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="impaye">Impayé</SelectItem>
                  <SelectItem value="paye">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>
            Consultez l'historique de vos taxes de capture
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTaxes.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">
                {filterStatut === "tous" ? "Aucune taxe enregistrée" : `Aucune taxe ${filterStatut === "paye" ? "payée" : "impayée"}`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTaxes.length === filteredTaxes.filter(t => t.statut_paiement === 'impaye').length && filteredTaxes.filter(t => t.statut_paiement === 'impaye').length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Date capture</TableHead>
                    <TableHead>Espèce</TableHead>
                    <TableHead>Barème</TableHead>
                    <TableHead className="text-right">Poids (kg)</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaxes.map((taxe) => {
                    const echeanceStatus = getEcheanceStatus(taxe.date_echeance);
                    const isImpaye = taxe.statut_paiement === 'impaye';
                    const isRecentlyPaid = recentlyPaidTaxes.has(taxe.id);
                    return (
                      <TableRow 
                        key={taxe.id}
                        className={`transition-all duration-500 ${
                          isRecentlyPaid 
                            ? 'animate-in fade-in-0 slide-in-from-left-5 bg-green-50 dark:bg-green-950/20' 
                            : ''
                        }`}
                      >
                        <TableCell>
                          {isImpaye && (
                            <Checkbox
                              checked={selectedTaxes.includes(taxe.id)}
                              onCheckedChange={(checked) => handleSelectTaxe(taxe.id, checked as boolean)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(new Date(taxe.created_at), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>{taxe.espece?.nom || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {taxe.bareme?.nom || "-"}
                        </TableCell>
                        <TableCell className="text-right">{taxe.poids_taxable_kg.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {taxe.montant_taxe.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          {taxe.date_echeance ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm">{format(new Date(taxe.date_echeance), "dd/MM/yyyy", { locale: fr })}</span>
                              {echeanceStatus && isImpaye && (
                                <Badge variant={echeanceStatus.variant} className="text-xs w-fit">
                                  {echeanceStatus.label}
                                  {echeanceStatus.days >= 0 && ` (${echeanceStatus.days}j)`}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex ${isRecentlyPaid ? 'animate-in zoom-in-75 duration-500' : ''}`}>
                            <Badge 
                              variant={taxe.statut_paiement === "paye" ? "default" : "destructive"}
                              className={`${
                                taxe.statut_paiement === "paye" 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : ''
                              }`}
                            >
                              {taxe.statut_paiement === "paye" ? "Payé" : "Impayé"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isImpaye && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTaxes([taxe.id]);
                                setShowPaymentDialog(true);
                              }}
                            >
                              Payer
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PayerTaxeDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        taxesIds={selectedTaxes}
        montantTotal={selectedAmount}
        onSuccess={(paidIds, quittance) => {
          if (paidIds && paidIds.length > 0) {
            // MAJ optimiste immédiate
            setTaxes((prev) => prev.map(t => paidIds.includes(t.id)
              ? { ...t, statut_paiement: 'paye', quittance_numero: quittance || t.quittance_numero }
              : t
            ));
            const anim = new Set(paidIds);
            setRecentlyPaidTaxes(anim);
            setTimeout(() => setRecentlyPaidTaxes(new Set()), 2000);
          }
          setSelectedTaxes([]);
          // Rechargement pour synchroniser avec le backend
          loadTaxes();
        }}
      />
    </div>
  );
}
