import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  PieChart,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Formation {
  id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  budget_prevu: number | null;
  budget_reel: number | null;
  nb_participants_inscrits: number;
  priorite: string;
}

interface Evaluation {
  id: string;
  formation_id: string;
  efficacite_avant: number;
  efficacite_apres: number;
  amelioration_pct: number;
  nb_actions_analysees: number;
}

interface BudgetStats {
  totalPrevu: number;
  totalReel: number;
  ecart: number;
  ecartPct: number;
  roiMoyen: number;
  nbFormations: number;
  coutMoyenParParticipant: number;
}

export function BudgetFormations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [stats, setStats] = useState<BudgetStats>({
    totalPrevu: 0,
    totalReel: 0,
    ecart: 0,
    ecartPct: 0,
    roiMoyen: 0,
    nbFormations: 0,
    coutMoyenParParticipant: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [budgetForm, setBudgetForm] = useState({
    budget_prevu: 0,
    budget_reel: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formations.length > 0) {
      calculateStats();
    }
  }, [formations, evaluations]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les formations avec budget
      const { data: formationsData, error: formationsError } = await supabase
        .from("formations_planifiees")
        .select("*")
        .order("date_debut", { ascending: false });

      if (formationsError) throw formationsError;
      setFormations(formationsData || []);

      // Charger les évaluations
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from("formations_evaluations")
        .select("*");

      if (evaluationsError) throw evaluationsError;
      setEvaluations(evaluationsData || []);
    } catch (error: any) {
      console.error("Erreur chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalPrevu = formations.reduce((sum, f) => sum + (f.budget_prevu || 0), 0);
    const totalReel = formations.reduce((sum, f) => sum + (f.budget_reel || 0), 0);
    const ecart = totalReel - totalPrevu;
    const ecartPct = totalPrevu > 0 ? ((ecart / totalPrevu) * 100) : 0;

    // Calcul du ROI moyen
    let totalRoi = 0;
    let nbFormationsAvecRoi = 0;

    formations.forEach((formation) => {
      const evaluation = evaluations.find((e) => e.formation_id === formation.id);
      if (evaluation && formation.budget_reel && formation.budget_reel > 0) {
        // ROI = (Gain - Coût) / Coût * 100
        // On considère que chaque point d'amélioration vaut 1000 FCFA en valeur économique
        const gainEstime = evaluation.amelioration_pct * evaluation.nb_actions_analysees * 1000;
        const roi = ((gainEstime - formation.budget_reel) / formation.budget_reel) * 100;
        totalRoi += roi;
        nbFormationsAvecRoi++;
      }
    });

    const roiMoyen = nbFormationsAvecRoi > 0 ? totalRoi / nbFormationsAvecRoi : 0;

    // Coût moyen par participant
    const totalParticipants = formations.reduce((sum, f) => sum + f.nb_participants_inscrits, 0);
    const coutMoyenParParticipant = totalParticipants > 0 ? totalReel / totalParticipants : 0;

    setStats({
      totalPrevu,
      totalReel,
      ecart,
      ecartPct,
      roiMoyen,
      nbFormations: formations.length,
      coutMoyenParParticipant,
    });
  };

  const updateBudget = async () => {
    if (!editingFormation) return;

    try {
      const { error } = await supabase
        .from("formations_planifiees")
        .update({
          budget_prevu: budgetForm.budget_prevu,
          budget_reel: budgetForm.budget_reel,
        })
        .eq("id", editingFormation.id);

      if (error) throw error;

      toast.success("Budget mis à jour");
      setEditingFormation(null);
      loadData();
    } catch (error: any) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour du budget");
    }
  };

  const openEditDialog = (formation: Formation) => {
    setEditingFormation(formation);
    setBudgetForm({
      budget_prevu: formation.budget_prevu || 0,
      budget_reel: formation.budget_reel || 0,
    });
  };

  const calculateFormationROI = (formation: Formation): number | null => {
    const evaluation = evaluations.find((e) => e.formation_id === formation.id);
    if (!evaluation || !formation.budget_reel || formation.budget_reel === 0) return null;

    const gainEstime = evaluation.amelioration_pct * evaluation.nb_actions_analysees * 1000;
    return ((gainEstime - formation.budget_reel) / formation.budget_reel) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicateurs Financiers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Budget Prévu Total</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalPrevu)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Budget Réel Total</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalReel)}</p>
              {stats.ecartPct !== 0 && (
                <p
                  className={`text-xs flex items-center gap-1 ${
                    stats.ecartPct > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {stats.ecartPct > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stats.ecartPct > 0 ? "+" : ""}
                  {stats.ecartPct.toFixed(1)}%
                </p>
              )}
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ROI Moyen</p>
              <p className="text-2xl font-bold">
                {stats.roiMoyen > 0 ? "+" : ""}
                {stats.roiMoyen.toFixed(0)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Coût / Participant</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.coutMoyenParParticipant)}
              </p>
            </div>
            <PieChart className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Alerte écart budgétaire */}
      {Math.abs(stats.ecartPct) > 15 && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">Alerte Écart Budgétaire</h3>
              <p className="text-sm text-muted-foreground mt-1">
                L'écart entre le budget prévu et réel est de {stats.ecartPct.toFixed(1)}% (
                {formatCurrency(Math.abs(stats.ecart))}). Un ajustement budgétaire est recommandé.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tableau des formations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Planification Budgétaire</h2>
              <p className="text-sm text-muted-foreground">
                {stats.nbFormations} formation(s) · Suivi budget et ROI
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {formations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée budgétaire disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formations.map((formation) => {
                const ecartFormation =
                  (formation.budget_reel || 0) - (formation.budget_prevu || 0);
                const ecartPctFormation =
                  formation.budget_prevu && formation.budget_prevu > 0
                    ? ((ecartFormation / formation.budget_prevu) * 100)
                    : 0;
                const roi = calculateFormationROI(formation);
                const hasBudgetData = formation.budget_prevu || formation.budget_reel;

                return (
                  <Card key={formation.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{formation.titre}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(formation.date_debut), "dd MMM", { locale: fr })} -{" "}
                            {format(new Date(formation.date_fin), "dd MMM yyyy", { locale: fr })} ·{" "}
                            {formation.nb_participants_inscrits} participants
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(formation)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Budget
                        </Button>
                      </div>

                      {hasBudgetData ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Budget Prévu</p>
                              <p className="text-lg font-semibold">
                                {formatCurrency(formation.budget_prevu || 0)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Budget Réel</p>
                              <p className="text-lg font-semibold">
                                {formatCurrency(formation.budget_reel || 0)}
                              </p>
                              {formation.budget_prevu && formation.budget_reel && (
                                <p
                                  className={`text-xs flex items-center gap-1 ${
                                    ecartFormation > 0 ? "text-red-600" : "text-green-600"
                                  }`}
                                >
                                  {ecartFormation > 0 ? "+" : ""}
                                  {ecartPctFormation.toFixed(0)}%
                                </p>
                              )}
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Écart</p>
                              <p
                                className={`text-lg font-semibold ${
                                  ecartFormation > 0 ? "text-red-600" : "text-green-600"
                                }`}
                              >
                                {ecartFormation > 0 ? "+" : ""}
                                {formatCurrency(ecartFormation)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">ROI</p>
                              {roi !== null ? (
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`text-lg font-semibold ${
                                      roi > 0 ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    {roi > 0 ? "+" : ""}
                                    {roi.toFixed(0)}%
                                  </p>
                                  {roi > 0 ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Non calculé</p>
                              )}
                            </div>
                          </div>

                          {formation.budget_reel && formation.nb_participants_inscrits > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                Coût par participant:{" "}
                                <span className="font-semibold">
                                  {formatCurrency(
                                    formation.budget_reel / formation.nb_participants_inscrits
                                  )}
                                </span>
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-2 text-center">
                          <Badge variant="outline" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Budget non renseigné
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Dialog de modification budget */}
      <Dialog open={!!editingFormation} onOpenChange={(open) => !open && setEditingFormation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Budget</DialogTitle>
          </DialogHeader>
          {editingFormation && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold mb-2">{editingFormation.titre}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(editingFormation.date_debut), "dd MMM yyyy", { locale: fr })}
                </p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="budget_prevu">Budget Prévu (FCFA)</Label>
                  <Input
                    id="budget_prevu"
                    type="number"
                    min="0"
                    step="1000"
                    value={budgetForm.budget_prevu}
                    onChange={(e) =>
                      setBudgetForm({ ...budgetForm, budget_prevu: parseFloat(e.target.value) })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="budget_reel">Budget Réel (FCFA)</Label>
                  <Input
                    id="budget_reel"
                    type="number"
                    min="0"
                    step="1000"
                    value={budgetForm.budget_reel}
                    onChange={(e) =>
                      setBudgetForm({ ...budgetForm, budget_reel: parseFloat(e.target.value) })
                    }
                  />
                </div>

                {budgetForm.budget_prevu > 0 && budgetForm.budget_reel > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Écart</p>
                    <p
                      className={`text-lg font-semibold ${
                        budgetForm.budget_reel - budgetForm.budget_prevu > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(budgetForm.budget_reel - budgetForm.budget_prevu)} (
                      {(
                        ((budgetForm.budget_reel - budgetForm.budget_prevu) /
                          budgetForm.budget_prevu) *
                        100
                      ).toFixed(1)}
                      %)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingFormation(null)}>
              Annuler
            </Button>
            <Button onClick={updateBudget}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
