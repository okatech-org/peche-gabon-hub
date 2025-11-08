import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ValidationStats } from "./ValidationStats";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  XCircle,
  Edit2,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Target,
  Clock,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface FormationValidation {
  id: string;
  titre: string;
  description: string | null;
  type_formation: string;
  date_debut: string;
  date_fin: string;
  formateur_id: string;
  formateur_nom: string;
  priorite: string;
  urgence: number;
  raison_prediction: string;
  objectifs: string[];
  participants_cibles: string[];
  indicateurs_cibles: string[];
  nb_participants_max: number;
  score_adequation_formateur: number;
  score_confiance_prediction: number;
  statut: string;
  notes_revision: string | null;
  created_at: string;
}

export function ValidationFormations() {
  const [loading, setLoading] = useState(true);
  const [formationsEnAttente, setFormationsEnAttente] = useState<FormationValidation[]>([]);
  const [formationsApprouvees, setFormationsApprouvees] = useState<FormationValidation[]>([]);
  const [formationsRejetees, setFormationsRejetees] = useState<FormationValidation[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<FormationValidation | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'edit' | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [editedFormation, setEditedFormation] = useState<Partial<FormationValidation>>({});

  useEffect(() => {
    loadFormations();
  }, []);

  const loadFormations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("formations_validation")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enAttente = data?.filter((f) => f.statut === "en_attente") || [];
      const approuvees = data?.filter((f) => f.statut === "approuvee") || [];
      const rejetees = data?.filter((f) => f.statut === "rejetee") || [];

      setFormationsEnAttente(enAttente);
      setFormationsApprouvees(approuvees);
      setFormationsRejetees(rejetees);
    } catch (error) {
      console.error("Erreur chargement:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedFormation) return;

    try {
      setProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Créer la formation dans la table principale
      const formationData = {
        titre: selectedFormation.titre,
        description: selectedFormation.description,
        type_formation: selectedFormation.type_formation,
        date_debut: selectedFormation.date_debut,
        date_fin: selectedFormation.date_fin,
        formateur_id: selectedFormation.formateur_id,
        statut: "planifiee",
        priorite: selectedFormation.priorite,
        objectifs: selectedFormation.objectifs,
        participants_cibles: selectedFormation.participants_cibles,
        indicateurs_cibles: selectedFormation.indicateurs_cibles,
        nb_participants_max: selectedFormation.nb_participants_max,
        created_by: user.id,
      };

      const { error: insertError } = await supabase
        .from("formations_planifiees")
        .insert(formationData);

      if (insertError) throw insertError;

      // Mettre à jour le statut dans la table de validation
      const { error: updateError } = await supabase
        .from("formations_validation")
        .update({
          statut: "approuvee",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          notes_revision: notes,
        })
        .eq("id", selectedFormation.id);

      if (updateError) throw updateError;

      toast.success("Formation approuvée et créée dans le calendrier");
      setActionDialog(null);
      setSelectedFormation(null);
      setNotes("");
      loadFormations();
    } catch (error) {
      console.error("Erreur approbation:", error);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedFormation) return;

    try {
      setProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("formations_validation")
        .update({
          statut: "rejetee",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          notes_revision: notes,
        })
        .eq("id", selectedFormation.id);

      if (error) throw error;

      toast.success("Formation rejetée");
      setActionDialog(null);
      setSelectedFormation(null);
      setNotes("");
      loadFormations();
    } catch (error) {
      console.error("Erreur rejet:", error);
      toast.error("Erreur lors du rejet");
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedFormation) return;

    try {
      setProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("formations_validation")
        .update({
          ...editedFormation,
          statut: "modifiee",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          notes_revision: notes,
        })
        .eq("id", selectedFormation.id);

      if (error) throw error;

      toast.success("Formation modifiée");
      setActionDialog(null);
      setSelectedFormation(null);
      setNotes("");
      setEditedFormation({});
      loadFormations();
    } catch (error) {
      console.error("Erreur modification:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (formation: FormationValidation, action: 'approve' | 'reject' | 'edit') => {
    setSelectedFormation(formation);
    setActionDialog(action);
    if (action === 'edit') {
      setEditedFormation({
        titre: formation.titre,
        date_debut: formation.date_debut,
        date_fin: formation.date_fin,
        nb_participants_max: formation.nb_participants_max,
      });
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'haute':
        return 'destructive';
      case 'moyenne':
        return 'secondary';
      case 'basse':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const renderFormationCard = (formation: FormationValidation, showActions: boolean = true) => (
    <Card key={formation.id} className={formation.priorite === 'haute' ? 'border-red-500' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={getPrioriteColor(formation.priorite)}>
                Priorité {formation.priorite}
              </Badge>
              <Badge variant="outline">{formation.type_formation}</Badge>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3" />
                <span>Urgence: {formation.urgence}/100</span>
              </div>
            </div>
            <CardTitle className="text-lg">{formation.titre}</CardTitle>
            <CardDescription>{formation.raison_prediction}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Dates</div>
              <div className="text-muted-foreground">
                {format(new Date(formation.date_debut), "dd MMM", { locale: fr })} -{" "}
                {format(new Date(formation.date_fin), "dd MMM yyyy", { locale: fr })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Formateur</div>
              <div className="text-muted-foreground">{formation.formateur_nom}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Score formateur</div>
              <div className="text-primary font-bold">{formation.score_adequation_formateur}/100</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Confiance IA</div>
              <div className="text-primary font-bold">{formation.score_confiance_prediction}%</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Objectifs:</div>
          <ul className="space-y-1">
            {formation.objectifs.map((obj, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Indicateurs ciblés:</div>
          <div className="flex flex-wrap gap-1">
            {formation.indicateurs_cibles.map((ind, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {ind}
              </Badge>
            ))}
          </div>
        </div>

        {formation.notes_revision && (
          <div className="pt-2 border-t">
            <div className="text-sm font-medium mb-1">Notes de révision:</div>
            <p className="text-sm text-muted-foreground">{formation.notes_revision}</p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="default"
              onClick={() => openActionDialog(formation, 'approve')}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approuver
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openActionDialog(formation, 'edit')}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => openActionDialog(formation, 'reject')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" id="validation">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Validation des Formations IA
              </CardTitle>
              <CardDescription>
                Révisez et approuvez les formations suggérées par l'IA
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadFormations}>
              Actualiser
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">En attente</div>
                <div className="text-2xl font-bold">{formationsEnAttente.length}</div>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Approuvées</div>
                <div className="text-2xl font-bold">{formationsApprouvees.length}</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Rejetées</div>
                <div className="text-2xl font-bold">{formationsRejetees.length}</div>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attente">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attente">
            En attente ({formationsEnAttente.length})
          </TabsTrigger>
          <TabsTrigger value="approuvees">
            Approuvées ({formationsApprouvees.length})
          </TabsTrigger>
          <TabsTrigger value="rejetees">
            Rejetées ({formationsRejetees.length})
          </TabsTrigger>
          <TabsTrigger value="stats">
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attente" className="space-y-4 mt-4">
          {formationsEnAttente.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Aucune formation en attente de validation
              </CardContent>
            </Card>
          ) : (
            formationsEnAttente.map((formation) => renderFormationCard(formation, true))
          )}
        </TabsContent>

        <TabsContent value="approuvees" className="space-y-4 mt-4">
          {formationsApprouvees.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Aucune formation approuvée
              </CardContent>
            </Card>
          ) : (
            formationsApprouvees.map((formation) => renderFormationCard(formation, false))
          )}
        </TabsContent>

        <TabsContent value="rejetees" className="space-y-4 mt-4">
          {formationsRejetees.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Aucune formation rejetée
              </CardContent>
            </Card>
          ) : (
            formationsRejetees.map((formation) => renderFormationCard(formation, false))
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <ValidationStats />
        </TabsContent>
      </Tabs>

      {/* Dialog d'action */}
      <Dialog
        open={actionDialog !== null}
        onOpenChange={() => {
          setActionDialog(null);
          setSelectedFormation(null);
          setNotes("");
          setEditedFormation({});
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionDialog === 'approve' && 'Approuver la formation'}
              {actionDialog === 'reject' && 'Rejeter la formation'}
              {actionDialog === 'edit' && 'Modifier la formation'}
            </DialogTitle>
            <DialogDescription>
              {selectedFormation?.titre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionDialog === 'edit' && (
              <div className="space-y-3">
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={editedFormation.titre || ''}
                    onChange={(e) => setEditedFormation({ ...editedFormation, titre: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date début</Label>
                    <Input
                      type="date"
                      value={editedFormation.date_debut || ''}
                      onChange={(e) => setEditedFormation({ ...editedFormation, date_debut: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Date fin</Label>
                    <Input
                      type="date"
                      value={editedFormation.date_fin || ''}
                      onChange={(e) => setEditedFormation({ ...editedFormation, date_fin: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Nombre max de participants</Label>
                  <Input
                    type="number"
                    value={editedFormation.nb_participants_max || 20}
                    onChange={(e) => setEditedFormation({ ...editedFormation, nb_participants_max: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Notes de révision {actionDialog === 'reject' && '(obligatoire)'}</Label>
              <Textarea
                placeholder="Ajoutez vos notes ou commentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog(null);
                setSelectedFormation(null);
                setNotes("");
                setEditedFormation({});
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (actionDialog === 'approve') handleApprove();
                if (actionDialog === 'reject') handleReject();
                if (actionDialog === 'edit') handleEdit();
              }}
              disabled={processing || (actionDialog === 'reject' && !notes)}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  {actionDialog === 'approve' && <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {actionDialog === 'reject' && <XCircle className="h-4 w-4 mr-2" />}
                  {actionDialog === 'edit' && <Edit2 className="h-4 w-4 mr-2" />}
                </>
              )}
              {actionDialog === 'approve' && 'Approuver'}
              {actionDialog === 'reject' && 'Rejeter'}
              {actionDialog === 'edit' && 'Modifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
