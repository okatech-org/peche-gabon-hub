import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CapturesDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mareeId: string;
  navireNom: string;
}

interface Espece {
  id: string;
  nom: string;
  nom_scientifique: string | null;
  categorie: string;
}

interface CaptureDetail {
  id?: string;
  espece_id: string;
  poids_kg: number;
  espece?: Espece;
}

export function CapturesDetailDialog({ open, onOpenChange, mareeId, navireNom }: CapturesDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [especes, setEspeces] = useState<Espece[]>([]);
  const [captures, setCaptures] = useState<CaptureDetail[]>([]);
  const [newCapture, setNewCapture] = useState({
    espece_id: "",
    poids_kg: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, mareeId]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Charger les espèces
      const { data: especesData, error: especesError } = await supabase
        .from("especes")
        .select("*")
        .order("nom");

      if (especesError) throw especesError;
      setEspeces(especesData || []);

      // Charger les captures existantes
      const { data: capturesData, error: capturesError } = await supabase
        .from("captures_industrielles_detail")
        .select(`
          *,
          espece:especes(*)
        `)
        .eq("maree_id", mareeId);

      if (capturesError) throw capturesError;
      setCaptures(capturesData as any || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddCapture = async () => {
    if (!newCapture.espece_id || !newCapture.poids_kg) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("captures_industrielles_detail")
        .insert({
          maree_id: mareeId,
          espece_id: newCapture.espece_id,
          poids_kg: parseFloat(newCapture.poids_kg),
        })
        .select(`
          *,
          espece:especes(*)
        `)
        .single();

      if (error) throw error;

      setCaptures([...captures, data as any]);
      setNewCapture({ espece_id: "", poids_kg: "" });
      toast.success("Capture ajoutée");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'ajout de la capture");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCapture = async (captureId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("captures_industrielles_detail")
        .delete()
        .eq("id", captureId);

      if (error) throw error;

      setCaptures(captures.filter(c => c.id !== captureId));
      toast.success("Capture supprimée");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const totalCaptures = captures.reduce((sum, c) => sum + c.poids_kg, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détail des Captures par Espèce</DialogTitle>
          <DialogDescription>
            Marée du navire {navireNom}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Formulaire d'ajout */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une capture
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Espèce *</Label>
                  <Select
                    value={newCapture.espece_id}
                    onValueChange={(value) => setNewCapture({ ...newCapture, espece_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une espèce" />
                    </SelectTrigger>
                    <SelectContent>
                      {especes.map((espece) => (
                        <SelectItem key={espece.id} value={espece.id}>
                          <div className="flex items-center gap-2">
                            <span>{espece.nom}</span>
                            {espece.nom_scientifique && (
                              <span className="text-xs text-muted-foreground italic">
                                ({espece.nom_scientifique})
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {espece.categorie}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Poids (kg) *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newCapture.poids_kg}
                      onChange={(e) => setNewCapture({ ...newCapture, poids_kg: e.target.value })}
                      placeholder="0.00"
                    />
                    <Button
                      onClick={handleAddCapture}
                      disabled={loading || !newCapture.espece_id || !newCapture.poids_kg}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des captures */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">
                  Captures enregistrées ({captures.length})
                </h4>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold text-lg">{totalCaptures.toLocaleString()} kg</span>
                </div>
              </div>

              {captures.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">
                    Aucune capture enregistrée pour cette marée
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Espèce</TableHead>
                        <TableHead>Nom scientifique</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Poids (kg)</TableHead>
                        <TableHead className="text-right">% Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {captures.map((capture) => (
                        <TableRow key={capture.id}>
                          <TableCell className="font-medium">
                            {capture.espece?.nom || "-"}
                          </TableCell>
                          <TableCell className="text-sm italic text-muted-foreground">
                            {capture.espece?.nom_scientifique || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {capture.espece?.categorie || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {capture.poids_kg.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {totalCaptures > 0 
                              ? ((capture.poids_kg / totalCaptures) * 100).toFixed(1)
                              : "0"}%
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => capture.id && handleDeleteCapture(capture.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
