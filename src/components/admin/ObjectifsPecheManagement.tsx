import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Objectif {
  id: string;
  pirogue_id: string;
  annee: number;
  objectif_kg_annuel: number;
  objectif_kg_mensuel: number;
  date_attribution_pirogue: string;
  statut: string;
  notes: string | null;
  pirogues?: {
    nom: string;
    immatriculation: string;
  };
}

interface Pirogue {
  id: string;
  nom: string;
  immatriculation: string;
}

export function ObjectifsPecheManagement() {
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [pirogues, setPirogues] = useState<Pirogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObjectif, setEditingObjectif] = useState<Objectif | null>(null);
  
  const [formData, setFormData] = useState({
    pirogue_id: "",
    annee: new Date().getFullYear(),
    objectif_kg_annuel: "",
    date_attribution_pirogue: new Date(),
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [objectifsRes, piroguesRes] = await Promise.all([
        supabase
          .from("objectifs_peche")
          .select(`
            *,
            pirogues(nom, immatriculation)
          `)
          .order("annee", { ascending: false }),
        supabase
          .from("pirogues")
          .select("id, nom, immatriculation")
          .eq("statut", "active")
          .order("nom"),
      ]);

      if (objectifsRes.error) throw objectifsRes.error;
      if (piroguesRes.error) throw piroguesRes.error;

      setObjectifs(objectifsRes.data || []);
      setPirogues(piroguesRes.data || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const objectif_kg_mensuel = parseFloat(formData.objectif_kg_annuel) / 12;
      
      const dataToSave = {
        pirogue_id: formData.pirogue_id,
        annee: formData.annee,
        objectif_kg_annuel: parseFloat(formData.objectif_kg_annuel),
        objectif_kg_mensuel,
        date_attribution_pirogue: format(formData.date_attribution_pirogue, "yyyy-MM-dd"),
        notes: formData.notes || null,
        statut: "actif",
      };

      if (editingObjectif) {
        const { error } = await supabase
          .from("objectifs_peche")
          .update(dataToSave)
          .eq("id", editingObjectif.id);

        if (error) throw error;
        toast.success("Objectif mis à jour avec succès");
      } else {
        const { error } = await supabase
          .from("objectifs_peche")
          .insert(dataToSave);

        if (error) throw error;
        toast.success("Objectif créé avec succès");
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
    }
  };

  const resetForm = () => {
    setFormData({
      pirogue_id: "",
      annee: new Date().getFullYear(),
      objectif_kg_annuel: "",
      date_attribution_pirogue: new Date(),
      notes: "",
    });
    setEditingObjectif(null);
  };

  const openEditDialog = (objectif: Objectif) => {
    setEditingObjectif(objectif);
    setFormData({
      pirogue_id: objectif.pirogue_id,
      annee: objectif.annee,
      objectif_kg_annuel: objectif.objectif_kg_annuel.toString(),
      date_attribution_pirogue: new Date(objectif.date_attribution_pirogue),
      notes: objectif.notes || "",
    });
    setDialogOpen(true);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "actif":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "termine":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
      case "suspendu":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectifs de Pêche
            </CardTitle>
            <CardDescription>
              Gestion des objectifs pour les pirogues attribuées par l'État
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Objectif
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingObjectif ? "Modifier l'objectif" : "Nouvel objectif de pêche"}
                </DialogTitle>
                <DialogDescription>
                  Définir l'objectif annuel de capture pour une pirogue
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pirogue_id">Pirogue *</Label>
                  <Select
                    value={formData.pirogue_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, pirogue_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une pirogue" />
                    </SelectTrigger>
                    <SelectContent>
                      {pirogues.map((pirogue) => (
                        <SelectItem key={pirogue.id} value={pirogue.id}>
                          {pirogue.nom} ({pirogue.immatriculation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annee">Année *</Label>
                  <Input
                    id="annee"
                    type="number"
                    min="2020"
                    max="2050"
                    value={formData.annee}
                    onChange={(e) =>
                      setFormData({ ...formData, annee: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectif_kg_annuel">Objectif annuel (kg) *</Label>
                  <Input
                    id="objectif_kg_annuel"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.objectif_kg_annuel}
                    onChange={(e) =>
                      setFormData({ ...formData, objectif_kg_annuel: e.target.value })
                    }
                    required
                  />
                  {formData.objectif_kg_annuel && (
                    <p className="text-sm text-muted-foreground">
                      Objectif mensuel: {(parseFloat(formData.objectif_kg_annuel) / 12).toFixed(2)} kg
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Date d'attribution *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date_attribution_pirogue && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date_attribution_pirogue ? (
                          format(formData.date_attribution_pirogue, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date_attribution_pirogue}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, date_attribution_pirogue: date })
                        }
                        locale={fr}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Notes additionnelles..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingObjectif ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pirogue</TableHead>
                <TableHead>Année</TableHead>
                <TableHead className="text-right">Objectif Annuel</TableHead>
                <TableHead className="text-right">Objectif Mensuel</TableHead>
                <TableHead>Date Attribution</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objectifs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun objectif défini
                  </TableCell>
                </TableRow>
              ) : (
                objectifs.map((objectif) => (
                  <TableRow key={objectif.id}>
                    <TableCell className="font-medium">
                      {objectif.pirogues?.nom || "N/A"}
                      <div className="text-sm text-muted-foreground">
                        {objectif.pirogues?.immatriculation}
                      </div>
                    </TableCell>
                    <TableCell>{objectif.annee}</TableCell>
                    <TableCell className="text-right">
                      {objectif.objectif_kg_annuel.toLocaleString()} kg
                    </TableCell>
                    <TableCell className="text-right">
                      {objectif.objectif_kg_mensuel.toLocaleString()} kg
                    </TableCell>
                    <TableCell>
                      {format(new Date(objectif.date_attribution_pirogue), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatutColor(objectif.statut)}>
                        {objectif.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(objectif)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
