import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DeclarerMareeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Navire {
  id: string;
  nom: string;
  matricule: string;
}

export function DeclarerMareeDialog({ open, onOpenChange, onSuccess }: DeclarerMareeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [navires, setNavires] = useState<Navire[]>([]);
  const [formData, setFormData] = useState({
    navire_id: "",
    date_depart: "",
    date_retour: "",
    zone_peche: "",
    capture_totale_kg: "",
    jours_peche: "",
  });

  useEffect(() => {
    if (open) {
      loadNavires();
    }
  }, [open]);

  const loadNavires = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: armementData } = await supabase
        .from("armements")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!armementData) return;

      const { data: naviresData, error } = await supabase
        .from("navires")
        .select("id, nom, matricule")
        .eq("armement_id", armementData.id)
        .eq("statut", "active")
        .order("nom");

      if (error) throw error;
      setNavires(naviresData || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des navires");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateDepart = new Date(formData.date_depart);
      const dateRetour = formData.date_retour ? new Date(formData.date_retour) : null;
      
      let dureeMerJours = null;
      let cpueMoyenne = null;

      if (dateRetour) {
        dureeMerJours = Math.ceil((dateRetour.getTime() - dateDepart.getTime()) / (1000 * 60 * 60 * 24));
      }

      if (formData.jours_peche && formData.capture_totale_kg) {
        cpueMoyenne = parseFloat(formData.capture_totale_kg) / parseInt(formData.jours_peche);
      }

      const { error } = await supabase.from("marees_industrielles").insert({
        navire_id: formData.navire_id,
        date_depart: formData.date_depart,
        date_retour: formData.date_retour || null,
        zone_peche: formData.zone_peche,
        capture_totale_kg: formData.capture_totale_kg ? parseFloat(formData.capture_totale_kg) : null,
        jours_peche: formData.jours_peche ? parseInt(formData.jours_peche) : null,
        duree_mer_jours: dureeMerJours,
        cpue_moyenne: cpueMoyenne,
      });

      if (error) throw error;

      toast.success("Marée déclarée avec succès");
      onSuccess();
      onOpenChange(false);
      setFormData({
        navire_id: "",
        date_depart: "",
        date_retour: "",
        zone_peche: "",
        capture_totale_kg: "",
        jours_peche: "",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la déclaration de la marée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Déclarer une Marée</DialogTitle>
          <DialogDescription>
            Enregistrez les informations d'une campagne de pêche
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="navire">Navire *</Label>
              <Select
                value={formData.navire_id}
                onValueChange={(value) => setFormData({ ...formData, navire_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un navire" />
                </SelectTrigger>
                <SelectContent>
                  {navires.map((navire) => (
                    <SelectItem key={navire.id} value={navire.id}>
                      {navire.nom} ({navire.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone_peche">Zone de Pêche</Label>
              <Input
                id="zone_peche"
                value={formData.zone_peche}
                onChange={(e) => setFormData({ ...formData, zone_peche: e.target.value })}
                placeholder="Ex: Zone A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_depart">Date de Départ *</Label>
              <Input
                id="date_depart"
                type="date"
                value={formData.date_depart}
                onChange={(e) => setFormData({ ...formData, date_depart: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_retour">Date de Retour</Label>
              <Input
                id="date_retour"
                type="date"
                value={formData.date_retour}
                onChange={(e) => setFormData({ ...formData, date_retour: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jours_peche">Jours de Pêche</Label>
              <Input
                id="jours_peche"
                type="number"
                min="0"
                value={formData.jours_peche}
                onChange={(e) => setFormData({ ...formData, jours_peche: e.target.value })}
                placeholder="Nombre de jours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capture_totale_kg">Captures Totales (kg)</Label>
              <Input
                id="capture_totale_kg"
                type="number"
                min="0"
                step="0.01"
                value={formData.capture_totale_kg}
                onChange={(e) => setFormData({ ...formData, capture_totale_kg: e.target.value })}
                placeholder="Poids total"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Déclarer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
