import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Users,
  TrendingUp,
  Award,
  Plus,
  Eye,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Formation {
  id: string;
  titre: string;
  description: string;
  type_formation: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  lieu: string;
  formateur: string;
  nb_participants_max: number;
  nb_participants_inscrits: number;
  priorite: string;
  objectifs: string[];
  indicateurs_cibles: string[];
}

interface Evaluation {
  id: string;
  formation_id: string;
  date_evaluation: string;
  efficacite_avant: number;
  efficacite_apres: number;
  amelioration_pct: number;
  nb_actions_analysees: number;
  indicateurs_impactes: string[];
  notes: string;
}

interface Participant {
  id: string;
  formation_id: string;
  user_id: string;
  statut_participation: string;
  note_satisfaction: number | null;
  commentaires: string | null;
  competences_acquises: string[] | null;
  date_inscription: string;
  date_completion: string | null;
  created_at: string;
  updated_at: string;
}

export function SuiviFormations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [loading, setLoading] = useState(true);
  const [openFormationDialog, setOpenFormationDialog] = useState(false);
  const [openEvaluationDialog, setOpenEvaluationDialog] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);

  const [newFormation, setNewFormation] = useState({
    titre: "",
    description: "",
    type_formation: "technique",
    date_debut: "",
    date_fin: "",
    lieu: "",
    formateur: "",
    nb_participants_max: 20,
    priorite: "moyenne",
  });

  const [newEvaluation, setNewEvaluation] = useState({
    formation_id: "",
    date_evaluation: format(new Date(), "yyyy-MM-dd"),
    periode_avant_debut: "",
    periode_avant_fin: "",
    periode_apres_debut: "",
    periode_apres_fin: "",
    efficacite_avant: 0,
    efficacite_apres: 0,
    nb_actions_analysees: 0,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les formations
      const { data: formationsData, error: formationsError } = await supabase
        .from("formations_planifiees")
        .select("*")
        .order("date_debut", { ascending: false });

      if (formationsError) throw formationsError;
      setFormations(formationsData || []);

      // Charger les évaluations
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from("formations_evaluations")
        .select("*")
        .order("date_evaluation", { ascending: false });

      if (evaluationsError) throw evaluationsError;
      setEvaluations(evaluationsData || []);

      // Charger les participants pour chaque formation
      if (formationsData) {
        for (const formation of formationsData) {
          await loadParticipants(formation.id);
        }
      }
    } catch (error: any) {
      console.error("Erreur chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (formationId: string) => {
    try {
      const { data, error } = await supabase
        .from("formations_participants")
        .select("*")
        .eq("formation_id", formationId);

      if (error) throw error;
      
      setParticipants((prev) => ({
        ...prev,
        [formationId]: data || [],
      }));
    } catch (error: any) {
      console.error("Erreur chargement participants:", error);
    }
  };

  const createFormation = async () => {
    try {
      if (!newFormation.titre || !newFormation.date_debut || !newFormation.date_fin) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      const { error } = await supabase.from("formations_planifiees").insert([
        {
          ...newFormation,
          statut: "planifiee",
        },
      ]);

      if (error) throw error;

      toast.success("Formation créée avec succès");
      setOpenFormationDialog(false);
      loadData();
      
      // Reset form
      setNewFormation({
        titre: "",
        description: "",
        type_formation: "technique",
        date_debut: "",
        date_fin: "",
        lieu: "",
        formateur: "",
        nb_participants_max: 20,
        priorite: "moyenne",
      });
    } catch (error: any) {
      console.error("Erreur création:", error);
      toast.error("Erreur lors de la création de la formation");
    }
  };

  const createEvaluation = async () => {
    try {
      if (!newEvaluation.formation_id || !newEvaluation.periode_avant_debut) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      const { error } = await supabase.from("formations_evaluations").insert([newEvaluation]);

      if (error) throw error;

      toast.success("Évaluation enregistrée avec succès");
      setOpenEvaluationDialog(false);
      loadData();
      
      // Reset form
      setNewEvaluation({
        formation_id: "",
        date_evaluation: format(new Date(), "yyyy-MM-dd"),
        periode_avant_debut: "",
        periode_avant_fin: "",
        periode_apres_debut: "",
        periode_apres_fin: "",
        efficacite_avant: 0,
        efficacite_apres: 0,
        nb_actions_analysees: 0,
        notes: "",
      });
    } catch (error: any) {
      console.error("Erreur création évaluation:", error);
      toast.error("Erreur lors de la création de l'évaluation");
    }
  };

  const updateStatutFormation = async (id: string, statut: string) => {
    try {
      const { error } = await supabase
        .from("formations_planifiees")
        .update({ statut })
        .eq("id", id);

      if (error) throw error;

      toast.success("Statut mis à jour");
      loadData();
    } catch (error: any) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, any> = {
      planifiee: { variant: "outline", icon: Clock },
      en_cours: { variant: "default", icon: TrendingUp },
      terminee: { variant: "secondary", icon: CheckCircle2 },
      annulee: { variant: "destructive", icon: XCircle },
    };
    const config = variants[statut] || variants.planifiee;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {statut.replace("_", " ")}
      </Badge>
    );
  };

  const getPrioriteBadge = (priorite: string) => {
    const variants: Record<string, any> = {
      haute: "destructive",
      moyenne: "default",
      basse: "secondary",
    };
    return <Badge variant={variants[priorite]}>{priorite}</Badge>;
  };

  // Calcul des indicateurs globaux
  const tauxCompletion = formations.length > 0
    ? ((formations.filter((f) => f.statut === "terminee").length / formations.length) * 100).toFixed(0)
    : 0;

  const tauxParticipation = formations.length > 0
    ? (
        (formations.reduce((sum, f) => sum + f.nb_participants_inscrits, 0) /
          formations.reduce((sum, f) => sum + (f.nb_participants_max || 0), 0)) *
        100
      ).toFixed(0)
    : 0;

  const ameliorationMoyenne = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + e.amelioration_pct, 0) / evaluations.length).toFixed(1)
    : 0;

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
      {/* Indicateurs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taux de Complétion</p>
              <p className="text-3xl font-bold">{tauxCompletion}%</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taux de Participation</p>
              <p className="text-3xl font-bold">{tauxParticipation}%</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Amélioration Moyenne</p>
              <p className="text-3xl font-bold">+{ameliorationMoyenne}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Suivi des Formations</h2>
              <p className="text-sm text-muted-foreground">
                {formations.length} formation(s) · {evaluations.length} évaluation(s)
              </p>
            </div>
          </div>
          <Dialog open={openFormationDialog} onOpenChange={setOpenFormationDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Formation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Planifier une Formation</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="titre">Titre *</Label>
                  <Input
                    id="titre"
                    value={newFormation.titre}
                    onChange={(e) => setNewFormation({ ...newFormation, titre: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newFormation.description}
                    onChange={(e) =>
                      setNewFormation({ ...newFormation, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newFormation.type_formation}
                      onValueChange={(value) =>
                        setNewFormation({ ...newFormation, type_formation: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technique">Technique</SelectItem>
                        <SelectItem value="gestion">Gestion</SelectItem>
                        <SelectItem value="reglementaire">Réglementaire</SelectItem>
                        <SelectItem value="terrain">Terrain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priorite">Priorité</Label>
                    <Select
                      value={newFormation.priorite}
                      onValueChange={(value) =>
                        setNewFormation({ ...newFormation, priorite: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="haute">Haute</SelectItem>
                        <SelectItem value="moyenne">Moyenne</SelectItem>
                        <SelectItem value="basse">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date_debut">Date Début *</Label>
                    <Input
                      id="date_debut"
                      type="date"
                      value={newFormation.date_debut}
                      onChange={(e) =>
                        setNewFormation({ ...newFormation, date_debut: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date_fin">Date Fin *</Label>
                    <Input
                      id="date_fin"
                      type="date"
                      value={newFormation.date_fin}
                      onChange={(e) =>
                        setNewFormation({ ...newFormation, date_fin: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lieu">Lieu</Label>
                    <Input
                      id="lieu"
                      value={newFormation.lieu}
                      onChange={(e) => setNewFormation({ ...newFormation, lieu: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="nb_max">Participants Max</Label>
                    <Input
                      id="nb_max"
                      type="number"
                      value={newFormation.nb_participants_max}
                      onChange={(e) =>
                        setNewFormation({
                          ...newFormation,
                          nb_participants_max: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="formateur">Formateur</Label>
                  <Input
                    id="formateur"
                    value={newFormation.formateur}
                    onChange={(e) =>
                      setNewFormation({ ...newFormation, formateur: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenFormationDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={createFormation}>Créer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="formations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formations">Formations</TabsTrigger>
            <TabsTrigger value="evaluations">
              Évaluations d'Impact
              {evaluations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {evaluations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formations" className="space-y-4">
            {formations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune formation planifiée</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {formations.map((formation) => (
                  <Card key={formation.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{formation.titre}</h3>
                            {getStatutBadge(formation.statut)}
                            {getPrioriteBadge(formation.priorite)}
                          </div>
                          {formation.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {formation.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Dates</p>
                            <p className="text-muted-foreground">
                              {format(new Date(formation.date_debut), "dd MMM", { locale: fr })} -{" "}
                              {format(new Date(formation.date_fin), "dd MMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Participants</p>
                            <p className="text-muted-foreground">
                              {formation.nb_participants_inscrits} / {formation.nb_participants_max}
                            </p>
                          </div>
                        </div>

                        {formation.lieu && (
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Lieu</p>
                              <p className="text-muted-foreground">{formation.lieu}</p>
                            </div>
                          </div>
                        )}

                        {formation.formateur && (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Formateur</p>
                              <p className="text-muted-foreground">{formation.formateur}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Select
                          value={formation.statut}
                          onValueChange={(value) => updateStatutFormation(formation.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planifiee">Planifiée</SelectItem>
                            <SelectItem value="en_cours">En cours</SelectItem>
                            <SelectItem value="terminee">Terminée</SelectItem>
                            <SelectItem value="annulee">Annulée</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            setSelectedFormation(formation.id);
                            setNewEvaluation({ ...newEvaluation, formation_id: formation.id });
                            setOpenEvaluationDialog(true);
                          }}
                        >
                          <BarChart3 className="h-4 w-4" />
                          Évaluer
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Dialog open={openEvaluationDialog} onOpenChange={setOpenEvaluationDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvelle Évaluation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Évaluer l'Impact d'une Formation</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="formation_eval">Formation *</Label>
                      <Select
                        value={newEvaluation.formation_id}
                        onValueChange={(value) =>
                          setNewEvaluation({ ...newEvaluation, formation_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une formation" />
                        </SelectTrigger>
                        <SelectContent>
                          {formations
                            .filter((f) => f.statut === "terminee")
                            .map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.titre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Période AVANT - Début *</Label>
                        <Input
                          type="date"
                          value={newEvaluation.periode_avant_debut}
                          onChange={(e) =>
                            setNewEvaluation({
                              ...newEvaluation,
                              periode_avant_debut: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Période AVANT - Fin *</Label>
                        <Input
                          type="date"
                          value={newEvaluation.periode_avant_fin}
                          onChange={(e) =>
                            setNewEvaluation({
                              ...newEvaluation,
                              periode_avant_fin: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Période APRÈS - Début *</Label>
                        <Input
                          type="date"
                          value={newEvaluation.periode_apres_debut}
                          onChange={(e) =>
                            setNewEvaluation({
                              ...newEvaluation,
                              periode_apres_debut: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Période APRÈS - Fin *</Label>
                        <Input
                          type="date"
                          value={newEvaluation.periode_apres_fin}
                          onChange={(e) =>
                            setNewEvaluation({
                              ...newEvaluation,
                              periode_apres_fin: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>Efficacité Avant (%) *</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={newEvaluation.efficacite_avant}
                          onChange={(e) =>
                            setNewEvaluation({
                              ...newEvaluation,
                              efficacite_avant: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Efficacité Après (%) *</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={newEvaluation.efficacite_apres}
                          onChange={(e) =>
                            setNewEvaluation({
                              ...newEvaluation,
                              efficacite_apres: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Actions Analysées *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={newEvaluation.nb_actions_analysees}
                          onChange={(e) =>
                            setNewEvaluation({
                              ...newEvaluation,
                              nb_actions_analysees: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="notes_eval">Notes et Observations</Label>
                      <Textarea
                        id="notes_eval"
                        value={newEvaluation.notes}
                        onChange={(e) =>
                          setNewEvaluation({ ...newEvaluation, notes: e.target.value })
                        }
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpenEvaluationDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={createEvaluation}>Enregistrer</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {evaluations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune évaluation d'impact disponible</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {evaluations.map((evaluation) => {
                  const formation = formations.find((f) => f.id === evaluation.formation_id);
                  return (
                    <Card key={evaluation.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              {formation?.titre || "Formation"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Évaluation du{" "}
                              {format(new Date(evaluation.date_evaluation), "dd MMMM yyyy", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                          <Badge
                            variant={
                              evaluation.amelioration_pct > 20
                                ? "default"
                                : evaluation.amelioration_pct > 0
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-lg px-3 py-1"
                          >
                            {evaluation.amelioration_pct > 0 ? "+" : ""}
                            {evaluation.amelioration_pct.toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Efficacité Avant</p>
                            <p className="text-xl font-bold">{evaluation.efficacite_avant}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Efficacité Après</p>
                            <p className="text-xl font-bold text-primary">
                              {evaluation.efficacite_apres}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Actions Analysées</p>
                            <p className="text-xl font-bold">{evaluation.nb_actions_analysees}</p>
                          </div>
                        </div>

                        {evaluation.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">{evaluation.notes}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
