import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Calendar,
  Star,
  Loader2,
  Award,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  specialites: string[];
  bio: string | null;
  statut: string;
  note_moyenne: number | null;
  nb_formations_donnees: number;
  created_at: string;
}

interface Disponibilite {
  id: string;
  formateur_id: string;
  date_debut: string;
  date_fin: string;
  disponible: boolean;
  notes: string | null;
}

interface Evaluation {
  id: string;
  formateur_id: string;
  formation_id: string;
  note_pedagogie: number;
  note_expertise: number;
  note_communication: number;
  note_organisation: number;
  note_globale: number;
  commentaires: string | null;
  points_forts: string | null;
  points_amelioration: string | null;
  date_evaluation: string;
}

export function GestionFormateurs() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedFormateur, setSelectedFormateur] = useState<Formateur | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDispoDialogOpen, setIsDispoDialogOpen] = useState(false);
  const [isEvalDialogOpen, setIsEvalDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [formateursRes, disponibilitesRes, evaluationsRes] = await Promise.all([
        supabase.from("formateurs").select("*").order("nom"),
        supabase.from("formateurs_disponibilites").select("*").order("date_debut", { ascending: false }),
        supabase.from("formateurs_evaluations").select("*").order("date_evaluation", { ascending: false }),
      ]);

      if (formateursRes.error) throw formateursRes.error;
      if (disponibilitesRes.error) throw disponibilitesRes.error;
      if (evaluationsRes.error) throw evaluationsRes.error;

      setFormateurs(formateursRes.data || []);
      setDisponibilites(disponibilitesRes.data || []);
      setEvaluations(evaluationsRes.data || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFormateur = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const specialites = formData.get("specialites")?.toString().split(",").map(s => s.trim()) || [];

      const { error } = await supabase.from("formateurs").insert({
        nom: formData.get("nom")?.toString(),
        prenom: formData.get("prenom")?.toString(),
        email: formData.get("email")?.toString() || null,
        telephone: formData.get("telephone")?.toString() || null,
        specialites,
        bio: formData.get("bio")?.toString() || null,
        statut: "actif",
      });

      if (error) throw error;

      toast.success("Formateur ajouté");
      setIsAddDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Erreur ajout:", error);
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleAddDisponibilite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFormateur) return;

    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from("formateurs_disponibilites").insert({
        formateur_id: selectedFormateur.id,
        date_debut: formData.get("date_debut")?.toString(),
        date_fin: formData.get("date_fin")?.toString(),
        disponible: formData.get("disponible") === "on",
        notes: formData.get("notes")?.toString() || null,
      });

      if (error) throw error;

      toast.success("Disponibilité ajoutée");
      setIsDispoDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Erreur ajout disponibilité:", error);
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleAddEvaluation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFormateur) return;

    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from("formateurs_evaluations").insert({
        formateur_id: selectedFormateur.id,
        formation_id: formData.get("formation_id")?.toString(),
        note_pedagogie: parseInt(formData.get("note_pedagogie")?.toString() || "3"),
        note_expertise: parseInt(formData.get("note_expertise")?.toString() || "3"),
        note_communication: parseInt(formData.get("note_communication")?.toString() || "3"),
        note_organisation: parseInt(formData.get("note_organisation")?.toString() || "3"),
        commentaires: formData.get("commentaires")?.toString() || null,
        points_forts: formData.get("points_forts")?.toString() || null,
        points_amelioration: formData.get("points_amelioration")?.toString() || null,
        evaluateur_id: user?.id,
      });

      if (error) throw error;

      toast.success("Évaluation ajoutée");
      setIsEvalDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Erreur ajout évaluation:", error);
      toast.error("Erreur lors de l'ajout");
    }
  };

  const getDisponibilitesFormateur = (formateurId: string) => {
    return disponibilites.filter((d) => d.formateur_id === formateurId);
  };

  const getEvaluationsFormateur = (formateurId: string) => {
    return evaluations.filter((e) => e.formateur_id === formateurId);
  };

  const renderStars = (note: number | null) => {
    if (!note) return <span className="text-muted-foreground">N/A</span>;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i <= note ? "fill-yellow-400 text-yellow-400" : "text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

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
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Formateurs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formateurs.length}</div>
            <p className="text-xs text-muted-foreground">
              {formateurs.filter((f) => f.statut === "actif").length} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                formateurs
                  .filter((f) => f.note_moyenne)
                  .reduce((sum, f) => sum + (f.note_moyenne || 0), 0) /
                formateurs.filter((f) => f.note_moyenne).length || 0
              ).toFixed(1)}{" "}
              / 5
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formations Données</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formateurs.reduce((sum, f) => sum + f.nb_formations_donnees, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilités</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {disponibilites.filter((d) => d.disponible).length}
            </div>
            <p className="text-xs text-muted-foreground">Créneaux disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un Formateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouveau Formateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddFormateur} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input id="nom" name="nom" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input id="prenom" name="prenom" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" name="telephone" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialites">Spécialités (séparées par des virgules)</Label>
                <Input
                  id="specialites"
                  name="specialites"
                  placeholder="Ex: Gestion, Qualité, Sécurité"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biographie</Label>
                <Textarea id="bio" name="bio" rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Ajouter</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des formateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Formateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Spécialités</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Formations</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formateurs.map((formateur) => (
                <TableRow key={formateur.id}>
                  <TableCell className="font-medium">
                    {formateur.prenom} {formateur.nom}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formateur.email && <div>{formateur.email}</div>}
                      {formateur.telephone && <div>{formateur.telephone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {formateur.specialites.map((spec, i) => (
                        <Badge key={i} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(formateur.note_moyenne)}</TableCell>
                  <TableCell>{formateur.nb_formations_donnees}</TableCell>
                  <TableCell>
                    <Badge
                      variant={formateur.statut === "actif" ? "default" : "secondary"}
                    >
                      {formateur.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFormateur(formateur)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>
                            {formateur.prenom} {formateur.nom}
                          </DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="info">
                          <TabsList>
                            <TabsTrigger value="info">Informations</TabsTrigger>
                            <TabsTrigger value="disponibilites">
                              Disponibilités
                            </TabsTrigger>
                            <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
                          </TabsList>

                          <TabsContent value="info" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm">{formateur.email || "N/A"}</p>
                              </div>
                              <div>
                                <Label>Téléphone</Label>
                                <p className="text-sm">{formateur.telephone || "N/A"}</p>
                              </div>
                            </div>
                            <div>
                              <Label>Biographie</Label>
                              <p className="text-sm">{formateur.bio || "N/A"}</p>
                            </div>
                            <div>
                              <Label>Performance</Label>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <Card>
                                  <CardContent className="pt-6">
                                    <div className="text-2xl font-bold">
                                      {formateur.note_moyenne?.toFixed(1) || "N/A"}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Note moyenne
                                    </p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="pt-6">
                                    <div className="text-2xl font-bold">
                                      {formateur.nb_formations_donnees}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Formations données
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="disponibilites" className="space-y-4">
                            <div className="flex justify-end">
                              <Dialog
                                open={isDispoDialogOpen}
                                onOpenChange={setIsDispoDialogOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Nouvelle Disponibilité</DialogTitle>
                                  </DialogHeader>
                                  <form
                                    onSubmit={handleAddDisponibilite}
                                    className="space-y-4"
                                  >
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="date_debut">Date Début *</Label>
                                        <Input
                                          id="date_debut"
                                          name="date_debut"
                                          type="date"
                                          required
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="date_fin">Date Fin *</Label>
                                        <Input
                                          id="date_fin"
                                          name="date_fin"
                                          type="date"
                                          required
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id="disponible"
                                        name="disponible"
                                        defaultChecked
                                      />
                                      <Label htmlFor="disponible">Disponible</Label>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="notes">Notes</Label>
                                      <Textarea id="notes" name="notes" rows={2} />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDispoDialogOpen(false)}
                                      >
                                        Annuler
                                      </Button>
                                      <Button type="submit">Ajouter</Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="space-y-2">
                              {getDisponibilitesFormateur(formateur.id).map((dispo) => (
                                <Card key={dispo.id}>
                                  <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-medium">
                                          {format(new Date(dispo.date_debut), "dd MMM yyyy", { locale: fr })} -{" "}
                                          {format(new Date(dispo.date_fin), "dd MMM yyyy", { locale: fr })}
                                        </div>
                                        {dispo.notes && (
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {dispo.notes}
                                          </p>
                                        )}
                                      </div>
                                      <Badge variant={dispo.disponible ? "default" : "secondary"}>
                                        {dispo.disponible ? "Disponible" : "Indisponible"}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="evaluations" className="space-y-4">
                            <div className="space-y-2">
                              {getEvaluationsFormateur(formateur.id).map((evaluation) => (
                                <Card key={evaluation.id}>
                                  <CardContent className="pt-6 space-y-3">
                                    <div className="flex justify-between items-start">
                                      <div className="text-sm text-muted-foreground">
                                        {format(new Date(evaluation.date_evaluation), "dd MMMM yyyy", { locale: fr })}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold">{evaluation.note_globale.toFixed(1)}</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <div className="text-muted-foreground">Pédagogie</div>
                                        <div className="font-medium">{evaluation.note_pedagogie}/5</div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">Expertise</div>
                                        <div className="font-medium">{evaluation.note_expertise}/5</div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">Communication</div>
                                        <div className="font-medium">{evaluation.note_communication}/5</div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">Organisation</div>
                                        <div className="font-medium">{evaluation.note_organisation}/5</div>
                                      </div>
                                    </div>
                                    {evaluation.commentaires && (
                                      <div>
                                        <div className="text-sm font-medium">Commentaires</div>
                                        <p className="text-sm text-muted-foreground">{evaluation.commentaires}</p>
                                      </div>
                                    )}
                                    {evaluation.points_forts && (
                                      <div>
                                        <div className="text-sm font-medium text-green-600">Points forts</div>
                                        <p className="text-sm text-muted-foreground">{evaluation.points_forts}</p>
                                      </div>
                                    )}
                                    {evaluation.points_amelioration && (
                                      <div>
                                        <div className="text-sm font-medium text-orange-600">Points d'amélioration</div>
                                        <p className="text-sm text-muted-foreground">{evaluation.points_amelioration}</p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
