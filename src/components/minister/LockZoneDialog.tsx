import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LockZoneDialog = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    raison: "",
    dateDebut: "",
    dateFin: "",
    coordinates: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse coordinates (expecting format: lat1,lng1;lat2,lng2;...)
      const coordsArray = formData.coordinates
        .split(';')
        .map(coord => {
          const [lat, lng] = coord.trim().split(',').map(Number);
          return [lng, lat]; // GeoJSON format: [longitude, latitude]
        });

      const geometrie = {
        type: "Polygon",
        coordinates: [coordsArray]
      };

      const { error } = await supabase
        .from("zones_restreintes")
        .insert({
          nom: formData.nom,
          geometrie,
          raison: formData.raison,
          date_debut: formData.dateDebut,
          date_fin: formData.dateFin || null,
          especes_concernees: [],
        });

      if (error) throw error;

      // Log l'action
      await supabase.rpc("log_action_ministerielle", {
        _action_type: "VERROUILLAGE_ZONE",
        _description: `Zone verrouillée: ${formData.nom}`,
        _metadata: { 
          raison: formData.raison, 
          date_debut: formData.dateDebut,
          date_fin: formData.dateFin 
        },
      });

      toast({
        title: "Zone verrouillée",
        description: "La zone de pêche a été verrouillée. Les notifications ont été envoyées.",
      });

      setOpen(false);
      setFormData({
        nom: "",
        raison: "",
        dateDebut: "",
        dateFin: "",
        coordinates: "",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de verrouiller la zone.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-24 flex flex-col gap-2" variant="outline">
          <MapPin className="h-6 w-6" />
          Verrouiller une Zone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verrouiller Temporairement une Zone de Pêche</DialogTitle>
          <DialogDescription>
            Restreindre l'accès à une zone de pêche pendant une période donnée
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nom">Nom de la zone *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Zone Nord-Estuaire"
              required
            />
          </div>

          <div>
            <Label htmlFor="raison">Raison de la fermeture *</Label>
            <Textarea
              id="raison"
              value={formData.raison}
              onChange={(e) => setFormData({ ...formData, raison: e.target.value })}
              placeholder="Ex: Période de frai, alerte sanitaire, quota atteint..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="coordinates">Coordonnées du polygone *</Label>
            <Textarea
              id="coordinates"
              value={formData.coordinates}
              onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
              placeholder="Format: lat1,lng1;lat2,lng2;lat3,lng3;..."
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Entrez les coordonnées des points du polygone séparés par des points-virgules
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateDebut">Date de début *</Label>
              <Input
                id="dateDebut"
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="dateFin">Date de fin (optionnel)</Label>
              <Input
                id="dateFin"
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Verrouillage..." : "Verrouiller la zone"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LockZoneDialog;
